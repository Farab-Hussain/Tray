// Service to Course Migration Script
// This script migrates existing service booking data to the new course management system

import { db } from '../../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { 
  EnhancedCourse, 
  EnhancedCourseEnrollment, 
  Service, 
  Booking,
  CourseVideo,
  LearningGoal,
  VideoProgress
} from '../../models/enhanced-course.model';

export class ServiceToCourseMigrationService {
  private servicesCollection = db.collection('services');
  private bookingsCollection = db.collection('bookings');
  private coursesCollection = db.collection('courses');
  private enrollmentsCollection = db.collection('courseEnrollments');

  /**
   * Migrate all services to courses
   */
  async migrateAllServices(): Promise<{
    migrated: number;
    failed: number;
    errors: string[];
  }> {
    console.log('🚀 Starting service to course migration...');
    
    const servicesSnapshot = await this.servicesCollection.get();
    const services = servicesSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Service));

    let migrated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const service of services) {
      try {
        await this.migrateService(service);
        migrated++;
        console.log(`✅ Migrated service: ${service.title}`);
      } catch (error) {
        failed++;
        const errorMsg = `Failed to migrate service ${service.id}: ${error}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`📊 Migration complete: ${migrated} migrated, ${failed} failed`);
    
    return { migrated, failed, errors };
  }

  /**
   * Migrate a single service to course
   */
  async migrateService(service: Service): Promise<EnhancedCourse> {
    // Check if course already exists
    const existingCourse = await this.coursesCollection
      .where('originalServiceId', '==', service.id)
      .limit(1)
      .get();

    if (!existingCourse.empty) {
      throw new Error('Course already exists for this service');
    }

    // Generate course slug
    const slug = this.generateSlug(service.title);
    
    // Check for slug uniqueness
    const slugCheck = await this.coursesCollection
      .where('slug', '==', slug)
      .limit(1)
      .get();

    const finalSlug = slugCheck.empty ? slug : `${slug}-${Date.now()}`;

    const course: Partial<EnhancedCourse> = {
      // Basic course info
      title: service.title,
      description: service.description,
      shortDescription: this.truncateText(service.description, 150),
      slug: finalSlug,
      
      // Instructor info
      instructorId: service.consultantId,
      instructorName: '', // Will be populated from user profile
      instructorBio: '',
      
      // Course metadata
      category: this.mapServiceCategoryToCourseCategory(service.category),
      subcategory: '',
      tags: this.generateTagsFromService(service),
      level: 'beginner', // Default for migrated content
      language: 'en',
      price: service.price,
      currency: 'USD',
      isFree: service.price === 0,
      
      // Media
      thumbnailUrl: service.thumbnailUrl || this.getDefaultThumbnail(),
      previewVideoUrl: '',
      
      // Course structure (empty initially)
      videos: [],
      totalDuration: 0,
      totalVideos: 0,
      publishedVideos: 0,
      previewVideos: 0,
      
      // Learning content
      objectives: [service.description],
      prerequisites: [],
      targetAudience: ['General'],
      learningObjectives: [service.description],
      learningPath: [],
      
      // Status and metadata
      status: 'draft',
      contentStatus: 'setup', // Needs video content
      difficultyScore: 3,
      timeCommitment: 'Self-paced',
      certificateAvailable: false,
      
      // Pricing
      pricingOptions: {
        oneTime: service.price,
        monthly: service.price > 0 ? Math.round(service.price * 0.5) : 0,
        yearly: service.price > 0 ? Math.round(service.price * 3) : 0,
        lifetime: service.price > 0 ? Math.round(service.price * 5) : 0,
      },
      
      // Enrollment
      enrollmentType: 'instant',
      enrollmentCount: 0,
      completionCount: 0,
      averageRating: 0,
      ratingCount: 0,
      
      // Flags
      featured: false,
      trending: false,
      bestseller: false,
      isLaunched: false,
      
      // Migration tracking
      originalServiceId: service.id,
      migratedAt: Timestamp.now().toDate(),
      migrationStatus: 'migrated',
      
      // Timestamps
      createdAt: service.createdAt,
      updatedAt: Timestamp.now().toDate(),
    };

    const docRef = await this.coursesCollection.add(course);
    return { id: docRef.id, ...course } as EnhancedCourse;
  }

  /**
   * Migrate all bookings to enrollments
   */
  async migrateAllBookings(): Promise<{
    migrated: number;
    failed: number;
    errors: string[];
  }> {
    console.log('🚀 Starting booking to enrollment migration...');
    
    const bookingsSnapshot = await this.bookingsCollection.get();
    const bookings = bookingsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Booking));

    let migrated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const booking of bookings) {
      try {
        await this.migrateBookingToEnrollment(booking);
        migrated++;
        console.log(`✅ Migrated booking: ${booking.id}`);
      } catch (error) {
        failed++;
        const errorMsg = `Failed to migrate booking ${booking.id}: ${error}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`📊 Migration complete: ${migrated} migrated, ${failed} failed`);
    
    return { migrated, failed, errors };
  }

  /**
   * Migrate a single booking to enrollment
   */
  async migrateBookingToEnrollment(booking: Booking): Promise<EnhancedCourseEnrollment> {
    // Find corresponding course for this service
    const courseSnapshot = await this.coursesCollection
      .where('originalServiceId', '==', booking.serviceId)
      .limit(1)
      .get();

    if (courseSnapshot.empty) {
      throw new Error('No course found for this service');
    }

    const course = courseSnapshot.docs[0];
    const courseId = course.id;

    // Check if enrollment already exists
    const existingEnrollment = await this.enrollmentsCollection
      .where('courseId', '==', courseId)
      .where('studentId', '==', booking.studentId)
      .where('originalBookingId', '==', booking.id)
      .limit(1)
      .get();

    if (!existingEnrollment.empty) {
      throw new Error('Enrollment already exists for this booking');
    }

    const enrollment: Partial<EnhancedCourseEnrollment> = {
      courseId,
      studentId: booking.studentId,
      enrolledAt: booking.createdAt,
      progress: 0,
      status: 'active',
      timeSpent: 0,
      
      // Video progress (empty initially)
      completedVideos: [],
      currentVideo: '',
      watchTime: 0,
      videoProgress: [],
      
      // Learning analytics
      notesCount: 0,
      bookmarksCount: 0,
      discussionPostsCount: 0,
      streakDays: 0,
      totalSessions: 0,
      averageSessionTime: 0,
      
      // Goals (empty initially)
      personalGoals: [],
      goalProgress: [],
      learningPath: [],
      
      // Certificate
      certificateIssued: false,
      
      // Migration tracking
      originalBookingId: booking.id,
      migratedAt: Timestamp.now().toDate(),
      migrationStatus: 'migrated',
      
      // Refund tracking
      refundRequested: false,
      refundProcessed: false,
    };

    const docRef = await this.enrollmentsCollection.add(enrollment);
    return { id: docRef.id, ...enrollment } as EnhancedCourseEnrollment;
  }

  /**
   * Run complete migration
   */
  async runCompleteMigration(): Promise<{
    services: { migrated: number; failed: number; errors: string[] };
    bookings: { migrated: number; failed: number; errors: string[] };
    summary: string;
  }> {
    console.log('🎯 Starting complete migration process...');
    
    const startTime = Date.now();
    
    // Migrate services first
    const serviceResults = await this.migrateAllServices();
    
    // Then migrate bookings
    const bookingResults = await this.migrateAllBookings();
    
    const duration = Date.now() - startTime;
    const summary = `Migration completed in ${duration}ms. ` +
      `${serviceResults.migrated} services migrated, ${serviceResults.failed} failed. ` +
      `${bookingResults.migrated} bookings migrated, ${bookingResults.failed} failed.`;
    
    console.log(`📋 ${summary}`);
    
    return {
      services: serviceResults,
      bookings: bookingResults,
      summary
    };
  }

  /**
   * Validate migration data
   */
  async validateMigration(): Promise<{
    validServices: number;
    validEnrollments: number;
    orphanedEnrollments: number;
    issues: string[];
  }> {
    console.log('🔍 Validating migration data...');
    
    const issues: string[] = [];
    
    // Check all courses have valid instructors
    const coursesSnapshot = await this.coursesCollection
      .where('migrationStatus', '==', 'migrated')
      .get();
    
    let validServices = 0;
    for (const courseDoc of coursesSnapshot.docs) {
      const course = courseDoc.data();
      if (course.instructorId && course.originalServiceId) {
        validServices++;
      } else {
        issues.push(`Course ${courseDoc.id} missing instructor or service reference`);
      }
    }
    
    // Check all enrollments have valid courses
    const enrollmentsSnapshot = await this.enrollmentsCollection
      .where('migrationStatus', '==', 'migrated')
      .get();
    
    let validEnrollments = 0;
    let orphanedEnrollments = 0;
    
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollment = enrollmentDoc.data();
      
      const courseCheck = await this.coursesCollection
        .doc(enrollment.courseId)
        .get();
      
      if (courseCheck.exists) {
        validEnrollments++;
      } else {
        orphanedEnrollments++;
        issues.push(`Enrollment ${enrollmentDoc.id} references non-existent course`);
      }
    }
    
    console.log(`✅ Validation complete: ${validServices} valid courses, ${validEnrollments} valid enrollments, ${orphanedEnrollments} orphaned enrollments`);
    
    return {
      validServices,
      validEnrollments,
      orphanedEnrollments,
      issues
    };
  }

  /**
   * Helper methods
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  private mapServiceCategoryToCourseCategory(serviceCategory: string): string {
    const categoryMap: Record<string, string> = {
      'career-advice': 'Career Development',
      'tech-interview': 'Technology',
      'business-consulting': 'Business',
      'academic-tutoring': 'Academic',
      'skill-development': 'Personal Development',
      'health-wellness': 'Health & Wellness',
      'creative-arts': 'Creative Arts',
      'language-learning': 'Languages',
    };
    
    return categoryMap[serviceCategory] || 'General';
  }

  private generateTagsFromService(service: Service): string[] {
    const tags = [];
    
    // Add category as tag
    tags.push(this.mapServiceCategoryToCourseCategory(service.category));
    
    // Add price-based tags
    if (service.price === 0) {
      tags.push('Free');
    } else if (service.price < 50) {
      tags.push('Affordable');
    } else if (service.price > 200) {
      tags.push('Premium');
    }
    
    // Add migration tag
    tags.push('Migrated from Service');
    
    return tags;
  }

  private getDefaultThumbnail(): string {
    return 'https://via.placeholder.com/640x360/4F46E5/FFFFFF?text=Course+Thumbnail';
  }

  /**
   * Rollback migration (for testing/recovery)
   */
  async rollbackMigration(): Promise<{
    deletedCourses: number;
    deletedEnrollments: number;
    errors: string[];
  }> {
    console.log('⚠️ Starting migration rollback...');
    
    const errors: string[] = [];
    let deletedCourses = 0;
    let deletedEnrollments = 0;
    
    try {
      // Delete migrated enrollments
      const enrollmentsSnapshot = await this.enrollmentsCollection
        .where('migrationStatus', '==', 'migrated')
        .get();
      
      for (const enrollment of enrollmentsSnapshot.docs) {
        await enrollment.ref.delete();
        deletedEnrollments++;
      }
      
      // Delete migrated courses
      const coursesSnapshot = await this.coursesCollection
        .where('migrationStatus', '==', 'migrated')
        .get();
      
      for (const course of coursesSnapshot.docs) {
        await course.ref.delete();
        deletedCourses++;
      }
      
      console.log(`✅ Rollback complete: ${deletedCourses} courses deleted, ${deletedEnrollments} enrollments deleted`);
      
    } catch (error) {
      errors.push(`Rollback error: ${error}`);
    }
    
    return { deletedCourses, deletedEnrollments, errors };
  }
}

// Export for use in migration scripts
export const migrationService = new ServiceToCourseMigrationService();
