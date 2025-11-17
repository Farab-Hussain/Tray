// src/controllers/bookingController.ts
import { Request, Response } from "express";
import { db } from "../config/firebase";
import { emailBookingConfirmation, emailConsultantNewBooking } from "../utils/email";
import { stripeClient } from "../utils/stripeClient";
import { getPlatformFeeAmount } from "../services/platformSettings.service";

export const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed", "accepted", "approved"];

interface BookingRecord {
  id: string;
  consultantId: string;
  studentId: string;
  serviceId: string;
  status: string;
  paymentStatus?: string;
  paymentIntentId?: string;
  amount?: number | string;
  date?: string | Date;
  time?: string;
  quantity?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  cancelledAt?: string | Date;
  cancelledBy?: string;
  cancelReason?: string | null;
  refundId?: string | null;
  paymentTransferred?: boolean;
  transferId?: string;
  transferAmount?: number;
  platformFee?: number;
  transferredAt?: string;
}

export interface CancelBookingOptions {
  reason?: string;
  initiatedBy?: string;
}

export interface CancelBookingResult {
  bookingId: string;
  refunded: boolean;
  refundId?: string | null;
  message: string;
  status: string;
  paymentStatus: string;
}

export const cancelBookingInternally = async (
  bookingId: string,
  { reason, initiatedBy }: CancelBookingOptions = {},
): Promise<CancelBookingResult> => {
  const bookingRef = db.collection("bookings").doc(bookingId);
  const bookingDoc = await bookingRef.get();

  if (!bookingDoc.exists) {
    throw new Error("Booking not found");
  }

  const booking = bookingDoc.data() as BookingRecord;

  if (booking.status === "cancelled") {
    return {
      bookingId,
      refunded: booking.paymentStatus === "refunded",
      refundId: booking.refundId || null,
      message: "Booking already cancelled",
      status: booking.status,
      paymentStatus: booking.paymentStatus || "cancelled",
    };
  }

  let refundId: string | null = null;
  let paymentStatus = booking.paymentStatus || "cancelled";
  let refundProcessed = false;

  if (booking.paymentStatus === "paid" && booking.paymentIntentId) {
    try {
      const amountValue =
        typeof booking.amount === "number"
          ? booking.amount
          : typeof booking.amount === "string"
          ? parseFloat(booking.amount)
          : undefined;

      const refund = await stripeClient.refunds.create({
        payment_intent: booking.paymentIntentId,
        reason: "requested_by_customer",
        amount:
          amountValue && !Number.isNaN(amountValue)
            ? Math.round(amountValue * 100)
            : undefined,
        metadata: {
          bookingId,
          initiatedBy: initiatedBy || "system",
        },
      });

      refundId = refund.id;
      paymentStatus = "refunded";
      refundProcessed = true;
    } catch (error: any) {
      console.error(`❌ [cancelBookingInternally] Failed to refund booking ${bookingId}:`, error);
      // Mark as refund_failed but continue so caller can notify support
      paymentStatus = "refund_failed";
    }
  }

  await bookingRef.update({
    status: "cancelled",
    paymentStatus,
    refundId: refundId ?? null,
    cancelledAt: new Date().toISOString(),
    cancelledBy: initiatedBy || "system",
    cancelReason: reason || null,
    updatedAt: new Date().toISOString(),
  });

  return {
    bookingId,
    refunded: refundProcessed,
    refundId,
    message: refundProcessed
      ? "Booking cancelled and payment refunded successfully"
      : paymentStatus === "refund_failed"
      ? "Booking cancelled but refund failed. Manual review required."
      : "Booking cancelled",
    status: "cancelled",
    paymentStatus,
  };
};

