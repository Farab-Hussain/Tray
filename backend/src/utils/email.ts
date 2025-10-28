
import nodemailer from "nodemailer";
import { Logger } from "./logger";


const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "no-reply@tray.com";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || "Tray <no-reply@tray.com>";

// Check if email credentials are configured
const isEmailConfigured = SMTP_USER && SMTP_PASSWORD;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: isEmailConfigured ? {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  } : undefined,
});

// Only verify connection if email is configured
if (isEmailConfigured) {
  transporter.verify((error, success) => {
    if (error) {
      Logger.error("Email", "", "Email configuration error", error);
    } else {
      Logger.info("Email", "", "Email server ready to send messages");
    }
  });
} else {
  Logger.warn("Email", "", "Email credentials not configured - email functionality disabled");
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}


export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // Skip if email is not configured
  if (!isEmailConfigured) {
    Logger.warn("Email", "", `Email not sent (credentials not configured) - To: ${options.to}, Subject: ${options.subject}`);
    return;
  }

  try {
    const mailOptions = {
      from: SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    };

    await transporter.sendMail(mailOptions);
    Logger.info("Email", "", `Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    Logger.error("Email", "", `Failed to send email to ${options.to}`, error);
    throw new Error("Failed to send email");
  }
};


export const emailConsultantProfileCreated = (consultantName: string, consultantEmail: string) => {
  return sendEmail({
    to: consultantEmail,
    subject: "Consultant Profile Submitted Successfully",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Profile Submitted Successfully! 🎉</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Hi <strong>${consultantName}</strong>,
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Thank you for submitting your consultant profile to Tray! Your application is currently under review by our team.
          </p>
          
          <div style="background-color: #f0f7ff; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0;">
            <p style="margin: 0; color: #0066cc; font-weight: bold;">What happens next?</p>
            <ul style="color: #555; margin: 10px 0 0 0; padding-left: 20px;">
              <li>Our team will review your profile and credentials</li>
              <li>You'll receive an email notification once your profile is reviewed</li>
              <li>Review typically takes 1-3 business days</li>
            </ul>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            You can track your application status in your consultant dashboard.
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            If you have any questions, feel free to contact our support team.
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Best regards,<br/>
            <strong>The Tray Team</strong>
          </p>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} Tray. All rights reserved.
        </p>
      </div>
    `,
  });
};

export const emailConsultantProfileApproved = (consultantName: string, consultantEmail: string) => {
  return sendEmail({
    to: consultantEmail,
    subject: "Congratulations! Your Consultant Profile is Approved",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #22c55e; margin-top: 0;">Profile Approved! 🎉</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Hi <strong>${consultantName}</strong>,
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Great news! Your consultant profile has been approved and you are now part of the Tray consultant network.
          </p>
          
          <div style="background-color: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0;">
            <p style="margin: 0; color: #22c55e; font-weight: bold;">Next Steps:</p>
            <ul style="color: #555; margin: 10px 0 0 0; padding-left: 20px;">
              <li>Your profile is now visible to clients on the platform</li>
              <li>You can start applying for services or create custom service offerings</li>
              <li>Update your availability in the consultant dashboard</li>
              <li>Set up your booking preferences and rates</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://tray.com/consultant/dashboard" style="background-color: #0066cc; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Welcome to the team! We're excited to have you on board.
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Best regards,<br/>
            <strong>The Tray Team</strong>
          </p>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} Tray. All rights reserved.
        </p>
      </div>
    `,
  });
};

export const emailConsultantProfileRejected = (consultantName: string, consultantEmail: string, reason?: string) => {
  return sendEmail({
    to: consultantEmail,
    subject: "Update on Your Consultant Profile Application",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #ef4444; margin-top: 0;">Profile Application Update</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Hi <strong>${consultantName}</strong>,
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Thank you for your interest in becoming a consultant on Tray. After careful review, we're unable to approve your profile at this time.
          </p>
          
          ${reason ? `
          <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <p style="margin: 0; color: #ef4444; font-weight: bold;">Review Notes:</p>
            <p style="color: #555; margin: 10px 0 0 0;">${reason}</p>
          </div>
          ` : ''}
          
          <div style="background-color: #f0f7ff; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0;">
            <p style="margin: 0; color: #0066cc; font-weight: bold;">What you can do:</p>
            <ul style="color: #555; margin: 10px 0 0 0; padding-left: 20px;">
              <li>Review and update your profile information</li>
              <li>Add additional credentials or certifications</li>
              <li>Contact our support team for specific feedback</li>
              <li>Resubmit your application when ready</li>
            </ul>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            We encourage you to update your profile and reapply. If you have questions about this decision, please reach out to our support team.
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Best regards,<br/>
            <strong>The Tray Team</strong>
          </p>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} Tray. All rights reserved.
        </p>
      </div>
    `,
  });
};

