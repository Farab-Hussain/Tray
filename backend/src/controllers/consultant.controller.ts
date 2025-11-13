// src/controllers/consultant.controller.ts
import { Request, Response } from "express";
import { db } from "../config/firebase";
import { consultantServices } from "../services/consultant.service";
import { ConsultantCard } from "../models/consultant.model";
import {
  ACTIVE_BOOKING_STATUSES,
  CancelBookingResult,
  cancelBookingInternally,
} from "./booking.controller";

// Consultant Management 
export const getAllConsultants = async (req: Request, res: Response) => {
  try {
    const consultants = await consultantServices.getAll();
    
    // Return only card data (optimized for frontend cards)
    const cardData: ConsultantCard[] = consultants.map((consultant: any) => ({
      uid: consultant.uid,
      name: consultant.name,
      category: consultant.category,
      rating: consultant.rating,
      totalReviews: consultant.totalReviews,
      profileImage: consultant.profileImage
    }));
    
    res.status(200).json({ consultants: cardData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getConsultantById = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const consultant = await consultantServices.getById(uid);
    res.status(200).json({ consultant });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const getTopConsultants = async (req: Request, res: Response) => {
  try {
    const consultants = await consultantServices.getAll();
    
    // Get manually designated top consultant - only one can be top consultant
    const topConsultant = consultants.find((c: any) => c.isTopConsultant === true);
    
    // Only return the one top consultant if it exists
    const topConsultants: ConsultantCard[] = topConsultant ? [{
      uid: topConsultant.uid,
      name: topConsultant.name,
      category: topConsultant.category,
      rating: topConsultant.rating,
      totalReviews: topConsultant.totalReviews,
      profileImage: topConsultant.profileImage
    }] : [];
    
    res.status(200).json({ topConsultants });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Set a consultant as top consultant (admin only)
export const setTopConsultant = async (req: Request, res: Response) => {
  try {
    const { consultantId } = req.body;
    
    if (!consultantId) {
      return res.status(400).json({ error: "Missing consultantId" });
    }
    
    // First, clear all existing top consultants
    const consultantsSnapshot = await db.collection("consultants").get();
    const batch = db.batch();
    consultantsSnapshot.docs.forEach(doc => {
      if (doc.data().isTopConsultant) {
        batch.update(doc.ref, { isTopConsultant: false });
      }
    });
    await batch.commit();
    
    // Set the new top consultant
    await db.collection("consultants").doc(consultantId).update({
      isTopConsultant: true,
      updatedAt: new Date()
    });
    
    console.log(`✅ Set top consultant: ${consultantId}`);
    res.status(200).json({ message: "Top consultant set successfully" });
  } catch (error: any) {
    console.error("Error setting top consultant:", error);
    res.status(500).json({ error: error.message });
  }
};

// Service Management 
export const addService = async (req: Request, res: Response) => {
  try {
    const { consultantId, title, description, duration, price } = req.body;
    if (!consultantId || !title || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newServiceRef = db.collection("services").doc();
    await newServiceRef.set({
      id: newServiceRef.id,
      consultantId,
      title,
      description,
      duration,
      price,
      createdAt: new Date().toISOString(),
      approvalStatus: "approved",
      pendingUpdate: null,
    });

    res.status(201).json({ message: "Service added successfully" });
  } catch (error: any) {
    console.error("Add service error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all services for a consultant
export const getConsultantServices = async (req: Request, res: Response) => {
  try {
    const { consultantId } = req.params;
    
    console.log(`🔍 Fetching services for consultantId: ${consultantId}`);
    
    const snapshot = await db
      .collection("services")
      .where("consultantId", "==", consultantId)
      .get();

    console.log(`📊 Found ${snapshot.docs.length} services for consultant: ${consultantId}`);
    
    // Debug: Log all services in the collection
    const allServicesSnapshot = await db.collection("services").get();
    console.log(`📦 Total services in database: ${allServicesSnapshot.docs.length}`);
    
    // Log the first few services to see their structure
    allServicesSnapshot.docs.slice(0, 5).forEach(doc => {
      const data = doc.data();
      console.log(`  - Service: ${data.title} | consultantId: ${data.consultantId || 'MISSING'}`);
    });

    // Return complete service data for consultant's catalog
    const services = snapshot.docs.map((doc) => {
      const service = doc.data();
      return {
        id: service.id,
        title: service.title,
        description: service.description,
        duration: service.duration || 60,
        price: service.price || 100,
        consultantId: service.consultantId,
        icon: service.icon || 'briefcase',
        tags: service.tags || [],
        rating: service.rating ?? 0,
        isVerified: service.isVerified !== false,
        proposalsCount: service.proposalsCount || '0 reviews',
        isDefault: false,
        basedOnDefaultService: service.basedOnDefaultService,
        fromApplication: service.fromApplication,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
        imageUrl: service.imageUrl || '',
          imagePublicId: service.imagePublicId || '',
        approvalStatus: service.approvalStatus || 'approved',
        pendingUpdate: service.pendingUpdate || null,
      };
    });
    
    res.status(200).json({ services });
  } catch (error: any) {
    console.error(`❌ Error fetching services: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get a specific service by ID
export const getServiceById = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    
    console.log(`🔍 Fetching service by ID: ${serviceId}`);
    
    const serviceDoc = await db.collection("services").doc(serviceId).get();
    
    if (!serviceDoc.exists) {
      return res.status(404).json({ error: "Service not found" });
    }
    
    const service = serviceDoc.data();
    
    res.status(200).json({
      service: {
        id: service?.id,
        title: service?.title,
        description: service?.description,
        duration: service?.duration || 60,
        price: service?.price || 100,
        consultantId: service?.consultantId,
        icon: service?.icon || 'briefcase',
        tags: service?.tags || [],
        rating: service?.rating ?? 0,
        isVerified: service?.isVerified !== false,
        proposalsCount: service?.proposalsCount || '0 reviews',
        isDefault: false,
        basedOnDefaultService: service?.basedOnDefaultService,
        fromApplication: service?.fromApplication,
        createdAt: service?.createdAt,
        updatedAt: service?.updatedAt,
        imageUrl: service?.imageUrl || '',
        imagePublicId: service?.imagePublicId || '',
      approvalStatus: service?.approvalStatus || 'approved',
      pendingUpdate: service?.pendingUpdate || null,
      }
    });
  } catch (error: any) {
    console.error(`❌ Error fetching service by ID: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Update a specific service
const formatTime = (minutes: number): string => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hrs >= 12 ? "PM" : "AM";
  const displayHours = hrs % 12 || 12;
  return `${displayHours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")} ${period}`;
};

const parseTime = (timeStr: string): number => {
  const [timePart, periodPart] = timeStr.trim().split(" ");
  if (!timePart || !periodPart) return 0;
  const [hoursStr, minutesStr] = timePart.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  let totalMinutes = hours % 12 * 60 + minutes;
  if (periodPart.toUpperCase() === "PM" && hours !== 12) {
    totalMinutes += 12 * 60;
  }
  if (periodPart.toUpperCase() === "AM" && hours === 12) {
    totalMinutes -= 12 * 60;
  }
  return totalMinutes;
};

const adjustAvailabilitySlotDurations = (
  availabilitySlots: any[],
  duration: number,
) => {
  if (!Array.isArray(availabilitySlots) || !duration || duration <= 0) {
    return availabilitySlots;
  }

  return availabilitySlots.map(slot => {
    if (!slot?.timeSlots || !Array.isArray(slot.timeSlots)) {
      return slot;
    }

    const adjustedSlots = slot.timeSlots.map((slotLabel: string) => {
      const [startLabel] = slotLabel.split("-");
      const startMinutes = parseTime(startLabel || "");
      const endMinutes = startMinutes + duration;
      return `${formatTime(startMinutes)} - ${formatTime(endMinutes)}`;
    });

    return {
      ...slot,
      timeSlots: adjustedSlots,
    };
  });
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const {
      title,
      description,
      duration,
      price,
      availability,
      imageUrl,
      cancelBookings,
      adjustAvailability,
    } = req.body;

    const user = (req as any).user;
    const serviceRef = db.collection("services").doc(serviceId);
    const serviceDoc = await serviceRef.get();

    if (!serviceDoc.exists) {
      return res.status(404).json({ error: "Service not found" });
    }

    const serviceData = serviceDoc.data() || {};
    const consultantId = serviceData.consultantId;

    const isAdmin = user?.role === "admin";
    if (!isAdmin && user?.uid !== consultantId) {
      return res.status(403).json({ error: "Unauthorized to update this service" });
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (duration !== undefined) updateData.duration = duration;
    if (availability !== undefined) updateData.availability = availability;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (req.body?.imagePublicId !== undefined) {
      updateData.imagePublicId = req.body.imagePublicId;
    }

    const durationChanged =
      duration !== undefined && duration !== serviceData.duration;

    let cancelledBookings: CancelBookingResult[] = [];

    if (cancelBookings) {
      const bookingsSnapshot = await db
        .collection("bookings")
        .where("serviceId", "==", serviceId)
        .where("status", "in", ACTIVE_BOOKING_STATUSES)
        .get();

      const cancelPromises = bookingsSnapshot.docs.map(async doc => {
        try {
          return await cancelBookingInternally(doc.id, {
            reason:
              "Service updated by consultant. Session cancelled and payment refunded.",
            initiatedBy: user?.uid,
          });
        } catch (error: any) {
          console.error(
            `❌ Failed to cancel booking ${doc.id} for service ${serviceId}:`,
            error,
          );
          return null;
        }
      });

      const cancelResults = await Promise.all(cancelPromises);
      cancelledBookings = cancelResults.filter(
        (result): result is CancelBookingResult => result !== null,
      );
    }

    let availabilityUpdateSummary: { updated: boolean; count: number } = {
      updated: false,
      count: 0,
    };

    if (durationChanged && adjustAvailability && consultantId) {
      const profileRef = db.collection("consultantProfiles").doc(consultantId);
      const profileDoc = await profileRef.get();

      if (profileDoc.exists) {
        const profileData = profileDoc.data() || {};
        const availabilitySlots =
          profileData?.professionalInfo?.availabilitySlots || [];

        const adjustedSlots = adjustAvailabilitySlotDurations(
          availabilitySlots,
          duration,
        );

        await profileRef.update({
          "professionalInfo.availabilitySlots": adjustedSlots,
          updatedAt: new Date().toISOString(),
        });

        availabilityUpdateSummary = {
          updated: true,
          count: adjustedSlots.length,
        };
      }
    }

    await serviceRef.update(updateData);

    // Keep related application in sync if applicable
    if (serviceData.fromApplication) {
      const applicationRef = db
        .collection("consultantApplications")
        .doc(serviceData.fromApplication);
      const applicationDoc = await applicationRef.get();
      if (applicationDoc.exists) {
        const applicationData = applicationDoc.data() || {};
        if (applicationData.type === "new" && applicationData.customService) {
          const updatedCustomService: any = { ...applicationData.customService };
          if (title !== undefined) updatedCustomService.title = title;
          if (description !== undefined)
            updatedCustomService.description = description;
          if (duration !== undefined) updatedCustomService.duration = duration;
          if (price !== undefined) updatedCustomService.price = price;
          if (imageUrl !== undefined) updatedCustomService.imageUrl = imageUrl;

          await applicationRef.update({
            customService: updatedCustomService,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    res.status(200).json({
      message: "Service updated successfully",
      serviceId,
      cancelledBookings,
      availabilityUpdated: availabilityUpdateSummary,
    });
  } catch (error: any) {
    console.error("❌ Error updating service:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a service
export const deleteService = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const cancelBookings =
      req.query.cancelBookings === "true" || req.body?.cancelBookings === true;
    const user = (req as any).user;

    const serviceRef = db.collection("services").doc(serviceId);
    const serviceDoc = await serviceRef.get();

    if (!serviceDoc.exists) {
      return res.status(404).json({ error: "Service not found" });
    }

    const serviceData = serviceDoc.data() || {};
    const consultantId = serviceData.consultantId;
    const isAdmin = user?.role === "admin";

    if (!isAdmin && user?.uid !== consultantId) {
      return res.status(403).json({ error: "Unauthorized to delete this service" });
    }

    let cancelledBookings: CancelBookingResult[] = [];
    if (cancelBookings) {
      const bookingsSnapshot = await db
        .collection("bookings")
        .where("serviceId", "==", serviceId)
        .where("status", "in", ACTIVE_BOOKING_STATUSES)
        .get();

      const cancelResults = await Promise.all(
        bookingsSnapshot.docs.map(doc =>
          cancelBookingInternally(doc.id, {
            reason: "Service deleted by consultant. Booking cancelled and refunded.",
            initiatedBy: user?.uid,
          }).catch(error => {
            console.error(
              `❌ Failed to cancel booking ${doc.id} during service deletion:`,
              error,
            );
            return null;
          }),
        ),
      );

      cancelledBookings = cancelResults.filter(
        (result): result is CancelBookingResult => result !== null,
      );
    }

    await serviceRef.delete();

    if (serviceData.fromApplication) {
      const applicationRef = db
        .collection("consultantApplications")
        .doc(serviceData.fromApplication);
      const applicationDoc = await applicationRef.get();
      if (applicationDoc.exists) {
        await applicationRef.update({
          status: "withdrawn",
          reviewNotes: "Consultant withdrew the service after approval.",
          updatedAt: new Date().toISOString(),
          withdrawnAt: new Date().toISOString(),
        });
      }
    }

    res.status(200).json({
      message: "Service deleted successfully",
      serviceId,
      cancelledBookings,
    });
  } catch (error: any) {
    console.error("❌ Error deleting service:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getServiceBookings = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const user = (req as any).user;

    const serviceDoc = await db.collection("services").doc(serviceId).get();
    if (!serviceDoc.exists) {
      return res.status(404).json({ error: "Service not found" });
    }

    const service = serviceDoc.data() || {};
    const consultantId = service.consultantId;
    const isAdmin = user?.role === "admin";
    if (!isAdmin && user?.uid !== consultantId) {
      return res.status(403).json({ error: "Unauthorized to view bookings for this service" });
    }

    const snapshot = await db
      .collection("bookings")
      .where("serviceId", "==", serviceId)
      .where("status", "in", ACTIVE_BOOKING_STATUSES)
      .get();

    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      serviceId,
      count: bookings.length,
      bookings,
    });
  } catch (error: any) {
    console.error("❌ Error fetching service bookings:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all services from all consultants (for browsing/searching)
export const getAllServicesWithConsultants = async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("services").get();
    const defaultServiceImageCache = new Map<string, string | null>();
    
    const services = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const serviceData = doc.data();

        if (serviceData.approvalStatus && serviceData.approvalStatus !== "approved") {
          return null;
        }
        let imageUrl = typeof serviceData.imageUrl === "string" ? serviceData.imageUrl : "";

        if (
          (!imageUrl || imageUrl.trim() === "") &&
          typeof serviceData.basedOnDefaultService === "string" &&
          serviceData.basedOnDefaultService.trim() !== ""
        ) {
          const templateId = serviceData.basedOnDefaultService.trim();
          if (defaultServiceImageCache.has(templateId)) {
            const cachedValue = defaultServiceImageCache.get(templateId);
            imageUrl = cachedValue ?? imageUrl;
          } else {
            const templateDoc = await db.collection("services").doc(templateId).get();
            if (templateDoc.exists) {
              const templateData = templateDoc.data();
              const fallbackImage =
                (typeof templateData?.imageUrl === "string" && templateData.imageUrl.trim() !== ""
                  ? templateData.imageUrl.trim()
                  : undefined) ||
                (typeof templateData?.image === "string" && templateData.image.trim() !== ""
                  ? templateData.image.trim()
                  : undefined) ||
                "";
              imageUrl = fallbackImage || imageUrl;
              defaultServiceImageCache.set(templateId, fallbackImage || null);
            } else {
              defaultServiceImageCache.set(templateId, null);
            }
          }
        }

        // Fetch consultant info
        const consultantDoc = await db.collection("consultants")
          .doc(serviceData.consultantId).get();
        const consultant = consultantDoc.data();
        
        // Do NOT use consultant profile image as fallback for service image
        // Services should have their own images, not use consultant's profile image

        return {
          id: serviceData.id,
          title: serviceData.title,
          description: serviceData.description,
          duration: serviceData.duration,
          price: serviceData.price,
          imageUrl: imageUrl || '',
          isDefault: serviceData.isDefault || false,
          basedOnDefaultService: serviceData.basedOnDefaultService || null,
          consultant: {
            uid: consultant?.uid,
            name: consultant?.name,
            category: consultant?.category,
            rating: consultant?.rating,
            totalReviews: consultant?.totalReviews,
            profileImage: consultant?.profileImage
          },
          createdAt: serviceData.createdAt
        };
      })
    );
    
    const filteredServices = services.filter((service): service is NonNullable<typeof service> => service !== null);
    
    res.status(200).json({ services: filteredServices });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get default services (platform services created by admin)
export const getDefaultServices = async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("services")
      .where("isDefault", "==", true)
      .get();
    
    const services = snapshot.docs.map((doc) => {
      const service = doc.data();
      return {
        id: service.id,
        title: service.title,
        description: service.description,
        duration: service.duration,
        price: service.price,
        category: service.category,
        icon: service.icon || 'briefcase',
        tags: service.tags || [],
        rating: service.rating ?? 0,
        isVerified: service.isVerified !== false,
        proposalsCount: service.proposalsCount || '0 reviews',
        isDefault: true,
        isPlatformService: service.isPlatformService || true,
        consultant: service.consultant || {
          uid: 'admin',
          name: 'Tray Platform',
          category: 'Platform Services',
          rating: 5,
          totalReviews: 0
        },
        createdAt: service.createdAt
      };
    });
    
    res.status(200).json({ services });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get available platform services for consultants to apply for
export const getAvailablePlatformServices = async (req: Request, res: Response) => {
  try {
    // Get all default/platform services
    const snapshot = await db.collection("services")
      .where("isDefault", "==", true)
      .get();
    
    const services = snapshot.docs.map((doc) => {
      const service = doc.data();
      return {
        id: service.id || doc.id,
        title: service.title,
        description: service.description,
        duration: service.duration || 60,
        price: service.price || 100,
        category: service.category,
        icon: service.icon || 'briefcase',
        tags: service.tags || [],
        rating: service.rating ?? 0,
        isVerified: service.isVerified !== false,
        isDefault: true,
        isPlatformService: true,
        imageUrl: service.imageUrl || '',
        createdAt: service.createdAt
      };
    });
    
    console.log(`✅ [getAvailablePlatformServices] Returning ${services.length} platform services`);
    res.status(200).json({ services });
  } catch (error: any) {
    console.error('❌ [getAvailablePlatformServices] Error:', error);
    res.status(500).json({ error: error.message });
  }
};
