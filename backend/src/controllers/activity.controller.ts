import { Request, Response } from "express";
import { db } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { Logger } from "../utils/logger";

export interface Activity {
  id: string;
  type: 'profile_approved' | 'profile_rejected' | 'application_submitted' | 'application_approved' | 'application_rejected' | 'registration';
  title: string;
  description: string;
  userName: string;
  timestamp: Timestamp;
  userId?: string;
}

export const getRecentActivities = async (req: Request, res: Response) => {
  const route = "GET /admin/activities";
  
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const activities: Activity[] = [];

    // 1. Get recently approved/rejected consultant profiles
    // Note: Firestore 'in' operator supports up to 10 values
    const approvedProfiles = await db.collection("consultantProfiles")
      .where("status", "in", ["approved", "rejected"])
      .orderBy("updatedAt", "desc")
      .limit(limit * 2) // Get more to filter later
      .get();

    approvedProfiles.forEach((doc) => {
      const profile = doc.data();
      const status = profile.status;
      const userName = profile.personalInfo?.fullName || profile.personalInfo?.email || "Unknown";
      
      if (status === "approved") {
        activities.push({
          id: `profile-${doc.id}`,
          type: 'profile_approved',
          title: 'Profile approved',
          description: `${userName}'s consultant profile was approved`,
          userName,
          timestamp: profile.updatedAt || profile.createdAt,
          userId: doc.id,
        });
      } else if (status === "rejected") {
        activities.push({
          id: `profile-${doc.id}`,
          type: 'profile_rejected',
          title: 'Profile rejected',
          description: `${userName}'s consultant profile was rejected`,
          userName,
          timestamp: profile.updatedAt || profile.createdAt,
          userId: doc.id,
        });
      }
    });

    // 2. Get recently submitted/approved/rejected service applications
    const applications = await db.collection("consultantApplications")
      .orderBy("submittedAt", "desc")
      .limit(limit)
      .get();

    applications.forEach((doc) => {
      const application = doc.data();
      const status = application.status;
      const userName = application.consultantName || "Unknown";
      
      if (status === "pending" && application.submittedAt) {
        activities.push({
          id: `application-submitted-${doc.id}`,
          type: 'application_submitted',
          title: 'New application',
          description: `${userName} submitted a service application`,
          userName,
          timestamp: application.submittedAt,
          userId: application.consultantId,
        });
      } else if (status === "approved" && application.reviewedAt) {
        activities.push({
          id: `application-approved-${doc.id}`,
          type: 'application_approved',
          title: 'Application approved',
          description: `${userName}'s service application was approved`,
          userName,
          timestamp: application.reviewedAt,
          userId: application.consultantId,
        });
      } else if (status === "rejected" && application.reviewedAt) {
        activities.push({
          id: `application-rejected-${doc.id}`,
          type: 'application_rejected',
          title: 'Application rejected',
          description: `${userName}'s service application was rejected`,
          userName,
          timestamp: application.reviewedAt,
          userId: application.consultantId,
        });
      }
    });

    // 3. Get recently registered consultants
    const recentUsers = await db.collection("users")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    recentUsers.forEach((doc) => {
      const user = doc.data();
      const roles = user.roles || [];
      const hasConsultantRole = roles.includes("consultant") || user.role === "consultant";
      
      if (hasConsultantRole && user.createdAt) {
        activities.push({
          id: `registration-${doc.id}`,
          type: 'registration',
          title: 'New registration',
          description: `${user.name || user.email || "Unknown"} registered as a consultant`,
          userName: user.name || user.email || "Unknown",
          timestamp: user.createdAt,
          userId: doc.id,
        });
      }
    });

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => {
      const aTime = a.timestamp?.toMillis() || 0;
      const bTime = b.timestamp?.toMillis() || 0;
      return bTime - aTime;
    });

    // Limit to requested number
    const limitedActivities = activities.slice(0, limit);

    Logger.success(route, "", `Retrieved ${limitedActivities.length} activities`);
    res.status(200).json({
      activities: limitedActivities,
      total: limitedActivities.length,
    });
  } catch (error) {
    Logger.error(route, "", "Error fetching activities", error);
    res.status(500).json({
      error: "Failed to fetch activities",
      message: (error as Error).message,
    });
  }
};

