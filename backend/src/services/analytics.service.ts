// src/services/analytics.service.ts
import { db } from "../config/firebase";
import { Logger } from "../utils/logger";

export interface ConsultantAnalytics {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  averageRating: number;
  totalReviews: number;
  topServices: Array<{ serviceId: string; serviceTitle: string; bookingCount: number; revenue: number }>;
  bookingTrends: {
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
  clientRetention: number; // Percentage of returning clients
}

/**
 * Get analytics for a consultant
 */
export const getConsultantAnalytics = async (consultantId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<ConsultantAnalytics> => {
  try {
    Logger.info("Analytics", consultantId, `Fetching analytics for period: ${period}`);

    // Get all bookings for consultant
    const bookingsSnapshot = await db
      .collection("bookings")
      .where("consultantId", "==", consultantId)
      .get();

    const allBookings = bookingsSnapshot.docs.map(doc => doc.data());
    
    // Filter bookings by period
    const now = new Date();
    const filteredBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      
      switch (period) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return bookingDate >= weekAgo;
        case 'month':
          return bookingDate.getMonth() === now.getMonth() && 
                 bookingDate.getFullYear() === now.getFullYear();
        case 'year':
          return bookingDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });

    // Calculate booking counts
    const totalBookings = filteredBookings.length;
    const completedBookings = filteredBookings.filter(b => 
      b.status === 'completed' || b.status === 'approved'
    ).length;
    const pendingBookings = filteredBookings.filter(b => 
      b.status === 'accepted' || b.status === 'confirmed' || b.status === 'pending'
    ).length;
    const cancelledBookings = filteredBookings.filter(b => 
      b.status === 'cancelled'
    ).length;

    // Calculate revenue (only from paid bookings)
    const paidBookings = filteredBookings.filter(b => b.paymentStatus === 'paid');
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const averageBookingValue = paidBookings.length > 0 
      ? totalRevenue / paidBookings.length 
      : 0;

    // Get consultant's rating and reviews
    const consultantDoc = await db.collection("consultants").doc(consultantId).get();
    const consultantData = consultantDoc.data();
    const averageRating = consultantData?.rating || 0;
    const totalReviews = consultantData?.totalReviews || 0;

    // Calculate top services
    const serviceMap: Record<string, { serviceId: string; bookingCount: number; revenue: number }> = {};
    
    paidBookings.forEach(booking => {
      const serviceId = booking.serviceId;
      if (!serviceMap[serviceId]) {
        serviceMap[serviceId] = {
          serviceId,
          bookingCount: 0,
          revenue: 0,
        };
      }
      serviceMap[serviceId].bookingCount++;
      serviceMap[serviceId].revenue += booking.amount || 0;
    });

    // Fetch service titles
    const topServices = await Promise.all(
      Object.values(serviceMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(async (service) => {
          let serviceTitle = `Service ${service.serviceId.slice(0, 8)}`;
          try {
            const serviceDoc = await db.collection("services").doc(service.serviceId).get();
            if (serviceDoc.exists) {
              serviceTitle = serviceDoc.data()?.title || serviceTitle;
            }
          } catch {
            // Use default title
          }
          return {
            ...service,
            serviceTitle,
          };
        })
    );

    // Calculate booking trends
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay()); // Start of this week
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisWeekBookings = allBookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate >= thisWeekStart;
    }).length;

    const lastWeekBookings = allBookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate >= lastWeekStart && bookingDate < thisWeekStart;
    }).length;

    const thisMonthBookings = allBookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate >= thisMonthStart;
    }).length;

    const lastMonthBookings = allBookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate >= lastMonthStart && bookingDate < thisMonthStart;
    }).length;

    // Calculate client retention (percentage of clients with multiple bookings)
    const clientBookingCounts: Record<string, number> = {};
    allBookings.forEach(booking => {
      if (booking.paymentStatus === 'paid') {
        clientBookingCounts[booking.studentId] = (clientBookingCounts[booking.studentId] || 0) + 1;
      }
    });

    const totalClients = Object.keys(clientBookingCounts).length;
    const returningClients = Object.values(clientBookingCounts).filter(count => count > 1).length;
    const clientRetention = totalClients > 0 ? (returningClients / totalClients) * 100 : 0;

    const analytics: ConsultantAnalytics = {
      totalBookings,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue,
      averageBookingValue,
      averageRating,
      totalReviews,
      topServices,
      bookingTrends: {
        thisWeek: thisWeekBookings,
        lastWeek: lastWeekBookings,
        thisMonth: thisMonthBookings,
        lastMonth: lastMonthBookings,
      },
      clientRetention: Math.round(clientRetention * 10) / 10, // Round to 1 decimal
    };

    Logger.info("Analytics", consultantId, `Analytics calculated: ${totalBookings} bookings, $${totalRevenue} revenue`);
    return analytics;
  } catch (error: any) {
    Logger.error("Analytics", consultantId, `Failed to get analytics: ${error.message}`, error);
    throw error;
  }
};