export const emailApplicationSubmitted = (
  consultantName: string, 
  consultantEmail: string, 
  serviceTitle: string
) => {
  return sendEmail({
    to: consultantEmail,
    subject: "Service Application Submitted Successfully",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Application Submitted! 📝</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Hi <strong>${consultantName}</strong>,
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Your application for <strong>${serviceTitle}</strong> has been submitted successfully and is now under review.
          </p>
          
          <div style="background-color: #f0f7ff; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0;">
            <p style="margin: 0; color: #0066cc; font-weight: bold;">Application Status:</p>
            <p style="color: #555; margin: 10px 0 0 0;">
              Pending Review - Our team will review your application and get back to you within 1-3 business days.
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            You can track your application status in your consultant dashboard.
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Best regards,<br/>
            <strong>The Tray Team</strong>
          </p>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} Tray. All rights reserved.
        </p>
      </div>
    `,
  });
};

export const emailApplicationApproved = (
  consultantName: string, 
  consultantEmail: string, 
  serviceTitle: string,
  reviewNotes?: string
) => {
  return sendEmail({
    to: consultantEmail,
    subject: `Application Approved: ${serviceTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #22c55e; margin-top: 0;">Application Approved! 🎉</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Hi <strong>${consultantName}</strong>,
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Great news! Your application for <strong>${serviceTitle}</strong> has been approved.
          </p>
          
          ${reviewNotes ? `
          <div style="background-color: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0;">
            <p style="margin: 0; color: #22c55e; font-weight: bold;">Review Notes:</p>
            <p style="color: #555; margin: 10px 0 0 0;">${reviewNotes}</p>
          </div>
          ` : ''}
          
          <div style="background-color: #f0f7ff; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0;">
            <p style="margin: 0; color: #0066cc; font-weight: bold;">Next Steps:</p>
            <ul style="color: #555; margin: 10px 0 0 0; padding-left: 20px;">
              <li>Your service is now active and available to clients</li>
              <li>Set up your availability for bookings</li>
              <li>Ensure your profile and rates are up to date</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://tray.com/consultant/dashboard" style="background-color: #0066cc; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Dashboard
            </a>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Best regards,<br/>
            <strong>The Tray Team</strong>
          </p>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} Tray. All rights reserved.
        </p>
      </div>
    `,
  });
};


export const emailApplicationRejected = (
  consultantName: string, 
  consultantEmail: string, 
  serviceTitle: string,
  reviewNotes?: string
) => {
  return sendEmail({
    to: consultantEmail,
    subject: `Application Update: ${serviceTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #ef4444; margin-top: 0;">Application Update</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Hi <strong>${consultantName}</strong>,
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Thank you for your application for <strong>${serviceTitle}</strong>. After careful review, we're unable to approve this application at this time.
          </p>
          
          ${reviewNotes ? `
          <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <p style="margin: 0; color: #ef4444; font-weight: bold;">Review Notes:</p>
            <p style="color: #555; margin: 10px 0 0 0;">${reviewNotes}</p>
          </div>
          ` : ''}
          
          <div style="background-color: #f0f7ff; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0;">
            <p style="margin: 0; color: #0066cc; font-weight: bold;">What you can do:</p>
            <ul style="color: #555; margin: 10px 0 0 0; padding-left: 20px;">
              <li>Review the feedback provided above</li>
              <li>Update your application based on the feedback</li>
              <li>Resubmit your application when ready</li>
              <li>Contact support if you have questions</li>
            </ul>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            We encourage you to address the feedback and reapply. If you have any questions, please contact our support team.
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Best regards,<br/>
            <strong>The Tray Team</strong>
          </p>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} Tray. All rights reserved.
        </p>
      </div>
    `,
  });
};


export const emailAdminNewProfile = (adminEmail: string, consultantName: string, consultantUid: string) => {
  return sendEmail({
    to: adminEmail,
    subject: "New Consultant Profile Pending Review",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">New Consultant Profile Submitted</h2>
          
          <p style="color: #555; line-height: 1.6;">
            A new consultant profile has been submitted and requires your review.
          </p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #555;">
              <strong>Consultant Name:</strong> ${consultantName}
            </p>
            <p style="margin: 5px 0; color: #555;">
              <strong>Consultant UID:</strong> ${consultantUid}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://tray.com/admin/consultant-profiles?status=pending" style="background-color: #0066cc; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Review Profile
            </a>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Please review this profile and approve or reject it in the admin dashboard.
          </p>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} Tray Admin Notification
        </p>
      </div>
    `,
  });
};


