import express from "express";
import { 
  createPaymentIntent, 
  createConnectAccount, 
  getConnectAccountStatus,
  transferToConsultant,
  getPlatformFeeConfig,
  updatePlatformFeeConfig,
  getStripeConfig,
} from "../controllers/payment.controller";
import { triggerPayouts, getPayoutHistory } from "../controllers/payout.controller";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware";
import { validatePlatformFeeUpdate } from "../middleware/validation";

const router = express.Router();

router.post("/create-payment-intent", createPaymentIntent);
router.get("/config", getStripeConfig);
router.post("/connect/create-account", authenticateUser, createConnectAccount);
router.get("/connect/account-status", authenticateUser, getConnectAccountStatus);
router.post("/transfer", authenticateUser, transferToConsultant);
router.get("/platform-fee", getPlatformFeeConfig);
router.put("/platform-fee", authenticateUser, authorizeRole(["admin"]), validatePlatformFeeUpdate, updatePlatformFeeConfig);

// Payout routes
router.post("/payouts/process", authenticateUser, triggerPayouts);
router.get("/payouts/history", authenticateUser, getPayoutHistory);

export default router;
