import { Request, Response } from "express";
import { sendEmail } from "../utils/email";
import { Logger } from "../utils/logger";

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "umi342606@gmail.com";

export const sendSupportMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body || {};

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({ error: "Subject is required" });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!email || typeof email !== "string" || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: "A valid email address is required" });
    }

    const requesterName =
      typeof name === "string" && name.trim().length > 0 ? name.trim() : "Unknown";

    const sanitizedSubject = subject.trim();
    const sanitizedMessage = message.trim();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background-color: #f9fafb;">
        <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);">
          <h2 style="margin-top: 0; margin-bottom: 16px; color: #111827;">New Support Request</h2>
          <p style="margin: 0 0 12px 0; color: #374151; white-space: pre-line;">${sanitizedMessage}</p>
          <div style="margin-top: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 8px; color: #111827;">
            <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${requesterName}</p>
            <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `[Tray Support] ${sanitizedSubject}`,
      html: htmlContent,
      text: `${sanitizedMessage}\n\n—\nName: ${requesterName}\nEmail: ${email}`,
    });

    res.status(200).json({ message: "Support request sent successfully" });
  } catch (error: any) {
    Logger.error(
      "Support",
      "",
      "Failed to send support request email",
      error instanceof Error ? error : undefined,
    );
    res.status(500).json({
      error: "Failed to send support request. Please try again later.",
    });
  }
};

