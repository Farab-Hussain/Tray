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

const router = express.Router();

router.post("/", authenticateUser, createBooking);
router.get("/student", authenticateUser, getStudentBookings);
router.get("/consultant", authenticateUser, getConsultantBookings);
router.get("/consultant/:consultantId/booked-slots", getConsultantBookedSlots); // Public endpoint for students to check availability
router.get("/my-consultants", authenticateUser, getMyConsultants);
router.get("/debug", authenticateUser, testBookingDebug);
router.put("/:bookingId/status", authenticateUser, updateBookingStatus);
router.post("/:bookingId/cancel", authenticateUser, cancelBooking);
router.get("/has-access/:consultantId", authenticateUser, checkAccess);

export default router;
