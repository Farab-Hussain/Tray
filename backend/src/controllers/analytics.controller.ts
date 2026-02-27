// src/controllers/analytics.controller.ts
import { Request, Response } from "express";
import axios from "axios";
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

/**
 * Generate admin AI insights via FastAPI (proxied through backend)
 * POST /consultant-flow/admin/ai-insights
 */
export const generateAdminAIInsightsController = async (req: Request, res: Response) => {
  const route = "POST /consultant-flow/admin/ai-insights";

  try {
    const baseUrl = process.env.FASTAPI_AI_URL;
    if (!baseUrl) {
      return res.status(500).json({
        error: "FASTAPI_AI_URL is missing in backend environment.",
      });
    }

    const normalizedBase = baseUrl.replace(/\/+$/, "");
    const sharedSecret = process.env.ADMIN_AI_SHARED_SECRET;

    const response = await axios.post(
      `${normalizedBase}/api/admin-ai/insights`,
      req.body,
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          ...(sharedSecret ? { "X-Admin-AI-Secret": sharedSecret } : {}),
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    Logger.error(route, "", "Error generating admin AI insights", error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 502;
      const detail =
        (error.response?.data as any)?.detail ||
        (error.response?.data as any)?.error ||
        error.message ||
        "Failed to generate admin AI insights";
      return res.status(status).json({ error: detail });
    }

    return res.status(500).json({ error: "Failed to generate admin AI insights" });
  }
};
