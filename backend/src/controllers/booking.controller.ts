// src/controllers/bookingController.ts
import { Request, Response } from "express";
import { db } from "../config/firebase";
import { emailBookingConfirmation, emailConsultantNewBooking } from "../utils/email";
import { stripeClient } from "../utils/stripeClient";

export const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed", "accepted", "approved"];

type BookingRecord = {
  id: string;
  consultantId: string;
  studentId: string;
  serviceId: string;
  status: string;
  paymentStatus?: string;
  paymentIntentId?: string;
  amount?: number;
  [key: string]: any;
};

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

    // Fetch all active bookings for this consultant
    const snapshot = await db
      .collection("bookings")
      .where("consultantId", "==", consultantId)
      .where("status", "in", ["confirmed", "accepted", "pending"]) // Only active bookings
      .get();

    console.log('📋 [getConsultantBookedSlots] Found active bookings:', snapshot.size);

    const bookedSlots = snapshot.docs.map((doc) => {
      const booking = doc.data();
      return {
        date: booking.date,
        time: booking.time,
        bookingId: doc.id
      };
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
      status: status,
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

    // If status changed to "completed" and payment hasn't been transferred yet, trigger transfer
    if (status === "completed" && previousStatus !== "completed" && bookingData?.paymentStatus === "paid") {
      const paymentTransferred = bookingData?.paymentTransferred;
      
      if (!paymentTransferred && bookingData?.amount) {
        try {
          // Import Stripe for transfer
          const Stripe = require("stripe");
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
          
          // Get consultant's Stripe account
          const consultantDoc = await db.collection("consultants").doc(bookingData.consultantId).get();
          if (consultantDoc.exists) {
            const consultantData = consultantDoc.data();
            const stripeAccountId = consultantData?.stripeAccountId;
            
            if (stripeAccountId) {
              // Verify account is ready
              const account = await stripe.accounts.retrieve(stripeAccountId);
              
              if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
                // Calculate platform fee
                const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10');
                const platformFeeAmount = Math.round(bookingData.amount * 100 * (platformFeePercent / 100));
                const transferAmount = Math.round(bookingData.amount * 100) - platformFeeAmount;
                
                // Create transfer
                const transfer = await stripe.transfers.create({
                  amount: transferAmount,
                  currency: "usd",
                  destination: stripeAccountId,
                  description: `Payment for completed booking ${bookingId}`,
                  metadata: {
                    bookingId,
                    consultantId: bookingData.consultantId,
                    studentId: bookingData.studentId,
                    platformFee: platformFeeAmount.toString(),
                  },
                });
                
                // Update booking with transfer info
                await db.collection("bookings").doc(bookingId).update({
                  paymentTransferred: true,
                  transferId: transfer.id,
                  transferAmount: transferAmount / 100,
                  platformFee: platformFeeAmount / 100,
                  transferredAt: new Date().toISOString(),
                });
                
                console.log(`✅ Auto-transferred $${transferAmount / 100} to consultant for booking ${bookingId}`);
              } else {
                console.warn(`⚠️ Consultant ${bookingData.consultantId} Stripe account not ready for transfer`);
              }
            } else {
              console.warn(`⚠️ Consultant ${bookingData.consultantId} does not have Stripe account set up`);
            }
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
