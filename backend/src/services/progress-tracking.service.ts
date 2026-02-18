// Progress Tracking Service
// Handles student progress tracking, analytics, and certificate generation

import { 
  VideoProgressModel,
  LearningGoalModel,
  GoalProgressModel,
  EnhancedCourseEnrollmentModel,
  CourseVideoModel
} from '../models/enhanced-course.model';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export interface LearningAnalytics {
  totalWatchTime: number;
  averageSessionTime: number;
  completionRate: number;
  engagementScore: number;
  streakDays: number;
  totalSessions: number;
  lastSessionAt: Date;
  weeklyProgress: WeekProgress[];
  monthlyProgress: MonthProgress[];
}

export interface WeekProgress {
  week: string;
  watchTime: number;
  videosCompleted: number;
  sessionsCount: number;
}

export interface MonthProgress {
  month: string;
  watchTime: number;
  videosCompleted: number;
  goalsCompleted: number;
}

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  completionDate: Date;
  totalDuration: string;
  videosCompleted: number;
  totalVideos: number;
  verificationCode: string;
}

export class ProgressTrackingService {
  private videoProgressCollection = db.collection('videoProgress');
  private learningGoalsCollection = db.collection('learningGoals');
  private goalProgressCollection = db.collection('goalProgress');
  private enrollmentsCollection = db.collection('courseEnrollments');
  private certificatesCollection = db.collection('courseCertificates');
  private analyticsCollection = db.collection('learningAnalytics');

  /**
   * Update video progress with session tracking
   */
  async updateVideoProgress(
    enrollmentId: string,
    videoId: string,
    studentId: string,
    progressData: {
      watchedDuration: number;
      totalDuration: number;
      lastPosition: number;
      completed: boolean;
      sessionDuration?: number;
    }
  ): Promise<VideoProgressModel> {
    const progressRef = this.videoProgressCollection.doc(`${enrollmentId}_${videoId}`);
    
    const existingProgress = await progressRef.get();
    const currentProgress = existingProgress.exists 
      ? existingProgress.data() as VideoProgressModel
      : {
          videoId,
          enrollmentId,
          watchedDuration: 0,
          totalDuration: progressData.totalDuration,
          lastPosition: 0,
          completed: false,
          watchSessions: [],
          createdAt: new Date(),
        };

    // Create new watch session
    const newSession = {
      id: `session_${Date.now()}`,
      startTime: new Date(Date.now() - (progressData.sessionDuration || 0) * 1000),
      endTime: new Date(),
      duration: progressData.sessionDuration || 0,
      startPosition: currentProgress.lastPosition,
      endPosition: progressData.lastPosition,
      device: 'mobile', // Could be detected from user agent
    };

    const updatedProgress: VideoProgressModel = {
      ...currentProgress,
      watchedDuration: progressData.watchedDuration,
      lastPosition: progressData.lastPosition,
      completed: progressData.completed,
      watchSessions: [...currentProgress.watchSessions, newSession],
    };

    if (progressData.completed && !currentProgress.completed) {
      updatedProgress.completedAt = new Date();
    }

    if (existingProgress.exists) {
      await progressRef.update(updatedProgress as any);
    } else {
      await progressRef.set(updatedProgress as any);
    }

    // Update overall enrollment progress
    await this.updateEnrollmentProgress(enrollmentId);

    return updatedProgress;
  }

  /**
   * Update overall enrollment progress based on video progress
   */
  private async updateEnrollmentProgress(enrollmentId: string): Promise<void> {
    const videoProgressSnapshot = await this.videoProgressCollection
      .where('enrollmentId', '==', enrollmentId)
      .get();

    const videoProgress = videoProgressSnapshot.docs.map(
      doc => doc.data() as VideoProgressModel
    );

    const completedVideos = videoProgress.filter(vp => vp.completed).length;
    const totalVideos = videoProgress.length;
    const totalWatchTime = videoProgress.reduce((sum, vp) => sum + vp.watchedDuration, 0);
    const totalSessions = videoProgress.reduce((sum, vp) => sum + vp.watchSessions.length, 0);

    const progressPercentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
    const averageSessionTime = totalSessions > 0 ? Math.round(totalWatchTime / totalSessions) : 0;

    // Update enrollment
    await this.enrollmentsCollection.doc(enrollmentId).update({
      progress: progressPercentage,
      completedVideos: videoProgress.filter(vp => vp.completed).map(vp => vp.videoId),
      watchTime: totalWatchTime,
      totalSessions,
      averageSessionTime,
      lastAccessAt: new Date(),
    });

    // Check if course is completed
    if (progressPercentage === 100 && completedVideos === totalVideos) {
      await this.markCourseAsCompleted(enrollmentId);
    }

    // Update analytics
    await this.updateLearningAnalytics(enrollmentId);
  }