export const emailAdminNewApplication = (
  adminEmail: string, 
  consultantName: string, 
  serviceTitle: string,
  applicationId: string
) => {
  return sendEmail({
    to: adminEmail,
    subject: "New Service Application Pending Review",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">New Service Application Submitted</h2>
          
          <p style="color: #555; line-height: 1.6;">
            A new service application has been submitted and requires your review.
          </p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #555;">
              <strong>Consultant Name:</strong> ${consultantName}
            </p>
            <p style="margin: 5px 0; color: #555;">
              <strong>Service Title:</strong> ${serviceTitle}
            </p>
            <p style="margin: 5px 0; color: #555;">
              <strong>Application ID:</strong> ${applicationId}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://tray.com/admin/applications?status=pending" style="background-color: #0066cc; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Review Application
            </a>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Please review this application and approve or reject it in the admin dashboard.
          </p>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} Tray Admin Notification
        </p>
      </div>
    `,
  });
};

// Booking and Payment Email Templates
export const emailBookingConfirmation = (
  studentName: string,
  studentEmail: string,
  consultantName: string,
  serviceTitle: string,
  bookingDate: string,
  bookingTime: string,
  amount: number
) => {
  return sendEmail({
    to: studentEmail,
    subject: "Booking Confirmed - Payment Successful",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #22c55e; margin-top: 0;">Booking Confirmed! 🎉</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Hi <strong>${studentName}</strong>,
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Your booking has been confirmed and payment processed successfully. Here are your booking details:
          </p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #22c55e; margin-top: 0;">Booking Details</h3>
            <div style="display: grid; gap: 10px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #555;"><strong>Consultant:</strong></span>
                <span style="color: #333;">${consultantName}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #555;"><strong>Service:</strong></span>
                <span style="color: #333;">${serviceTitle}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #555;"><strong>Date:</strong></span>
                <span style="color: #333;">${bookingDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #555;"><strong>Time:</strong></span>
                <span style="color: #333;">${bookingTime}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 10px;">
                <span style="color: #555;"><strong>Amount Paid:</strong></span>
                <span style="color: #22c55e; font-weight: bold;">$${amount}</span>
              </div>
            </div>
          </div>
          
          <div style="background-color: #f0f7ff; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0;">
            <p style="margin: 0; color: #0066cc; font-weight: bold;">What's Next?</p>
            <ul style="color: #555; margin: 10px 0 0 0; padding-left: 20px;">
              <li>You'll receive a reminder before your session</li>
              <li>Access your session through the Tray app</li>
              <li>You can chat with your consultant before the session</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://tray.com/my-bookings" style="background-color: #0066cc; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View My Bookings
            </a>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Thank you for choosing Tray! We look forward to your session.
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Best regards,<br/>
            <strong>The Tray Team</strong>
          </p>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} Tray. All rights reserved.
        </p>
      </div>
    `,
  });
};

export const emailConsultantNewBooking = (
  consultantName: string,
  consultantEmail: string,
  studentName: string,
  serviceTitle: string,
  bookingDate: string,
  bookingTime: string,
  amount: number
) => {
  return sendEmail({
    to: consultantEmail,
    subject: "New Booking Received",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #0066cc; margin-top: 0;">New Booking Received! 📅</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Hi <strong>${consultantName}</strong>,
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            You have received a new booking! Here are the details:
          </p>
          
          <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0066cc; margin-top: 0;">Booking Details</h3>
            <div style="display: grid; gap: 10px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #555;"><strong>Student:</strong></span>
                <span style="color: #333;">${studentName}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #555;"><strong>Service:</strong></span>
                <span style="color: #333;">${serviceTitle}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #555;"><strong>Date:</strong></span>
                <span style="color: #333;">${bookingDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #555;"><strong>Time:</strong></span>
                <span style="color: #333;">${bookingTime}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 10px;">
                <span style="color: #555;"><strong>Your Earnings:</strong></span>
                <span style="color: #22c55e; font-weight: bold;">$${amount}</span>
              </div>
            </div>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="margin: 0; color: #f59e0b; font-weight: bold;">Action Required:</p>
            <ul style="color: #555; margin: 10px 0 0 0; padding-left: 20px;">
              <li>Confirm your availability for this session</li>
              <li>Prepare for the consultation</li>
              <li>Ensure your calendar is updated</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://tray.com/consultant/my-bookings" style="background-color: #0066cc; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Booking Details
            </a>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Best regards,<br/>
            <strong>The Tray Team</strong>
          </p>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} Tray. All rights reserved.
        </p>
      </div>
    `,
  });
};

