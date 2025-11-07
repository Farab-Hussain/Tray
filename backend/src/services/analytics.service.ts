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
    const allProfiles = profilesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Get all bookings
    const bookingsSnapshot = await db.collection("bookings").get();
    const allBookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Get all applications
    const applicationsSnapshot = await db.collection("consultantApplications").get();
    const allApplications = applicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
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
    const toDate = (timestamp: any): Date => {
      if (!timestamp) return new Date(0);
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
      if (timestamp._seconds) {
        return new Date(timestamp._seconds * 1000);
      }
      if (typeof timestamp === 'string') {
        return new Date(timestamp);
      }
      if (timestamp instanceof Date) {
        return timestamp;
      }
      return new Date(0);
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
    };

    Logger.info("Admin Analytics", "", `Analytics calculated: ${totalUsers} users, ${activeConsultants} consultants, $${totalRevenue} revenue`);
    return analytics;
  } catch (error: any) {
    Logger.error("Admin Analytics", "", `Failed to get admin analytics: ${error.message}`, error);
    throw error;
  }
};