// ✅ Create new booking
export const createBooking = async (req: Request, res: Response) => {
  try {
    const {
      consultantId,
      serviceId,
      date,
      time,
      amount,
      quantity,
      status,
      paymentStatus,
      paymentIntentId,
    } = req.body;
    const studentId = (req as any).user.uid;

    console.log('🔍 [createBooking] Creating booking with data:', {
      studentId,
      consultantId,
      serviceId,
      date,
      time,
      amount,
      quantity,
      status,
      paymentStatus
    });

    if (!consultantId || !serviceId || !date || !time || !amount) {
      console.log('❌ [createBooking] Missing required fields');
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newBookingRef = db.collection("bookings").doc();

    const bookingData = {
      id: newBookingRef.id,
      studentId,
      consultantId,
      serviceId,
      date,
      time,
      amount,
      quantity: quantity || 1,
      status: status || "pending",
      paymentStatus: paymentStatus || "unpaid",
      paymentIntentId: paymentIntentId || null,
      createdAt: new Date().toISOString(),
    };

    console.log('💾 [createBooking] Saving booking data:', bookingData);

    await newBookingRef.set(bookingData);

    console.log('✅ [createBooking] Booking created successfully with ID:', newBookingRef.id);

    // Send email notifications if payment is successful
    if (paymentStatus === 'paid') {
      try {
        // Get student and consultant details for email
        const [studentDoc, consultantDoc, serviceDoc] = await Promise.all([
          db.collection("users").doc(studentId).get(),
          db.collection("consultants").doc(consultantId).get(),
          db.collection("services").doc(serviceId).get()
        ]);

        const student = studentDoc.data();
        const consultant = consultantDoc.data();
        const service = serviceDoc.data();

        if (student && consultant && service) {
          // Send confirmation email to student
          await emailBookingConfirmation(
            student.name || 'Student',
            student.email,
            consultant.name || 'Consultant',
            service.title || 'Service',
            date,
            time,
            amount
          );

          // Send notification email to consultant
          await emailConsultantNewBooking(
            consultant.name || 'Consultant',
            consultant.email,
            student.name || 'Student',
            service.title || 'Service',
            date,
            time,
            amount
          );

          console.log('✅ [createBooking] Email notifications sent successfully');
        }
      } catch (emailError) {
        console.error('❌ [createBooking] Email notification failed:', emailError);
        // Don't fail the booking if email fails
      }
    }

    res.status(201).json({
      message: "Booking created successfully",
      bookingId: newBookingRef.id,
    });
  } catch (error: any) {
    console.error("Create booking error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get bookings for a student
export const getStudentBookings = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.uid;
    const snapshot = await db
      .collection("bookings")
      .where("studentId", "==", studentId)
      .get();

    const bookings = snapshot.docs.map((doc) => doc.data());
    res.status(200).json({ bookings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get bookings for a consultant
export const getConsultantBookings = async (req: Request, res: Response) => {
  try {
    const consultantId = (req as any).user.uid;
    const snapshot = await db
      .collection("bookings")
      .where("consultantId", "==", consultantId)
      .get();

    const bookings = snapshot.docs.map((doc) => doc.data());
    res.status(200).json({ bookings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get booked slots for a specific consultant (for students to see which slots are taken)
export const getConsultantBookedSlots = async (req: Request, res: Response) => {
  try {
    const { consultantId } = req.params;
    
    console.log('📅 [getConsultantBookedSlots] Fetching booked slots for consultant:', consultantId);

    if (!consultantId) {
      return res.status(400).json({ error: "Consultant ID is required" });
    }

    // Fetch all bookings for this consultant (excluding rejected and cancelled)
    const snapshot = await db
      .collection("bookings")
      .where("consultantId", "==", consultantId)
      .get();

    console.log('📋 [getConsultantBookedSlots] Found all bookings:', snapshot.size);

    const now = new Date();
    const bookedSlots: Array<{ date: string; time: string; bookingId: string }> = [];

    snapshot.docs.forEach((doc) => {
      const booking = doc.data();
      const status = booking.status;

      // Exclude rejected and cancelled bookings (slots are free)
      if (status === "rejected" || status === "cancelled") {
        return;
      }

      // For pending and confirmed bookings, always show as booked
      if (status === "pending" || status === "confirmed") {
        bookedSlots.push({
          date: booking.date,
          time: booking.time,
          bookingId: doc.id
        });
        return;
      }

      // For accepted bookings, only show as booked if session time hasn't passed
      if (status === "accepted") {
        try {
          // Parse booking date - handle both Firestore Timestamp and string dates
          let bookingDate: Date;
          if (booking.date && typeof booking.date === 'object' && 'toDate' in booking.date) {
            // Firestore Timestamp
            bookingDate = booking.date.toDate();
          } else if (booking.date) {
            // String date
            bookingDate = new Date(booking.date);
          } else {
            throw new Error('Booking date is missing');
          }

          // Validate date
          if (isNaN(bookingDate.getTime())) {
            throw new Error('Invalid booking date');
          }

          // Parse time - handle both formats:
          // 1. "HH:MM" or "HH:MM:SS" (24-hour format)
          // 2. "HH:MM AM/PM - HH:MM AM/PM" (12-hour range format - extract start time)
          let hours: number, minutes: number;
          
          const timeRangeMatch = booking.time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (timeRangeMatch) {
            // Time range format: extract start time
            let startHours = parseInt(timeRangeMatch[1], 10);
            const startMinutes = parseInt(timeRangeMatch[2], 10);
            const period = timeRangeMatch[3].toUpperCase();
            
            // Convert to 24-hour format
            if (period === 'PM' && startHours !== 12) {
              startHours += 12;
            } else if (period === 'AM' && startHours === 12) {
              startHours = 0;
            }
            
            hours = startHours;
            minutes = startMinutes;
          } else {
            // Standard HH:MM or HH:MM:SS format
            const timeParts = booking.time.split(':');
            hours = parseInt(timeParts[0], 10);
            minutes = parseInt(timeParts[1], 10);
          }
          
          if (isNaN(hours) || isNaN(minutes)) {
            throw new Error('Invalid booking time format');
          }

          const sessionDateTime = new Date(bookingDate);
          sessionDateTime.setHours(hours, minutes, 0, 0);

          // Only include if session time hasn't passed
          if (sessionDateTime > now) {
            bookedSlots.push({
              date: booking.date?.toString() || booking.date,
              time: booking.time,
              bookingId: doc.id
            });
          } else {
            console.log(`⏰ [getConsultantBookedSlots] Excluding past accepted booking: ${doc.id} (session time: ${sessionDateTime.toISOString()})`);
          }
        } catch (parseError) {
          // If date/time parsing fails, include it to be safe (better to show as booked than free incorrectly)
          console.warn(`⚠️ [getConsultantBookedSlots] Failed to parse date/time for booking ${doc.id}:`, parseError);
          bookedSlots.push({
            date: booking.date?.toString() || booking.date,
            time: booking.time,
            bookingId: doc.id
          });
        }
        return;
      }

      // For completed bookings, don't show as booked (session is over)
      if (status === "completed") {
        return;
      }
    });

    console.log('✅ [getConsultantBookedSlots] Returning booked slots:', bookedSlots.length);

    res.status(200).json({ 
      bookedSlots,
      count: bookedSlots.length 
    });
  } catch (error: any) {
    console.error('❌ [getConsultantBookedSlots] Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const user = (req as any).user;

    const result = await cancelBookingInternally(bookingId, {
      reason,
      initiatedBy: user?.uid,
    });

    res.status(200).json({
      message: result.message,
      bookingId: result.bookingId,
      refunded: result.refunded,
      refundId: result.refundId,
      status: result.status,
      paymentStatus: result.paymentStatus,
    });
  } catch (error: any) {
    console.error("❌ [cancelBooking] Error cancelling booking:", error);
    res.status(500).json({ error: error.message || "Failed to cancel booking" });
  }
};

// ✅ Update booking status (approve, cancel, etc.)
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { status, paymentStatus } = req.body;

    console.log('🔍 [updateBookingStatus] Updating booking:', {
      bookingId,
      status,
      paymentStatus,
      body: req.body
    });

    // Validate that status is provided
    if (!status) {
      console.error('❌ [updateBookingStatus] Status is required');
      return res.status(400).json({ error: "Status is required" });
    }

    // Normalize 'approved' to 'accepted' for consistency
    const normalizedStatus = status === 'approved' ? 'accepted' : status;

    // Get current booking data
    const bookingDoc = await db.collection("bookings").doc(bookingId).get();
    if (!bookingDoc.exists) {
      console.error('❌ [updateBookingStatus] Booking not found:', bookingId);
      return res.status(404).json({ error: "Booking not found" });
    }

    const bookingData = bookingDoc.data();
    const previousStatus = bookingData?.status;

    console.log('📋 [updateBookingStatus] Current booking data:', {
      bookingId,
      previousStatus,
      currentPaymentStatus: bookingData?.paymentStatus
    });

    // Build update data object explicitly, only including defined values
    // This prevents Firestore from receiving undefined values
    const filteredUpdateData: any = {
      status: normalizedStatus,
      updatedAt: new Date().toISOString(),
    };
    
    // Only include paymentStatus if it's explicitly provided and not undefined/null
    if (paymentStatus !== undefined && paymentStatus !== null && paymentStatus !== '') {
      filteredUpdateData.paymentStatus = paymentStatus;
    }
    
    // Double-check: Remove any undefined values that might have slipped through
    Object.keys(filteredUpdateData).forEach(key => {
      if (filteredUpdateData[key] === undefined || filteredUpdateData[key] === null) {
        delete filteredUpdateData[key];
      }
    });
    
    console.log('💾 [updateBookingStatus] Updating with data:', JSON.stringify(filteredUpdateData));
    console.log('💾 [updateBookingStatus] Update data keys:', Object.keys(filteredUpdateData));
    console.log('💾 [updateBookingStatus] Update data values:', Object.values(filteredUpdateData));
    
    await db.collection("bookings").doc(bookingId).update(filteredUpdateData);
    
    console.log('✅ [updateBookingStatus] Booking updated successfully');
    
    // Log slot availability changes
    if (status === "rejected" || status === "cancelled") {
      console.log(`🔓 [updateBookingStatus] Slot freed - Booking ${bookingId} status changed to ${status}. Slot ${bookingData?.date} ${bookingData?.time} is now available.`);
    } else if (status === "accepted") {
      console.log(`🔒 [updateBookingStatus] Slot confirmed - Booking ${bookingId} accepted. Slot ${bookingData?.date} ${bookingData?.time} will remain booked until session time passes.`);
    }

    // If status changed to "completed" and payment hasn't been transferred yet, trigger transfer
    if (status === "completed" && previousStatus !== "completed" && bookingData?.paymentStatus === "paid") {
      const paymentTransferred = bookingData?.paymentTransferred;
      
      if (!paymentTransferred && bookingData?.amount) {
        try {
          // Use payment service for automatic transfer with retry logic
          const { transferPaymentToConsultant } = await import("../services/payment.service");
          const result = await transferPaymentToConsultant(bookingId);
          
          if (result.success) {
            console.log(`✅ Auto-transferred $${result.amount} to consultant for booking ${bookingId} (Transfer ID: ${result.transferId})`);
          } else {
            console.error(`❌ Failed to auto-transfer payment for booking ${bookingId}: ${result.error}`);
            // Don't fail the booking update - transfer can be retried manually
            // The error is logged and can be handled by admin or retry mechanism
          }
        } catch (transferError: any) {
          // Log error but don't fail the booking update
          console.error(`❌ Error auto-transferring payment for booking ${bookingId}:`, transferError);
        }
      }
    }

    res.status(200).json({ message: "Booking updated successfully" });
  } catch (error: any) {
    console.error('❌ [updateBookingStatus] Error updating booking:', {
      bookingId: req.params.bookingId,
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ 
      error: error.message || "Failed to update booking status",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Check if student has access to chat/call with consultant
export const checkAccess = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.uid;
    const { consultantId } = req.params;

    // Check if student has any paid/approved booking with this consultant
    const snapshot = await db
      .collection("bookings")
      .where("studentId", "==", studentId)
      .where("consultantId", "==", consultantId)
      .where("status", "in", ["approved", "completed"])
      .where("paymentStatus", "==", "paid")
      .get();

    const hasAccess = !snapshot.empty;
    res.status(200).json({ 
      hasAccess,
      message: hasAccess ? "Access granted" : "No paid booking found"
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get booked consultants for a student (with consultant details)
// ✅ Test endpoint to debug booking issues
export const testBookingDebug = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.uid;
    
    console.log('🧪 [testBookingDebug] Testing booking debug for studentId:', studentId);
    
    // Get all bookings for this student
    const allBookingsSnapshot = await db
      .collection("bookings")
      .where("studentId", "==", studentId)
      .get();

    console.log('📊 [testBookingDebug] Found', allBookingsSnapshot.size, 'total bookings');
    
    const allBookings = allBookingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ 
      message: "Debug info retrieved",
      studentId,
      totalBookings: allBookingsSnapshot.size,
      bookings: allBookings
    });
  } catch (error: any) {
    console.error("Test booking debug error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getMyConsultants = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.uid;
    
    console.log('🔍 [getMyConsultants] Looking for bookings for studentId:', studentId);
    
    // Get all bookings for this student (first check all bookings, then filter)
    const allBookingsSnapshot = await db
      .collection("bookings")
      .where("studentId", "==", studentId)
      .get();

    console.log('📊 [getMyConsultants] Found', allBookingsSnapshot.size, 'total bookings for student');
    
    // Log all bookings to debug
    allBookingsSnapshot.forEach((doc) => {
      const booking = doc.data();
      console.log('📋 [getMyConsultants] All booking:', { 
        id: doc.id, 
        consultantId: booking.consultantId, 
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        createdAt: booking.createdAt
      });
    });

    // Now filter for paid bookings
    const bookingsSnapshot = await db
      .collection("bookings")
      .where("studentId", "==", studentId)
      .where("paymentStatus", "==", "paid")
      .get();

    console.log('📊 [getMyConsultants] Found', bookingsSnapshot.size, 'paid bookings');

    // If no paid bookings found, try a different approach - check for any bookings with status 'confirmed'
    let confirmedBookingsSnapshot: any = null;
    if (bookingsSnapshot.empty) {
      console.log('🔄 [getMyConsultants] No paid bookings found, trying alternative query for confirmed bookings...');
      confirmedBookingsSnapshot = await db
        .collection("bookings")
        .where("studentId", "==", studentId)
        .where("status", "==", "confirmed")
        .get();
      
      console.log('📊 [getMyConsultants] Found', confirmedBookingsSnapshot.size, 'confirmed bookings');
      
      if (!confirmedBookingsSnapshot.empty) {
        console.log('⚠️ [getMyConsultants] Found confirmed bookings but not paid - this might be the issue');
        confirmedBookingsSnapshot.forEach((doc: any) => {
          const booking = doc.data();
          console.log('📋 [getMyConsultants] Confirmed booking:', { 
            id: doc.id, 
            consultantId: booking.consultantId, 
            paymentStatus: booking.paymentStatus,
            status: booking.status
          });
        });
      }
    }

    // Use confirmed bookings if no paid bookings found (for debugging)
    const finalBookingsSnapshot = bookingsSnapshot.empty && confirmedBookingsSnapshot ? confirmedBookingsSnapshot : bookingsSnapshot;
    
    if (finalBookingsSnapshot.empty) {
      console.log('⚠️ [getMyConsultants] No bookings found (paid or confirmed), returning empty array');
      return res.status(200).json({ consultants: [] });
    }

    // Get unique consultant IDs
    const consultantIds = new Set<string>();
    const bookingsByConsultant: Record<string, any[]> = {};

    finalBookingsSnapshot.forEach((doc: any) => {
      const booking = doc.data();
      console.log('📋 [getMyConsultants] Booking found:', { id: doc.id, consultantId: booking.consultantId, paymentStatus: booking.paymentStatus });
      consultantIds.add(booking.consultantId);
      
      if (!bookingsByConsultant[booking.consultantId]) {
        bookingsByConsultant[booking.consultantId] = [];
      }
      bookingsByConsultant[booking.consultantId].push(booking);
    });

    console.log('👥 [getMyConsultants] Unique consultant IDs:', Array.from(consultantIds));

    // Fetch consultant details for each unique consultant
    const consultantsData = [];
    
    for (const consultantId of Array.from(consultantIds)) {
      console.log('🔍 [getMyConsultants] Looking up consultant:', consultantId);
      const consultantDoc = await db.collection("consultants").doc(consultantId).get();
      
      if (consultantDoc.exists) {
        console.log('✅ [getMyConsultants] Consultant found:', consultantId);
        const consultant = consultantDoc.data();
        const consultantBookings = bookingsByConsultant[consultantId];
        
        // Sort bookings by date (most recent first)
        consultantBookings.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const activeConsultantBookings = consultantBookings.filter((booking: any) => {
          const bookingStatus = (booking.status || '').toLowerCase();
          return ACTIVE_BOOKING_STATUSES.includes(bookingStatus as any);
        });

        if (activeConsultantBookings.length === 0) {
          console.log('ℹ️ [getMyConsultants] Skipping consultant with no active bookings:', consultantId);
          continue;
        }

        consultantsData.push({
          uid: consultantId,
          name: consultant?.name,
          category: consultant?.category,
          profileImage: consultant?.profileImage || null,
          rating: consultant?.rating,
          totalReviews: consultant?.totalReviews,
          totalBookings: activeConsultantBookings.length,
          lastBookingDate: activeConsultantBookings[0]?.date,
          lastBookingStatus: activeConsultantBookings[0]?.status
        });
      } else {
        console.log('❌ [getMyConsultants] Consultant not found:', consultantId);
      }
    }

    console.log('📊 [getMyConsultants] Returning', consultantsData.length, 'consultants');

    // Sort consultants by last booking date (most recent first)
    consultantsData.sort((a, b) => 
      new Date(b.lastBookingDate).getTime() - new Date(a.lastBookingDate).getTime()
    );

    res.status(200).json({ consultants: consultantsData });
  } catch (error: any) {
    console.error("Get my consultants error:", error);
    res.status(500).json({ error: error.message });
  }
};