  /**
   * Mark course as completed and issue certificate
   */
  private async markCourseAsCompleted(enrollmentId: string): Promise<void> {
    const enrollmentDoc = await this.enrollmentsCollection.doc(enrollmentId).get();
    if (!enrollmentDoc.exists) return;

    const enrollment = enrollmentDoc.data() as EnhancedCourseEnrollmentModel;
    
    // Update enrollment status
    await this.enrollmentsCollection.doc(enrollmentId).update({
      status: 'completed',
      completedAt: new Date(),
      progress: 100,
    });

    // Issue certificate if enabled
    const courseDoc = await db.collection('courses').doc(enrollment.courseId).get();
    const course = courseDoc.data();
    
    if (course?.certificateAvailable) {
      await this.issueCertificate(enrollmentId, enrollment.courseId, enrollment.studentId);
    }
  }

  /**
   * Get comprehensive learning analytics for a student
   */
  async getLearningAnalytics(studentId: string, courseId?: string): Promise<LearningAnalytics> {
    const baseQuery = courseId 
      ? this.enrollmentsCollection.where('courseId', '==', courseId)
      : this.enrollmentsCollection.where('studentId', '==', studentId);

    const enrollmentsSnapshot = await baseQuery.get();
    const enrollments = enrollmentsSnapshot.docs.map(doc => 
      ({ id: doc.id, ...doc.data() } as EnhancedCourseEnrollmentModel)
    );

    // Calculate aggregate metrics
    const totalWatchTime = enrollments.reduce((sum, e) => sum + e.watchTime, 0);
    const totalSessions = enrollments.reduce((sum, e) => sum + e.totalSessions, 0);
    const averageSessionTime = totalSessions > 0 ? totalWatchTime / totalSessions : 0;
    const completionRate = enrollments.length > 0 
      ? enrollments.filter(e => e.status === 'completed').length / enrollments.length 
      : 0;

    // Calculate engagement score (0-100)
    const engagementScore = this.calculateEngagementScore(enrollments);

    // Get streak data
    const streakData = await this.calculateStreak(studentId);

    // Generate weekly and monthly progress
    const weeklyProgress = await this.generateWeeklyProgress(studentId, courseId);
    const monthlyProgress = await this.generateMonthlyProgress(studentId, courseId);

    return {
      totalWatchTime,
      averageSessionTime,
      completionRate,
      engagementScore,
      streakDays: streakData.streakDays,
      totalSessions,
      lastSessionAt: streakData.lastSessionAt,
      weeklyProgress,
      monthlyProgress,
    };
  }

  /**
   * Calculate engagement score based on various factors
   */
  private calculateEngagementScore(enrollments: EnhancedCourseEnrollmentModel[]): number {
    if (enrollments.length === 0) return 0;

    let score = 0;

    // Completion rate (40% weight)
    const completionRate = enrollments.filter(e => e.status === 'completed').length / enrollments.length;
    score += completionRate * 40;

    // Average session time (30% weight) - ideal is 20+ minutes
    const avgSessionTime = enrollments.reduce((sum, e) => sum + e.averageSessionTime, 0) / enrollments.length;
    const sessionScore = Math.min(avgSessionTime / 20, 1) * 30;
    score += sessionScore;

    // Streak consistency (20% weight) - ideal is 7+ days
    const avgStreak = enrollments.reduce((sum, e) => sum + e.streakDays, 0) / enrollments.length;
    const streakScore = Math.min(avgStreak / 7, 1) * 20;
    score += streakScore;

    // Goal completion (10% weight)
    const goalCompletionRate = enrollments.reduce((sum, e) => {
      const completedGoals = e.personalGoals?.filter((g: LearningGoalModel) => g.isCompleted).length || 0;
      const totalGoals = e.personalGoals?.length || 1;
      return sum + (completedGoals / totalGoals);
    }, 0) / enrollments.length;
    score += goalCompletionRate * 10;

    return Math.round(score);
  }

