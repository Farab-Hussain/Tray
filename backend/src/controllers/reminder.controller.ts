// src/controllers/reminder.controller.ts
import { Request, Response } from "express";
import { sendAppointmentReminders } from "../services/reminder.service";
import { Logger } from "../utils/logger";

/**
 * Manual trigger for appointment reminders (for testing or manual execution)
 * POST /reminders/send
 */
export const triggerReminders = async (req: Request, res: Response) => {
  const route = "POST /reminders/send";
  
  try {
    Logger.info(route, "", "Manual reminder trigger requested");
    const result = await sendAppointmentReminders();
    
    res.json({
      success: true,
      message: `Reminders sent successfully`,
      remindersSent: result.remindersSent,
    });
  } catch (error: any) {
    Logger.error(route, "", "Error triggering reminders", error);
    res.status(500).json({ error: 'Failed to send reminders' });
  }
};

