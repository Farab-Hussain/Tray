// src/controllers/course.controller.ts
import { Request, Response } from "express";
import { courseService } from "../services/course.service";
import { CourseInput, CourseFilters } from "../models/course.model";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Create a new course (Consultant only)
 */
export const createCourse = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify user is a consultant
    if (user.role !== 'consultant') {
      return res.status(403).json({ error: "Consultant access required" });
    }

    const courseData: CourseInput = req.body;
    const course = await courseService.createCourse(courseData, user.uid);

    res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (error: any) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: error.message || "Failed to create course" });
  }
};

/**
 * Get course by ID
 */
export const getCourseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const course = await courseService.getCourseById(id);

    res.status(200).json({ course });
  } catch (error: any) {
    console.error("Error fetching course:", error);
    res.status(404).json({ error: error.message || "Course not found" });
  }
};

/**
 * Get course by slug
 */
export const getCourseBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const course = await courseService.getCourseBySlug(slug);

    res.status(200).json({ course });
  } catch (error: any) {
    console.error("Error fetching course:", error);
    res.status(404).json({ error: error.message || "Course not found" });
  }
};

/**
 * Update course (Consultant only)
 */
export const updateCourse = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const updates: Partial<CourseInput> = req.body;

    const course = await courseService.updateCourse(id, user.uid, {
      ...updates,
      availabilitySchedule: updates.availabilitySchedule ? {
        startDate: updates.availabilitySchedule.startDate 
          ? Timestamp.fromDate(updates.availabilitySchedule.startDate) 
          : undefined,
        endDate: updates.availabilitySchedule.endDate 
          ? Timestamp.fromDate(updates.availabilitySchedule.endDate) 
          : undefined,
        enrollmentDeadline: updates.availabilitySchedule.enrollmentDeadline 
          ? Timestamp.fromDate(updates.availabilitySchedule.enrollmentDeadline) 
          : undefined,
        maxEnrollments: updates.availabilitySchedule.maxEnrollments,
      } : undefined,
    } as any);

    res.status(200).json({
      message: "Course updated successfully",
      course,
    });
  } catch (error: any) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: error.message || "Failed to update course" });
  }
};

/**
 * Delete course (Consultant only)
 */
export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    await courseService.deleteCourse(id, user.uid);

    res.status(200).json({
      message: "Course deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: error.message || "Failed to delete course" });
  }
};

/**
 * Search courses with filters
 */
export const searchCourses = async (req: Request, res: Response) => {
  try {
    const filters: CourseFilters = {
      category: req.query.category as string,
      subcategory: req.query.subcategory as string,
      level: req.query.level as string,
      priceRange: req.query.minPrice && req.query.maxPrice ? {
        min: parseInt(req.query.minPrice as string),
        max: parseInt(req.query.maxPrice as string),
      } : undefined,
      duration: req.query.minDuration && req.query.maxDuration ? {
        min: parseInt(req.query.minDuration as string),
        max: parseInt(req.query.maxDuration as string),
      } : undefined,
      rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      language: req.query.language as string,
      isFree: req.query.isFree ? req.query.isFree === 'true' : undefined,
      hasCertificate: req.query.hasCertificate ? req.query.hasCertificate === 'true' : undefined,
      instructorId: req.query.instructorId as string,
      featured: req.query.featured ? req.query.featured === 'true' : undefined,
      trending: req.query.trending ? req.query.trending === 'true' : undefined,
      bestseller: req.query.bestseller ? req.query.bestseller === 'true' : undefined,
      search: req.query.search as string,
      sort: req.query.sort as any,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await courseService.searchCourses(filters);

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error searching courses:", error);
    res.status(500).json({ error: error.message || "Failed to search courses" });
  }
};

/**
 * Get instructor's courses (Consultant only)
 */
export const getMyCourses = async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    console.log(`🔍 [getMyCourses] Starting fetch for user: ${req.user?.uid}`);
    
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const filters = {
      status: req.query.status as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    console.log(`🔍 [getMyCourses] Filters:`, filters);

    const courses = await courseService.getMyCourses(user.uid);
    
    const duration = Date.now() - startTime;
    console.log(`✅ [getMyCourses] Completed in ${duration}ms, found ${courses.length} courses`);

    res.status(200).json({ courses });
  } catch (error: any) {
    console.error("Error fetching instructor courses:", error);
    res.status(500).json({ error: error.message || "Failed to fetch courses" });
  }
};