  /**
   * Calculate learning streak for a student
   */
  private async calculateStreak(studentId: string): Promise<{ streakDays: number; lastSessionAt: Date }> {
    const videoProgressSnapshot = await this.videoProgressCollection
      .where('studentId', '==', studentId)
      .get();

    const allSessions = videoProgressSnapshot.docs
      .flatMap(doc => (doc.data() as VideoProgressModel).watchSessions)
      .sort((a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0));

    if (allSessions.length === 0) {
      return { streakDays: 0, lastSessionAt: new Date() };
    }

    const lastSessionAt = allSessions[0].endTime || new Date();
    let streakDays = 0;
    let currentDate = new Date(lastSessionAt);

    // Count consecutive days with sessions
    while (true) {
      const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const hasSessionOnDay = allSessions.some(session => 
        !!session.endTime && session.endTime >= dayStart && session.endTime < dayEnd
      );

      if (hasSessionOnDay) {
        streakDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return { streakDays, lastSessionAt };
  }

  /**
   * Generate weekly progress data
   */
  private async generateWeeklyProgress(studentId: string, courseId?: string): Promise<WeekProgress[]> {
    const progress: WeekProgress[] = [];
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekLabel = weekStart.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });

      // Get sessions for this week
      const videoProgressSnapshot = await this.videoProgressCollection
        .where('studentId', '==', studentId)
        .get();

      const weekSessions = videoProgressSnapshot.docs
        .flatMap(doc => (doc.data() as VideoProgressModel).watchSessions)
        .filter(session => !!session.endTime && session.endTime >= weekStart && session.endTime < weekEnd);

      const watchTime = weekSessions.reduce((sum, session) => sum + session.duration, 0);
      const videosCompleted = new Set(
        videoProgressSnapshot.docs
          .filter(doc => {
            const progress = doc.data() as VideoProgressModel;
            return progress.completedAt && 
                   progress.completedAt >= weekStart && 
                   progress.completedAt < weekEnd;
          })
          .map(doc => doc.id)
      ).size;

      progress.push({
        week: weekLabel,
        watchTime,
        videosCompleted,
        sessionsCount: weekSessions.length,
      });
    }

