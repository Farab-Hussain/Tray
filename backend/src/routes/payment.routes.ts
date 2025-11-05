import express from "express";
import { 
  createPaymentIntent, 
  createConnectAccount, 
  getConnectAccountStatus,
  transferToConsultant 
} from "../controllers/payment.controller";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/create-payment-intent", createPaymentIntent);
router.post("/connect/create-account", authenticateUser, createConnectAccount);
router.get("/connect/account-status", authenticateUser, getConnectAccountStatus);
router.post("/transfer", authenticateUser, transferToConsultant);

export default router;
