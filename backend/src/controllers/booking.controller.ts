// src/controllers/bookingController.ts
import { Request, Response } from "express";
import { db } from "../config/firebase";
import { emailBookingConfirmation, emailConsultantNewBooking } from "../utils/email";

// ✅ Create new booking
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { consultantId, serviceId, date, time, amount, quantity, status, paymentStatus } = req.body;
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

// ✅ Update booking status (approve, cancel, etc.)
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { status, paymentStatus } = req.body;

    await db.collection("bookings").doc(bookingId).update({
      status,
      paymentStatus,
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json({ message: "Booking updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

        consultantsData.push({
          uid: consultantId,
          name: consultant?.name,
          category: consultant?.category,
          profileImage: consultant?.profileImage || null,
          rating: consultant?.rating,
          totalReviews: consultant?.totalReviews,
          totalBookings: consultantBookings.length,
          lastBookingDate: consultantBookings[0]?.date,
          lastBookingStatus: consultantBookings[0]?.status
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