    return progress;
  }

  /**
   * Generate monthly progress data
   */
  private async generateMonthlyProgress(studentId: string, courseId?: string): Promise<MonthProgress[]> {
    const progress: MonthProgress[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthLabel = monthStart.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });

      // Get progress for this month
      const videoProgressSnapshot = await this.videoProgressCollection
        .where('studentId', '==', studentId)
        .get();

      const monthVideosCompleted = videoProgressSnapshot.docs
        .filter(doc => {
          const progress = doc.data() as VideoProgressModel;
          return progress.completedAt && 
                 progress.completedAt >= monthStart && 
                 progress.completedAt < monthEnd;
        }).length;

      const watchTime = videoProgressSnapshot.docs
        .flatMap(doc => (doc.data() as VideoProgressModel).watchSessions)
        .filter(session => !!session.endTime && session.endTime >= monthStart && session.endTime < monthEnd)
        .reduce((sum, session) => sum + session.duration, 0);

      // Get goals completed this month
      const goalsSnapshot = await this.learningGoalsCollection
        .where('studentId', '==', studentId)
        .get();

      const goalsCompleted = goalsSnapshot.docs
        .filter(doc => {
          const goal = doc.data() as LearningGoalModel;
          return goal.isCompleted && 
                 goal.updatedAt && 
                 goal.updatedAt >= monthStart && 
                 goal.updatedAt < monthEnd;
        }).length;

      progress.push({
        month: monthLabel,
        watchTime,
        videosCompleted: monthVideosCompleted,
        goalsCompleted,
      });
    }

    return progress;
  }

  /**
   * Issue certificate for course completion
   */
  async issueCertificate(
    enrollmentId: string,
    courseId: string,
    studentId: string
  ): Promise<string> {
    // Check if certificate already exists
    const existingCert = await this.certificatesCollection
      .where('enrollmentId', '==', enrollmentId)
      .limit(1)
      .get();

    if (!existingCert.empty) {
      return existingCert.docs[0].id;
    }

    // Get enrollment and course data
    const [enrollmentDoc, courseDoc, studentDoc] = await Promise.all([
      this.enrollmentsCollection.doc(enrollmentId).get(),
      db.collection('courses').doc(courseId).get(),
      db.collection('users').doc(studentId).get(),
    ]);

    if (!enrollmentDoc.exists || !courseDoc.exists || !studentDoc.exists) {
      throw new Error('Required data not found for certificate generation');
    }

    const enrollment = enrollmentDoc.data() as EnhancedCourseEnrollmentModel;
    const course = (courseDoc.data() || {}) as any;
    const student = (studentDoc.data() || {}) as any;

    // Generate verification code
    const verificationCode = this.generateVerificationCode();

    // Create certificate data
    const certificateData = {
      enrollmentId,
      courseId,
      studentId,
      studentName: `${student.firstName} ${student.lastName}`.trim() || student.email,
      courseTitle: course.title,
      instructorName: course.instructorName,
      completionDate: enrollment.completedAt || new Date(),
      totalDuration: this.formatDuration(course.totalDuration || 0),
      videosCompleted: enrollment.completedVideos?.length || 0,
      totalVideos: course.totalVideos || 0,
      verificationCode,
      certificateUrl: '', // Will be generated by certificate service
      issuedAt: new Date(),
      isRevoked: false,
    };

    const certDoc = await this.certificatesCollection.add(certificateData);
    
    // Update enrollment with certificate info
    await this.enrollmentsCollection.doc(enrollmentId).update({
      certificateIssued: true,
      certificateId: certDoc.id,
    });

    return certDoc.id;
  }

  /**
   * Generate unique verification code
   */
  private generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Format duration in seconds to human-readable format
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Get student's certificates
   */
  async getStudentCertificates(studentId: string): Promise<any[]> {
    const snapshot = await this.certificatesCollection
      .where('studentId', '==', studentId)
      .where('isRevoked', '==', false)
      .orderBy('issuedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Verify certificate
   */
  async verifyCertificate(verificationCode: string): Promise<any | null> {
    const snapshot = await this.certificatesCollection
      .where('verificationCode', '==', verificationCode)
      .where('isRevoked', '==', false)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }

  /**
   * Update learning analytics
   */
  private async updateLearningAnalytics(enrollmentId: string): Promise<void> {
    const enrollmentDoc = await this.enrollmentsCollection.doc(enrollmentId).get();
    if (!enrollmentDoc.exists) return;

    const enrollment = enrollmentDoc.data() as EnhancedCourseEnrollmentModel;
    const studentId = enrollment.studentId;
    const courseId = enrollment.courseId;

    // Get or create analytics document
    const analyticsRef = this.analyticsCollection.doc(`${studentId}_${courseId}`);
    const analyticsDoc = await analyticsRef.get();

    const analytics = {
      studentId,
      courseId,
      enrollmentId,
      totalWatchTime: enrollment.watchTime,
      averageSessionTime: enrollment.averageSessionTime,
      completionRate: enrollment.progress,
      engagementScore: 0, // Would be calculated
      streakDays: enrollment.streakDays,
      totalSessions: enrollment.totalSessions,
      lastSessionAt: enrollment.lastSessionAt,
      updatedAt: new Date(),
    };

    if (analyticsDoc.exists) {
      await analyticsRef.update(analytics);
    } else {
      await analyticsRef.set({
        ...analytics,
        createdAt: new Date(),
      });
    }
  }
}

export const progressTrackingService = new ProgressTrackingService();
