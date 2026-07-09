import { Request, Response } from "express";
import { db, admin } from "../config/firebase";
import { sendEmail } from "../utils/email";
import { Logger } from "../utils/logger";

const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const buildHtmlEmail = (subject: string, body: string) => {
  const formattedBody = body
    .trim()
    .split(/\n\n+/)
    .map((paragraph) => `<p style="margin: 0 0 12px 0;">${paragraph.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 24px;">
      <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 2px 10px rgba(15,23,42,0.08); padding: 28px;">
        <h2 style="margin: 0 0 4px 0; color: #0f172a; font-size: 22px;">${subject}</h2>
        <p style="margin: 0 0 18px 0; color: #6b7280; font-size: 14px;">Platform-wide announcement from FairChance</p>
        <div style="color: #111827; font-size: 16px; line-height: 1.6;">${formattedBody}</div>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="color: #6b7280; font-size: 13px; margin: 0;">
          You are receiving this email because you have an active FairChance account. If you prefer not to receive announcements, reply to this email with "UNSUBSCRIBE".
        </p>
      </div>
    </div>
  `;
};

export const sendNewsletter = async (req: Request, res: Response) => {
  const route = "POST /admin/newsletter/send";

  try {
    const { subject, body, roles } = req.body as {
      subject?: string;
      body?: string;
      roles?: string[];
    };

    if (!subject || !body) {
      return res.status(400).json({ error: "Subject and message body are required" });
    }

    const roleFilter = Array.isArray(roles) && roles.length > 0 ? roles : null;

    // Fetch all users with an email address
    const snapshot = await db.collection("users").get();
    const emails = new Set<string>();
    let totalUsers = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      totalUsers += 1;

      const email = data?.email as string | undefined;
      if (!email) return;

      const userRoles: string[] = Array.isArray(data?.roles)
        ? data.roles
        : data?.role
          ? [data.role]
          : [];

      if (roleFilter && !userRoles.some((r) => roleFilter.includes(r))) return;

      emails.add(email);
    });

    if (emails.size === 0) {
      return res.status(404).json({ error: "No recipients found", totalUsers });
    }

    const html = buildHtmlEmail(subject, body);
    const plainText = body;

    const chunks = chunkArray(Array.from(emails), 50);
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const chunk of chunks) {
      const [primary, ...bcc] = chunk;

      const result = await sendEmail({
        to: primary,
        bcc: bcc.length ? bcc : undefined,
        subject,
        html,
        text: plainText,
      });

      if (result.sent) {
        sent += chunk.length;
      } else {
        failed += chunk.length;
        if (result.error) errors.push(result.error);
      }
    }

    const success = failed === 0;

    const logPayload = {
      subject,
      body,
      rolesTargeted: roleFilter || "all",
      totalRecipients: emails.size,
      sent,
      failed,
      totalUsers,
      errors: Array.from(new Set(errors)).slice(0, 5),
      status: success ? "sent" : failed === emails.size ? "failed" : "partial",
      createdAt: admin.firestore.Timestamp.now(),
      createdBy: {
        uid: (req as any)?.user?.uid || "unknown",
        email: (req as any)?.user?.email || null,
      },
    };

    const docRef = await db.collection("newsletters").add(logPayload);

    const responsePayload = {
      id: docRef.id,
      message: success ? "Newsletter sent successfully" : "Newsletter sent with some failures",
      ...logPayload,
    };

    Logger.info("Newsletter", "admin", `Newsletter dispatch: ${sent}/${emails.size} delivered (log ${docRef.id})`);

    return res.status(success ? 200 : 207).json(responsePayload);
  } catch (error: any) {
    Logger.error(route, "", "Failed to send newsletter", error);
    return res.status(500).json({ error: "Failed to send newsletter", details: error?.message || "Unknown error" });
  }
};