export interface AdminAnalytics {
  overview: {
    totalUsers: number;
    activeConsultants: number;
    totalBookings: number;
    totalRevenue: number;
    pendingApplications: number;
    completedBookings: number;
    cancelledBookings: number;
  };
  trends: {
    newUsersThisMonth: number;
    newConsultantsThisMonth: number;
    bookingsThisMonth: number;
    revenueThisMonth: number;
    bookingsGrowth: number; // Percentage change from last month
    revenueGrowth: number; // Percentage change from last month
  };
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
  aiSnapshot: {
    topConsultants: string[];
    revenueByRole: Record<string, number>;
    dropoffPoints: string[];
    suspiciousSignals: string[];
    recentJobDescriptions: string[];
    abnormalActivitySignals: string[];
    highDemandIndustries: string[];
    underservedSegments: string[];
  };
}

type FirestoreLikeTimestamp =
  | {
      _seconds?: number;
      _nanoseconds?: number;
      seconds?: number;
      nanoseconds?: number;
      toDate?: () => Date;
    }
  | Date
  | string
  | number
  | null
  | undefined;

interface ConsultantProfileDoc {
  id: string;
  status?: string;
  personalInfo?: {
    fullName?: string;
  };
  professionalInfo?: {
    category?: string;
  };
  createdAt?: FirestoreLikeTimestamp;
  updatedAt?: FirestoreLikeTimestamp;
}

interface BookingDoc {
  id: string;
  studentId?: string;
  consultantId?: string;
  status?: string;
  paymentStatus?: string;
  amount?: number;
  date?: FirestoreLikeTimestamp;
  createdAt?: FirestoreLikeTimestamp;
}

interface ApplicationDoc {
  id: string;
  consultantId?: string;
  status?: string;
  createdAt?: FirestoreLikeTimestamp;
}

interface JobDoc {
  id: string;
  postedBy?: string;
  title?: string;
  description?: string;
  company?: string;
  requiredSkills?: string[];
  status?: string;
  createdAt?: FirestoreLikeTimestamp;
}

interface JobApplicationDoc {
  id: string;
  jobId?: string;
  userId?: string;
  status?: string;
  appliedAt?: FirestoreLikeTimestamp;
}

/**
 * Get admin analytics for the entire platform
 */
