// src/controllers/review.controller.ts
import { Request, Response } from "express";
import { db } from "../config/firebase";
import { reviewServices } from "../services/review.service";

// ✅ Create a new review (Student only, must have completed booking)
export const createReview = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.uid;
    const { consultantId, rating, comment, recommend } = req.body;

    console.log('🔍 [createReview] Creating review with data:', {
      studentId,
      consultantId,
      rating,
      comment,
      recommend
    });

    if (!consultantId || !rating) {
      console.log('❌ [createReview] Missing required fields');
      return res.status(400).json({ error: "Consultant ID and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      console.log('❌ [createReview] Invalid rating:', rating);
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // ✅ Check if student has a completed/confirmed/approved booking with this consultant
    // Allow reviews for: completed, confirmed, approved, or accepted bookings (as long as they're paid)
    console.log('🔍 [createReview] Checking for bookings with studentId:', studentId, 'consultantId:', consultantId);
    
    const bookingsSnapshot = await db
      .collection("bookings")
      .where("studentId", "==", studentId)
      .where("consultantId", "==", consultantId)
      .where("status", "in", ["completed", "confirmed", "approved", "accepted"])
      .where("paymentStatus", "==", "paid")
      .get();

    console.log('📊 [createReview] Found', bookingsSnapshot.size, 'valid paid bookings');

    if (bookingsSnapshot.empty) {
      console.log('❌ [createReview] No valid paid bookings found');
      // Check what bookings exist for better error message
      const allBookingsSnapshot = await db
        .collection("bookings")
        .where("studentId", "==", studentId)
        .where("consultantId", "==", consultantId)
        .get();
      
      if (allBookingsSnapshot.empty) {
        return res.status(403).json({ 
          error: "You can only review consultants you have booked with" 
        });
      }
      
      // Log booking details for debugging
      allBookingsSnapshot.forEach((doc) => {
        const booking = doc.data();
        console.log('📋 [createReview] Booking found:', {
          id: doc.id,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
        });
      });
      
      return res.status(403).json({ 
        error: "You can only review consultants you have confirmed/paid bookings with. Your booking status: " + 
               (allBookingsSnapshot.docs[0]?.data()?.status || 'unknown') + 
               ", payment status: " + 
               (allBookingsSnapshot.docs[0]?.data()?.paymentStatus || 'unknown')
      });
    }

    // ✅ Check if student already reviewed this consultant
    console.log('🔍 [createReview] Checking for existing review...');
    const existingReview = await reviewServices.getByStudentAndConsultant(
      studentId,
      consultantId
    );

    if (existingReview) {
      console.log('❌ [createReview] Student already reviewed this consultant');
      return res.status(400).json({ 
        error: "You have already reviewed this consultant. Use PUT to update your review." 
      });
    }

    // Create the review
    console.log('✅ [createReview] Creating new review...');
    const bookingId = bookingsSnapshot.docs[0].id;
    const review = await reviewServices.create({
      studentId,
      consultantId,
      bookingId,
      rating,
      comment: comment || "",
      recommend: recommend ?? true,
    });

    console.log('✅ [createReview] Review created successfully:', review.id);

    // Update consultant's rating
    console.log('🔄 [createReview] Updating consultant rating...');
    await updateConsultantRating(consultantId);

    console.log('✅ [createReview] Review process completed successfully');
    res.status(201).json({ 
      message: "Review created successfully", 
      review 
    });
  } catch (error: any) {
    console.error("Create review error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get all reviews for a consultant (Public)
export const getConsultantReviews = async (req: Request, res: Response) => {
  try {
    const { consultantId } = req.params;
    
    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const maxLimit = 100; // Prevent excessive requests
    
    // Validate pagination parameters
    const validatedLimit = Math.min(Math.max(1, limit), maxLimit);
    const validatedPage = Math.max(1, page);

    const allReviews = await reviewServices.getByConsultantId(consultantId);
    
    // Apply pagination
    const total = allReviews.length;
    const startIndex = (validatedPage - 1) * validatedLimit;
    const endIndex = startIndex + validatedLimit;
    const paginatedReviews = allReviews.slice(startIndex, endIndex);

    // Populate student details
    const reviewsWithDetails = await Promise.all(
      paginatedReviews.map(async (review) => {
        const studentDoc = await db.collection("users").doc(review.studentId).get();
        const student = studentDoc.data();

        return {
          ...review,
          studentName: student?.name || "Anonymous",
          studentProfileImage: student?.profileImage || null,
        };
      })
    );

    res.status(200).json({ 
      reviews: reviewsWithDetails,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages: Math.ceil(total / validatedLimit),
        hasNextPage: endIndex < total,
        hasPrevPage: validatedPage > 1,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get reviews written by logged-in user (Student)
export const getMyReviews = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.uid;

    const reviews = await reviewServices.getByStudentId(studentId);
    const studentDoc = await db.collection("users").doc(studentId).get();
    const student = studentDoc.data();

    const studentName =
      student?.name || student?.displayName || student?.email || "You";
    const studentProfileImage =
      student?.profileImage ||
      student?.avatarUrl ||
      student?.avatar ||
      student?.profile?.profileImage ||
      student?.profile?.avatarUrl ||
      null;

    // Populate consultant details
    const reviewsWithDetails = await Promise.all(
      reviews.map(async (review) => {
        let consultantDoc = await db
          .collection("consultants")
          .doc(review.consultantId)
          .get();
        let consultant = consultantDoc.data();

        if (!consultant) {
          const consultantProfileDoc = await db
            .collection("consultantProfiles")
            .doc(review.consultantId)
            .get();
          consultant = consultantProfileDoc.data() || undefined;
        }

        const consultantName =
          consultant?.name ||
          consultant?.displayName ||
          consultant?.profile?.name ||
          consultant?.profile?.displayName ||
          "Unknown";

        const consultantProfileImage =
          consultant?.profileImage ||
          consultant?.avatarUrl ||
          consultant?.avatar ||
          consultant?.photoURL ||
          consultant?.profile?.profileImage ||
          consultant?.profile?.avatarUrl ||
          null;

        return {
          ...review,
          consultantName,
          consultantProfileImage,
          studentName,
          studentProfileImage,
        };
      })
    );

    res.status(200).json({ reviews: reviewsWithDetails });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update a review (Student can update their own, Admin can update any)
export const updateReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const userId = (req as any).user.uid;
    const userRole = (req as any).user.role;
    const { rating, comment, recommend } = req.body;

    // Get the review
    const review = await reviewServices.getById(reviewId);

    // ✅ Permission check: Only review owner or admin can update
    if (review.studentId !== userId && userRole !== "admin") {
      return res.status(403).json({ error: "You can only update your own reviews" });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Update the review
    const updates: any = {};
    if (rating !== undefined) updates.rating = rating;
    if (comment !== undefined) updates.comment = comment;
    if (recommend !== undefined) updates.recommend = recommend;

    const updatedReview = await reviewServices.update(reviewId, updates);

    // Recalculate consultant rating
    await updateConsultantRating(review.consultantId);

    res.status(200).json({ 
      message: "Review updated successfully", 
      review: updatedReview 
    });
  } catch (error: any) {
    console.error("Update review error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete a review (Student can delete their own, Admin can delete any)
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const userId = (req as any).user.uid;
    const userRole = (req as any).user.role;

    // Get the review
    const review = await reviewServices.getById(reviewId);

    // ✅ Permission check: Only review owner or admin can delete
    if (review.studentId !== userId && userRole !== "admin") {
      return res.status(403).json({ error: "You can only delete your own reviews" });
    }

    const consultantId = review.consultantId;

    // Delete the review
    await reviewServices.delete(reviewId);

    // Recalculate consultant rating
    await updateConsultantRating(consultantId);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error: any) {
    console.error("Delete review error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get all reviews (Admin only)
export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;

    if (userRole !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const maxLimit = 200; // Prevent excessive requests
    
    // Validate pagination parameters
    const validatedLimit = Math.min(Math.max(1, limit), maxLimit);
    const validatedPage = Math.max(1, page);

    const allReviews = await reviewServices.getAll();
    
    // Apply pagination
    const total = allReviews.length;
    const startIndex = (validatedPage - 1) * validatedLimit;
    const endIndex = startIndex + validatedLimit;
    const paginatedReviews = allReviews.slice(startIndex, endIndex);

    res.status(200).json({ 
      reviews: paginatedReviews,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages: Math.ceil(total / validatedLimit),
        hasNextPage: endIndex < total,
        hasPrevPage: validatedPage > 1,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 🔧 Helper function to update consultant's average rating
async function updateConsultantRating(consultantId: string) {
  try {
    const reviews = await reviewServices.getByConsultantId(consultantId);

    if (reviews.length === 0) {
      // No reviews, reset to 0
      await db.collection("consultants").doc(consultantId).update({
        rating: 0,
        totalReviews: 0,
        updatedAt: new Date(),
      });
      return;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Update consultant document
    await db.collection("consultants").doc(consultantId).update({
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating consultant rating:", error);
  }
}

