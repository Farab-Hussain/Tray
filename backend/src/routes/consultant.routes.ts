// src/routes/consultant.routes.ts
import express from "express";
import {
  // Consultant endpoints
  getAllConsultants,
  getConsultantById,
  getTopConsultants,
  setTopConsultant,
  // Service endpoints
  addService,
  getServiceById,
  getConsultantServices,
  updateService,
  deleteService,
  getAllServicesWithConsultants,
  getDefaultServices,
  getAvailablePlatformServices,
  getServiceBookings,
} from "../controllers/consultant.controller";
import { fixServiceImageUrl } from "../controllers/fixService.controller";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware";

const router = express.Router();

//  Consultant Management Routes (Public)
router.get("/", getAllConsultants);                    // GET /consultants - Get all consultants
router.get("/top", getTopConsultants);                 // GET /consultants/top - Get top-rated consultants
router.get("/:uid", getConsultantById);                // GET /consultants/:uid - Get consultant by ID
router.post("/set-top", authenticateUser(), authorizeRole(["admin"]), setTopConsultant);  // POST /consultants/set-top - Set top consultant (admin only)

//  Service Management Routes (Protected)
router.post("/services", authenticateUser(), addService);           // POST /consultants/services - Add service
router.get("/services/default", getDefaultServices);             // GET /consultants/services/default - Get default platform services
router.get("/services/available", getAvailablePlatformServices);  // GET /consultants/services/available - Get services consultants can apply for
router.get("/services/all", getAllServicesWithConsultants);      // GET /consultants/services/all - Get ALL services from ALL consultants
router.get(
  "/services/:serviceId/bookings",
  authenticateUser(),
  getServiceBookings,
); // GET /consultants/services/:serviceId/bookings - Get active bookings for a service
router.get("/services/:serviceId", getServiceById);               // GET /consultants/services/:serviceId - Get service by ID
router.get("/:consultantId/services", getConsultantServices);    // GET /consultants/:consultantId/services - Get consultant services
router.put("/services/:serviceId", authenticateUser(), updateService);    // PUT /consultants/services/:serviceId - Update service
router.delete("/services/:serviceId", authenticateUser(), deleteService); // DELETE /consultants/services/:serviceId - Delete service

// Temporary fix route
router.post("/fix-service-image", fixServiceImageUrl); // POST /consultants/fix-service-image - Fix service image URL

export default router;