/**
 * Submit course for approval (Consultant only)
 */
export const submitForApproval = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const course = await courseService.submitForApproval(id, user.uid);

    res.status(200).json({
      message: "Course submitted for approval",
      course,
    });
  } catch (error: any) {
    console.error("Error submitting course for approval:", error);
    res.status(500).json({ error: error.message || "Failed to submit course" });
  }
};

/**
 * Approve course (Admin only)
 */
export const approveCourse = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const course = await courseService.approveCourse(id, user.uid);

    res.status(200).json({
      message: "Course approved and published",
      course,
    });
  } catch (error: any) {
    console.error("Error approving course:", error);
    res.status(500).json({ error: error.message || "Failed to approve course" });
  }
};

/**
 * Reject course (Admin only)
 */
export const rejectCourse = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    const course = await courseService.rejectCourse(id, user.uid, reason);

    res.status(200).json({
      message: "Course rejected",
      course,
    });
  } catch (error: any) {
    console.error("Error rejecting course:", error);
    res.status(500).json({ error: error.message || "Failed to reject course" });
  }
};

/**
 * Get pending courses (Admin only)
 */
export const getPendingCourses = async (req: Request, res: Response) => {
  try {
    const courses = await courseService.getPendingCourses();

    res.status(200).json({ courses });
  } catch (error: any) {
    console.error("Error fetching pending courses:", error);
    res.status(500).json({ error: error.message || "Failed to fetch pending courses" });
  }
};

/**
 * Enroll student in course
 */
export const enrollInCourse = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const { paymentId, subscriptionId } = req.body;

    const enrollment = await courseService.enrollInCourse(id, user.uid, paymentId);

    res.status(201).json({
      message: "Successfully enrolled in course",
      enrollment,
    });
  } catch (error: any) {
    console.error("Error enrolling in course:", error);
    res.status(500).json({ error: error.message || "Failed to enroll in course" });
  }
};

/**
 * Get student's enrollments
 */
export const getMyEnrollments = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const filters = {
      status: req.query.status as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const enrollments = await courseService.getMyEnrollments(user.uid);

    res.status(200).json({ enrollments });
  } catch (error: any) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({ error: error.message || "Failed to fetch enrollments" });
  }
};

/**
 * Get course enrollments (Instructor only)
 */
export const getCourseEnrollments = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const filters = {
      status: req.query.status as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const enrollments = await courseService.getCourseEnrollments(id, user.uid);

    res.status(200).json({ enrollments });
  } catch (error: any) {
    console.error("Error fetching course enrollments:", error);
    res.status(500).json({ error: error.message || "Failed to fetch enrollments" });
  }
};

/**
 * Update lesson progress
 */
export const updateLessonProgress = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { enrollmentId, lessonId } = req.params;
    const progressData = req.body;

    const progress = await courseService.updateLessonProgress(
      enrollmentId,
      lessonId,
      user.uid,
      progressData
    );

    res.status(200).json({
      message: "Progress updated successfully",
      progress,
    });
  } catch (error: any) {
    console.error("Error updating lesson progress:", error);
    res.status(500).json({ error: error.message || "Failed to update progress" });
  }
};

/**
 * Add course review
 */
export const addCourseReview = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const reviewData = req.body;

    const review = await courseService.addReview(id, user.uid, reviewData);

    res.status(201).json({
      message: "Review added successfully",
      review,
    });
  } catch (error: any) {
    console.error("Error adding course review:", error);
    res.status(500).json({ error: error.message || "Failed to add review" });
  }
};

/**
 * Get course reviews
 */
export const getCourseReviews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filters = {
      rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      sort: req.query.sort as any,
    };

    const result = await courseService.getCourseReviews(id, filters.page, filters.limit, filters.sort);

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error fetching course reviews:", error);
    res.status(500).json({ error: error.message || "Failed to fetch reviews" });
  }
};

/**
 * Get featured courses
 */
export const getFeaturedCourses = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const courses = await courseService.getFeaturedCourses(limit);

    res.status(200).json({ courses });
  } catch (error: any) {
    console.error("Error fetching featured courses:", error);
    res.status(500).json({ error: error.message || "Failed to fetch featured courses" });
  }
};

