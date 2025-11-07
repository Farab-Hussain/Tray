// src/controllers/payout.controller.ts
import { Request, Response } from "express";
import { processAutomatedPayouts, getConsultantPayouts } from "../services/payout.service";
import { Logger } from "../utils/logger";

/**
 * Manual trigger for automated payouts (for testing or manual execution)
 * POST /payouts/process
 */
export const triggerPayouts = async (req: Request, res: Response) => {
  const route = "POST /payouts/process";
  
  try {
    Logger.info(route, "", "Manual payout trigger requested");
    const result = await processAutomatedPayouts();
    
    res.json({
      success: true,
      message: `Payouts processed successfully`,
      payoutsProcessed: result.payoutsProcessed,
      totalPayoutAmount: result.totalPayoutAmount,
    });
  } catch (error: any) {
    Logger.error(route, "", "Error triggering payouts", error);
    res.status(500).json({ error: 'Failed to process payouts' });
  }
};

/**
 * Get payout history for authenticated consultant
 * GET /payouts/history
 */
export const getPayoutHistory = async (req: Request, res: Response) => {
  const route = "GET /payouts/history";
  
  try {
    const consultantId = (req as any).user.uid;
    const payouts = await getConsultantPayouts(consultantId);
    
    res.json({
      success: true,
      payouts,
    });
  } catch (error: any) {
    Logger.error(route, "", "Error getting payout history", error);
    res.status(500).json({ error: 'Failed to get payout history' });
  }
};

