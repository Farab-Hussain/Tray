// src/services/reminder.service.ts
import { db, admin } from "../config/firebase";
import { sendEmail } from "../utils/email";
import { Logger } from "../utils/logger";

/**
 * Send appointment reminder emails and push notifications
 * Checks for bookings 24 hours before session time
 */
export const sendAppointmentReminders = async () => {
  try {
    Logger.info("Reminder", "", "Starting appointment reminder check...");

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Get bookings that are:
    // 1. Status: accepted, confirmed, or approved
    // 2. Payment status: paid
    // 3. Date/time is approximately 24 hours from now
    // 4. Reminder not sent yet
    const bookingsSnapshot = await db
      .collection("bookings")
      .where("status", "in", ["accepted", "confirmed", "approved"])
      .where("paymentStatus", "==", "paid")
      .get();

    Logger.info("Reminder", "", `Found ${bookingsSnapshot.size} active bookings to check`);

    let remindersSent = 0;

    for (const doc of bookingsSnapshot.docs) {
      const booking = doc.data();
      const bookingId = doc.id;

      // Skip if reminder already sent
      if (booking.reminderSent) {
        continue;
      }

      // Parse booking date and time
      const bookingDate = new Date(booking.date);
      const [hours, minutes] = booking.time.split(":").map(Number);
      bookingDate.setHours(hours, minutes, 0, 0);

      // Check if booking is approximately 24 hours away (±2 hours window)
      const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilBooking >= 22 && hoursUntilBooking <= 26) {
        // Send reminders to both student and consultant
        try {
          // Fetch user details
          const [studentDoc, consultantDoc, serviceDoc] = await Promise.all([
            db.collection("users").doc(booking.studentId).get(),
            db.collection("users").doc(booking.consultantId).get(),
            db.collection("services").doc(booking.serviceId).get().catch(() => null)
          ]);

          const student = studentDoc.data();
          const consultant = consultantDoc.data();
          const service = serviceDoc?.data();

          if (student && consultant) {
            // Format date and time for display
            const formattedDate = bookingDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            const formattedTime = bookingDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });

            // Send email reminder to student
            if (student.email) {
              const studentEmailResult = await sendEmail({
                to: student.email,
                subject: `Reminder: Your session with ${consultant.name || 'Consultant'} tomorrow`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Appointment Reminder</h2>
                    <p>Hi <strong>${student.name || 'Student'}</strong>,</p>
                    <p>This is a reminder that you have an upcoming session:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p><strong>Consultant:</strong> ${consultant.name || 'Consultant'}</p>
                      <p><strong>Service:</strong> ${service?.title || 'Service'}</p>
                      <p><strong>Date:</strong> ${formattedDate}</p>
                      <p><strong>Time:</strong> ${formattedTime}</p>
                      <p><strong>Amount:</strong> $${booking.amount?.toFixed(2) || '0.00'}</p>
                    </div>
                    <p>We look forward to your session!</p>
                    <p>Best regards,<br>The Tray Team</p>
                  </div>
                `
              });
              if (!studentEmailResult.sent) {
                console.warn(`Failed to send reminder email to student ${student.email}: ${studentEmailResult.error}`);
              }
            }

            // Send email reminder to consultant
            if (consultant.email) {
              const consultantEmailResult = await sendEmail({
                to: consultant.email,
                subject: `Reminder: Session with ${student.name || 'Student'} tomorrow`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Appointment Reminder</h2>
                    <p>Hi <strong>${consultant.name || 'Consultant'}</strong>,</p>
                    <p>This is a reminder that you have an upcoming session:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p><strong>Client:</strong> ${student.name || 'Student'}</p>
                      <p><strong>Service:</strong> ${service?.title || 'Service'}</p>
                      <p><strong>Date:</strong> ${formattedDate}</p>
                      <p><strong>Time:</strong> ${formattedTime}</p>
                      <p><strong>Amount:</strong> $${booking.amount?.toFixed(2) || '0.00'}</p>
                    </div>
                    <p>Please be ready for your session!</p>
                    <p>Best regards,<br>The Tray Team</p>
                  </div>
                `
              });
              if (!consultantEmailResult.sent) {
                console.warn(`Failed to send reminder email to consultant ${consultant.email}: ${consultantEmailResult.error}`);
              }
            }

            // Send push notifications to both users
            try {
              // Send notification to student
              await sendReminderNotification(
                booking.studentId,
                bookingId,
                `Your session with ${consultant.name || 'Consultant'} is tomorrow at ${formattedTime}`,
                booking.date,
                booking.time
              );

              // Send notification to consultant
              await sendReminderNotification(
                booking.consultantId,
                bookingId,
                `Your session with ${student.name || 'Student'} is tomorrow at ${formattedTime}`,
                booking.date,
                booking.time
              );
            } catch (notifError: any) {
              Logger.warn("Reminder", bookingId, `Failed to send push notifications: ${notifError?.message || notifError}`);
              // Continue even if notifications fail
            }

            // Mark reminder as sent
            await db.collection("bookings").doc(bookingId).update({
              reminderSent: true,
              reminderSentAt: new Date().toISOString(),
            });

            remindersSent++;
            Logger.info("Reminder", bookingId, `Reminder sent for booking on ${formattedDate} at ${formattedTime}`);
          }
        } catch (error: any) {
          Logger.error("Reminder", bookingId, `Failed to send reminder: ${error.message}`, error);
          // Continue with next booking
        }
      }
    }

    Logger.info("Reminder", "", `Reminder check completed. Sent ${remindersSent} reminders.`);
    return { success: true, remindersSent };
  } catch (error: any) {
    Logger.error("Reminder", "", `Error in reminder service: ${error.message}`, error);
    throw error;
  }
};

/**
 * Send push notification reminder to a user
 */
async function sendReminderNotification(
  userId: string,
  bookingId: string,
  message: string,
  bookingDate: string,
  bookingTime: string
) {
  try {
    // Get user's FCM tokens
    const fcmTokensRef = db
      .collection('users')
      .doc(userId)
      .collection('fcmTokens');
    const tokensSnapshot = await fcmTokensRef.get();

    if (tokensSnapshot.empty) {
      return;
    }

    const tokens: string[] = [];
    tokensSnapshot.forEach((doc) => {
      const tokenData = doc.data();
      if (tokenData.fcmToken) {
        tokens.push(tokenData.fcmToken);
      }
    });

    if (tokens.length === 0) {
      return;
    }

    const notification = {
      title: 'Appointment Reminder',
      body: message,
    };

    const data = {
      bookingId,
      type: 'booking_reminder',
      category: 'booking',
      bookingDate,
      bookingTime,
    };

    const messagePayload: admin.messaging.MulticastMessage = {
      tokens,
      notification,
      data,
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'content-available': 1,
            alert: {
              title: notification.title,
              body: notification.body,
            },
            category: 'BOOKING_REMINDER_CATEGORY',
          },
        },
        headers: {
          'apns-priority': '10',
        },
      },
      android: {
        notification: {
          sound: 'default',
          channelId: 'bookings',
          priority: 'high' as const,
          visibility: 'public' as const,
          defaultSound: true,
        },
        priority: 'high' as const,
      },
    };

    await admin.messaging().sendEachForMulticast(messagePayload);
    Logger.info("Reminder", bookingId, `Push notification sent to user ${userId}`);
  } catch (error: any) {
    Logger.warn("Reminder", bookingId, `Failed to send push notification: ${error?.message || error}`);
    // Don't throw - allow reminder process to continue
  }
}

