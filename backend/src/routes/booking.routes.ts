// src/routes/bookingRoutes.ts
import express from "express";
import {
  createBooking,
  getStudentBookings,
  getConsultantBookings,
  getConsultantBookedSlots,
  updateBookingStatus,
  checkAccess,
  getMyConsultants,
  testBookingDebug,
  cancelBooking,
} from "../controllers/booking.controller";
import { authenticateUser } from "../middleware/authMiddleware";
import { validateCreateBooking, validateUpdateBookingStatus, validateConsultantIdParam } from "../middleware/validation";

const router = express.Router();

router.post("/", authenticateUser(), validateCreateBooking, createBooking);
router.get("/student", authenticateUser(), getStudentBookings);
router.get("/consultant", authenticateUser(), getConsultantBookings);
router.get("/consultant/:consultantId/booked-slots", validateConsultantIdParam, getConsultantBookedSlots); // Public endpoint for students to check availability
router.get("/my-consultants", authenticateUser(), getMyConsultants);
router.get("/debug", authenticateUser(), testBookingDebug);
router.put("/:bookingId/status", authenticateUser(), validateUpdateBookingStatus, updateBookingStatus);
router.post("/:bookingId/cancel", authenticateUser(), cancelBooking);
router.get("/has-access/:consultantId", authenticateUser(), validateConsultantIdParam, checkAccess);

export default router;
