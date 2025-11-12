import { Application } from "express";
import { sendSupportMessage } from "../controllers/support.controller";
import { authenticateUser } from "../middleware/authMiddleware";
import { validateSupportRequest } from "../middleware/validation";

/**
 * Register support routes on the provided Express application.
 * Legacy endpoint support: accept both /submit and /contact to avoid breaking older clients.
 */
export const registerSupportRoutes = (app: Application) => {
  console.log("📮 Support routes loaded");

  app.post("/support/contact", authenticateUser, validateSupportRequest, sendSupportMessage);
  app.post("/support/submit", authenticateUser, validateSupportRequest, sendSupportMessage);
};

export default registerSupportRoutes;