/**
 * Get trending courses
 */
export const getTrendingCourses = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const courses = await courseService.getTrendingCourses(limit);

    res.status(200).json({ courses });
  } catch (error: any) {
    console.error("Error fetching trending courses:", error);
    res.status(500).json({ error: error.message || "Failed to fetch trending courses" });
  }
};

/**
 * Get bestseller courses
 */
export const getBestsellerCourses = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const courses = await courseService.getBestsellerCourses(limit);

    res.status(200).json({ courses });
  } catch (error: any) {
    console.error("Error fetching bestseller courses:", error);
    res.status(500).json({ error: error.message || "Failed to fetch bestseller courses" });
  }
};

/**
 * Get instructor statistics (Consultant only)
 */
export const getInstructorStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const stats = await courseService.getInstructorStats(user.uid);

    res.status(200).json({ stats });
  } catch (error: any) {
    console.error("Error fetching instructor stats:", error);
    res.status(500).json({ error: error.message || "Failed to fetch stats" });
  }
};

// NEW: Enhanced course purchase and management endpoints

/**
 * Purchase a course (Student only)
 */
export const purchaseCourse = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify user is a student
    if (user.role !== 'student') {
      return res.status(403).json({ error: "Student access required" });
    }

    const { courseId, pricingOption, customDuration, paymentId } = req.body;
    
    const purchase = await courseService.purchaseCourse(
      courseId,
      user.uid,
      paymentId,
      pricingOption,
      customDuration
    );

    res.status(201).json({
      message: "Course purchased successfully",
      purchase,
    });
  } catch (error: any) {
    console.error("Error purchasing course:", error);
    res.status(400).json({ error: error.message || "Failed to purchase course" });
  }
};

/**
 * Get student's course purchases (Student only)
 */
export const getStudentPurchases = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const purchases = await courseService.getStudentPurchases(user.uid);

    res.status(200).json({ purchases });
  } catch (error: any) {
    console.error("Error fetching student purchases:", error);
    res.status(500).json({ error: error.message || "Failed to fetch purchases" });
  }
};

/**
 * Check if student has access to a course (Student only)
 */
export const checkCourseAccess = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { courseId } = req.params;
    const hasAccess = await courseService.hasCourseAccess(courseId, user.uid);

    res.status(200).json({ hasAccess });
  } catch (error: any) {
    console.error("Error checking course access:", error);
    res.status(500).json({ error: error.message || "Failed to check access" });
  }
};

/**
 * Launch a course (Consultant only)
 */
export const launchCourse = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify user is a consultant
    if (user.role !== 'consultant') {
      return res.status(403).json({ error: "Consultant access required" });
    }

    const { courseId } = req.params;
    const course = await courseService.launchCourse(courseId, user.uid);

    res.status(200).json({
      message: "Course launched successfully",
      course,
    });
  } catch (error: any) {
    console.error("Error launching course:", error);
    res.status(400).json({ error: error.message || "Failed to launch course" });
  }
};

/**
 * Issue certificate for course completion (Student only)
 */
export const issueCertificate = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { courseId, enrollmentId } = req.body;
    const certificate = await courseService.issueCertificate(
      courseId,
      user.uid,
      enrollmentId
    );

    res.status(201).json({
      message: "Certificate issued successfully",
      certificate,
    });
  } catch (error: any) {
    console.error("Error issuing certificate:", error);
    res.status(400).json({ error: error.message || "Failed to issue certificate" });
  }
};

/**
 * Get student's certificates (Student only)
 */
export const getStudentCertificates = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const certificates = await courseService.getStudentCertificates(user.uid);

    res.status(200).json({ certificates });
  } catch (error: any) {
    console.error("Error fetching student certificates:", error);
    res.status(500).json({ error: error.message || "Failed to fetch certificates" });
  }
};

/**
 * Verify certificate (Public)
 */
export const verifyCertificate = async (req: Request, res: Response) => {
  try {
    const { verificationCode } = req.params;
    const certificate = await courseService.verifyCertificate(verificationCode);

    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found or invalid" });
    }

    res.status(200).json({ certificate });
  } catch (error: any) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({ error: error.message || "Failed to verify certificate" });
  }
};
