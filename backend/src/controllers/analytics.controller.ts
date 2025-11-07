// src/controllers/analytics.controller.ts
import { Request, Response } from "express";
import { getConsultantAnalytics, getAdminAnalytics } from "../services/analytics.service";
import { Logger } from "../utils/logger";

/**
 * Get analytics for authenticated consultant
 * GET /analytics/consultant?period=week|month|year
 */
export const getConsultantAnalyticsController = async (req: Request, res: Response) => {
  const route = "GET /analytics/consultant";
  
  try {
    const consultantId = (req as any).user.uid;
    const period = (req.query.period as 'week' | 'month' | 'year') || 'month';
    
    const analytics = await getConsultantAnalytics(consultantId, period);
    
    res.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    Logger.error(route, "", "Error getting analytics", error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
};

/**
 * Get admin analytics for the entire platform
 * GET /consultant-flow/admin/analytics
 */
export const getAdminAnalyticsController = async (req: Request, res: Response) => {
  const route = "GET /consultant-flow/admin/analytics";
  
  try {
    const analytics = await getAdminAnalytics();
    
    res.json({
      success: true,
      ...analytics,
    });
  } catch (error: any) {
    Logger.error(route, "", "Error getting admin analytics", error);
    res.status(500).json({ error: 'Failed to get admin analytics' });
  }
};