export const getAdminAnalytics = async (): Promise<AdminAnalytics> => {
  try {
    Logger.info("Admin Analytics", "", "Fetching admin analytics");

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Get all consultant profiles (these represent all users who registered as consultants)
    // For total users, we'll count unique user IDs from profiles, bookings, and other sources
    const profilesSnapshot = await db.collection("consultantProfiles").get();
    const allProfiles: ConsultantProfileDoc[] = profilesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    }));
    
    // Get all bookings
    const bookingsSnapshot = await db.collection("bookings").get();
    const allBookings: BookingDoc[] = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    }));
    
    // Get all applications
    const applicationsSnapshot = await db.collection("consultantApplications").get();
    const allApplications: ApplicationDoc[] = applicationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    }));

    // Get all jobs and job applications for admin AI signals
    const jobsSnapshot = await db.collection("jobs").get();
    const allJobs: JobDoc[] = jobsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    }));

    const jobApplicationsSnapshot = await db.collection("jobApplications").get();
    const allJobApplications: JobApplicationDoc[] = jobApplicationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    }));
    
    // Calculate total users: unique user IDs from profiles, bookings (students), and consultants
    const userIds = new Set<string>();
    allProfiles.forEach(p => userIds.add(p.id));
    allBookings.forEach(b => {
      if (b.studentId) userIds.add(b.studentId);
      if (b.consultantId) userIds.add(b.consultantId);
    });
    allApplications.forEach(a => {
      if (a.consultantId) userIds.add(a.consultantId);
    });
    const allUsers = Array.from(userIds).map(uid => ({ uid }));

    // Calculate overview metrics
    const totalUsers = allUsers.length;
    const activeConsultants = allProfiles.filter(p => p.status === 'approved').length;
    const totalBookings = allBookings.length;
    const completedBookings = allBookings.filter(b => 
      b.status === 'completed' || b.status === 'approved'
    ).length;
    const cancelledBookings = allBookings.filter(b => b.status === 'cancelled').length;
    
    // Calculate total revenue from paid bookings
    const paidBookings = allBookings.filter(b => b.paymentStatus === 'paid');
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    
    const pendingApplications = allApplications.filter(a => a.status === 'pending').length;

    // Helper function to convert Firestore timestamp to Date
    const toDate = (timestamp: FirestoreLikeTimestamp): Date => {
      if (timestamp === null || timestamp === undefined) return new Date(0);
      if (typeof timestamp === 'number') {
        return new Date(timestamp);
      }
      if (typeof timestamp === 'string') {
        const parsed = Date.parse(timestamp);
        return Number.isNaN(parsed) ? new Date(0) : new Date(parsed);
      }
      if (timestamp instanceof Date) {
        return timestamp;
      }
      if (typeof timestamp === 'object') {
        if (typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }
        if (timestamp._seconds !== undefined) {
          const seconds = timestamp._seconds || 0;
          const nanos = timestamp._nanoseconds || 0;
          return new Date(seconds * 1000 + Math.floor(nanos / 1_000_000));
        }
        if (timestamp.seconds !== undefined) {
          const seconds = timestamp.seconds || 0;
          const nanos = timestamp.nanoseconds || 0;
          return new Date(seconds * 1000 + Math.floor(nanos / 1_000_000));
        }
      }
      return new Date(0);
    };

    const getIndustryLabel = (job: JobDoc): string => {
      const text = `${job.title || ""} ${job.description || ""} ${(job.requiredSkills || []).join(" ")}`.toLowerCase();
      if (/(nurse|health|medical|patient|clinic|hospital)/.test(text)) return "Healthcare";
      if (/(software|frontend|backend|react|node|python|engineer|developer|data)/.test(text)) return "Technology";
      if (/(warehouse|logistics|forklift|inventory|shipping)/.test(text)) return "Logistics";
      if (/(sales|account executive|business development|retail)/.test(text)) return "Sales";
      if (/(accounting|finance|analyst|auditor)/.test(text)) return "Finance";
      if (/(teacher|education|training|instructor)/.test(text)) return "Education";
      return "General";
    };

    // Calculate trends - get user creation dates from profiles
    const newUsersThisMonth = allProfiles.filter(p => {
      const createdAt = toDate(p.createdAt);
      return createdAt >= thisMonthStart;
    }).length;

    const newConsultantsThisMonth = allProfiles.filter(p => {
      const createdAt = toDate(p.createdAt);
      return createdAt >= thisMonthStart && p.status === 'approved';
    }).length;

    const bookingsThisMonth = allBookings.filter(b => {
      const bookingDate = toDate(b.date || b.createdAt);
      return bookingDate >= thisMonthStart;
    }).length;

    const bookingsLastMonth = allBookings.filter(b => {
      const bookingDate = toDate(b.date || b.createdAt);
      return bookingDate >= lastMonthStart && bookingDate < thisMonthStart;
    }).length;

    const revenueThisMonth = paidBookings.filter(b => {
      const bookingDate = toDate(b.date || b.createdAt);
      return bookingDate >= thisMonthStart;
    }).reduce((sum, b) => sum + (b.amount || 0), 0);

    const revenueLastMonth = paidBookings.filter(b => {
      const bookingDate = toDate(b.date || b.createdAt);
      return bookingDate >= lastMonthStart && bookingDate < thisMonthStart;
    }).reduce((sum, b) => sum + (b.amount || 0), 0);

    const bookingsGrowth = bookingsLastMonth > 0 
      ? ((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100 
      : bookingsThisMonth > 0 ? 100 : 0;

    const revenueGrowth = revenueLastMonth > 0 
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 
      : revenueThisMonth > 0 ? 100 : 0;

    // Get recent activity (last 10 activities)
    const recentActivity = [];
    
    // Recent profile approvals
    const recentApprovals = allProfiles
      .filter(p => p.status === 'approved')
      .sort((a, b) => {
        const dateA = toDate(a.updatedAt);
        const dateB = toDate(b.updatedAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5)
      .map(p => ({
        type: 'profile_approved',
        description: `Profile approved: ${p.personalInfo?.fullName || 'Unknown'}`,
        timestamp: toDate(p.updatedAt).toISOString(),
      }));

    recentActivity.push(...recentApprovals);

    // Recent bookings
    const recentBookings = allBookings
      .sort((a, b) => {
        const dateA = toDate(a.createdAt);
        const dateB = toDate(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5)
      .map(b => ({
        type: 'booking_created',
        description: `New booking created: ${b.status || 'pending'}`,
        timestamp: toDate(b.createdAt).toISOString(),
      }));

    recentActivity.push(...recentBookings);

    // Sort by timestamp and take top 10
    recentActivity.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    recentActivity.splice(10);

    // ========== AI snapshot data (used by FastAPI admin-ai endpoint) ==========
    const profileByUid = new Map(allProfiles.map((p) => [p.id, p]));
    const consultantPerf = new Map<string, { completed: number; revenue: number }>();
    const revenueByRole: Record<string, number> = {};
    const consultantBookings: Record<string, { total: number; cancelled: number }> = {};

    allBookings.forEach((booking) => {
      const consultantId = booking.consultantId;
      if (!consultantId) return;

      consultantBookings[consultantId] = consultantBookings[consultantId] || { total: 0, cancelled: 0 };
      consultantBookings[consultantId].total += 1;
      if (booking.status === "cancelled") {
        consultantBookings[consultantId].cancelled += 1;
      }

      const isCompleted = booking.status === "completed" || booking.status === "approved";
      const isPaid = booking.paymentStatus === "paid";
      if (!isCompleted && !isPaid) return;

      const current = consultantPerf.get(consultantId) || { completed: 0, revenue: 0 };
      current.completed += isCompleted ? 1 : 0;
      current.revenue += booking.amount || 0;
      consultantPerf.set(consultantId, current);

      const role = profileByUid.get(consultantId)?.professionalInfo?.category || "General";
      revenueByRole[role] = (revenueByRole[role] || 0) + (booking.amount || 0);
    });

    const topConsultants = Array.from(consultantPerf.entries())
      .sort((a, b) => {
        const scoreA = a[1].completed * 100 + a[1].revenue;
        const scoreB = b[1].completed * 100 + b[1].revenue;
        return scoreB - scoreA;
      })
      .slice(0, 5)
      .map(([uid, perf]) => {
        const name =
          profileByUid.get(uid)?.personalInfo?.fullName ||
          `Consultant ${uid.slice(0, 8)}`;
        return `${name} (${perf.completed} completed, $${Math.round(perf.revenue)})`;
      });

    const profileApprovalRate = allProfiles.length > 0
      ? allProfiles.filter((p) => p.status === "approved").length / allProfiles.length
      : 1;
    const bookingCompletionRate = totalBookings > 0 ? completedBookings / totalBookings : 1;
    const appReviewRate = allApplications.length > 0
      ? allApplications.filter((a) => a.status !== "pending").length / allApplications.length
      : 1;

    const dropoffPoints: string[] = [];
    if (profileApprovalRate < 0.7) {
      dropoffPoints.push(
        `Consultant profile approval is ${(profileApprovalRate * 100).toFixed(1)}%; review onboarding requirements and guidance.`
      );
    }
    if (bookingCompletionRate < 0.75) {
      dropoffPoints.push(
        `Booking completion is ${(bookingCompletionRate * 100).toFixed(1)}%; investigate cancellations and no-shows.`
      );
    }
    if (appReviewRate < 0.75) {
      dropoffPoints.push(
        `Application review throughput is ${(appReviewRate * 100).toFixed(1)}%; pending queue may be blocking supply.`
      );
    }
    if (dropoffPoints.length === 0) {
      dropoffPoints.push("No major drop-off detected in current profile, application, and booking funnel.");
    }

    const suspiciousSignals: string[] = [];
    const jobsByPoster = new Map<string, number>();
    const descriptionFingerprint = new Map<string, number>();
    allJobs.forEach((job) => {
      const poster = job.postedBy || "unknown";
      jobsByPoster.set(poster, (jobsByPoster.get(poster) || 0) + 1);

      const fingerprint = (job.description || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120);
      if (fingerprint) {
        descriptionFingerprint.set(fingerprint, (descriptionFingerprint.get(fingerprint) || 0) + 1);
      }

      if ((job.requiredSkills || []).length >= 15) {
        suspiciousSignals.push(
          `Job "${job.title || job.id}" has ${(job.requiredSkills || []).length} required skills; possible unrealistic criteria.`
        );
      }
    });

    jobsByPoster.forEach((count, poster) => {
      if (count >= 20) {
        suspiciousSignals.push(`Employer ${poster} posted ${count} jobs; review for potential spam behavior.`);
      }
    });
    descriptionFingerprint.forEach((count) => {
      if (count >= 6) {
        suspiciousSignals.push(`Detected ${count} near-duplicate job descriptions across postings.`);
      }
    });
    if (suspiciousSignals.length === 0) {
      suspiciousSignals.push("No high-confidence suspicious employer behavior signals detected.");
    }

    const abnormalActivitySignals: string[] = [];
    Object.entries(consultantBookings).forEach(([consultantId, stats]) => {
      if (stats.total >= 5) {
        const cancelRate = stats.cancelled / stats.total;
        if (cancelRate >= 0.5) {
          const name =
            profileByUid.get(consultantId)?.personalInfo?.fullName ||
            consultantId.slice(0, 8);
          abnormalActivitySignals.push(
            `Consultant ${name} has ${(cancelRate * 100).toFixed(0)}% cancellation rate over ${stats.total} bookings.`
          );
        }
      }
    });

    const applicationsPerDayByUser = new Map<string, number>();
    allJobApplications.forEach((app) => {
      if (!app.userId) return;
      const d = toDate(app.appliedAt);
      const dayKey = `${app.userId}:${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      applicationsPerDayByUser.set(dayKey, (applicationsPerDayByUser.get(dayKey) || 0) + 1);
    });
    applicationsPerDayByUser.forEach((count, dayUser) => {
      if (count >= 25) {
        const userId = dayUser.split(":")[0];
        abnormalActivitySignals.push(`User ${userId} submitted ${count} job applications in one day.`);
      }
    });
    if (abnormalActivitySignals.length === 0) {
      abnormalActivitySignals.push("No abnormal account-activity spikes detected.");
    }

    const recentJobDescriptions = allJobs
      .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
      .slice(0, 8)
      .map((job) => `${job.title || "Untitled"}: ${(job.description || "").slice(0, 220)}`);

    const demandByIndustry = new Map<string, number>();
    allJobs.forEach((job) => {
      if (job.status && job.status !== "active") return;
      const industry = getIndustryLabel(job);
      demandByIndustry.set(industry, (demandByIndustry.get(industry) || 0) + 1);
    });

    const supplyByIndustry = new Map<string, number>();
    allProfiles.forEach((p) => {
      const category = (p.professionalInfo?.category || "General").toLowerCase();
      let industry = "General";
      if (/(health|medical|nurs)/.test(category)) industry = "Healthcare";
      else if (/(tech|software|engineer|developer|data)/.test(category)) industry = "Technology";
      else if (/(logistics|warehouse|supply)/.test(category)) industry = "Logistics";
      else if (/(sales|retail|business)/.test(category)) industry = "Sales";
      else if (/(finance|account)/.test(category)) industry = "Finance";
      else if (/(education|teacher|training)/.test(category)) industry = "Education";
      supplyByIndustry.set(industry, (supplyByIndustry.get(industry) || 0) + 1);
    });

    const highDemandIndustries = Array.from(demandByIndustry.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([industry]) => industry);

    const underservedSegments = Array.from(demandByIndustry.entries())
      .filter(([_, demand]) => demand >= 2)
      .map(([industry, demand]) => {
        const supply = supplyByIndustry.get(industry) || 0;
        return { industry, demand, supply, ratio: supply === 0 ? Infinity : demand / supply };
      })
      .filter((item) => item.supply === 0 || item.ratio >= 2)
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 5)
      .map((item) =>
        item.supply === 0
          ? `${item.industry}: demand high (${item.demand} active jobs) with no consultant supply`
          : `${item.industry}: demand/supply imbalance (${item.demand} jobs vs ${item.supply} consultants)`
      );

    const analytics: AdminAnalytics = {
      overview: {
        totalUsers,
        activeConsultants,
        totalBookings,
        totalRevenue,
        pendingApplications,
        completedBookings,
        cancelledBookings,
      },
      trends: {
        newUsersThisMonth,
        newConsultantsThisMonth,
        bookingsThisMonth,
        revenueThisMonth,
        bookingsGrowth: Math.round(bookingsGrowth * 10) / 10,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      },
      recentActivity,
      aiSnapshot: {
        topConsultants,
        revenueByRole: Object.fromEntries(
          Object.entries(revenueByRole).map(([role, revenue]) => [role, Math.round(revenue)])
        ),
        dropoffPoints,
        suspiciousSignals: suspiciousSignals.slice(0, 10),
        recentJobDescriptions,
        abnormalActivitySignals: abnormalActivitySignals.slice(0, 10),
        highDemandIndustries,
        underservedSegments,
      },
    };

    Logger.info("Admin Analytics", "", `Analytics calculated: ${totalUsers} users, ${activeConsultants} consultants, $${totalRevenue} revenue`);
    return analytics;
  } catch (error: any) {
    Logger.error("Admin Analytics", "", `Failed to get admin analytics: ${error.message}`, error);
    throw error;
  }
};
