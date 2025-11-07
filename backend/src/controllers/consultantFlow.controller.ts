import { Request, Response } from "express";
import { consultantFlowService } from "../services/consultantFlow.service";
import {
  emailConsultantProfileCreated,
  emailConsultantProfileApproved,
  emailConsultantProfileRejected,
  emailApplicationSubmitted,
  emailApplicationApproved,
  emailApplicationRejected,
  emailAdminNewProfile,
  emailAdminNewApplication
} from "../utils/email";
import { Logger } from "../utils/logger";
import { db } from "../config/firebase";


const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@tray.com";


export const getMyConsultantStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if consultant profile exists
    const profileDoc = await db.collection("consultantProfiles").doc(user.uid).get();

    if (!profileDoc.exists) {
      return res.status(200).json({
        hasProfile: false,
        status: "no_profile",
        message: "Complete your consultant profile to get started",
        nextStep: "create_profile"
      });
    }

    const profile = profileDoc.data();

    // Return status based on profile state
    switch (profile?.status) {
      case "pending":
        return res.status(200).json({
          hasProfile: true,
          status: "pending",
          message: "Your profile is under review. We'll notify you once it's approved.",
          submittedAt: profile.createdAt,
          nextStep: "wait_approval",
          profile: {
            uid: profile.uid,
            fullName: profile.personalInfo?.fullName,
            email: profile.personalInfo?.email,
            category: profile.professionalInfo?.category,
            status: profile.status
          }
        });

      case "approved":
        // Get user's applications
        const applications = await consultantFlowService.getApplicationsByConsultant(user.uid);

        return res.status(200).json({
          hasProfile: true,
          status: "approved",
          message: "Your profile is approved! You can now apply for services.",
          approvedAt: profile.updatedAt,
          nextStep: "access_dashboard",
          profile: {
            uid: profile.uid,
            fullName: profile.personalInfo?.fullName,
            email: profile.personalInfo?.email,
            category: profile.professionalInfo?.category,
            status: profile.status
          },
          applications: {
            total: applications.length,
            pending: applications.filter(a => a.status === "pending").length,
            approved: applications.filter(a => a.status === "approved").length,
            rejected: applications.filter(a => a.status === "rejected").length
          }
        });

      case "rejected":
        return res.status(200).json({
          hasProfile: true,
          status: "rejected",
          message: "Your profile was not approved. Please review and update your information.",
          rejectedAt: profile.updatedAt,
          nextStep: "update_profile",
          profile: {
            uid: profile.uid,
            fullName: profile.personalInfo?.fullName,
            email: profile.personalInfo?.email,
            category: profile.professionalInfo?.category,
            status: profile.status
          }
        });

      default:
        return res.status(200).json({
          hasProfile: true,
          status: "unknown",
          message: "Unknown profile status. Please contact support.",
          nextStep: "contact_support"
        });
    }
  } catch (error: any) {
    Logger.error("Get Status", "", "Failed to get consultant status", error);
    res.status(500).json({ error: error.message });
  }
};


export const createConsultantProfile = async (req: Request, res: Response) => {
  const route = "POST /consultant-flow/profiles";
  try {
    const { uid, personalInfo, professionalInfo } = req.body;

    console.log(`[${route}] Starting profile creation for uid: ${uid || 'missing'}`);
    console.log(`[${route}] personalInfo exists: ${!!personalInfo}, type: ${typeof personalInfo}`);
    console.log(`[${route}] professionalInfo exists: ${!!professionalInfo}, type: ${typeof professionalInfo}`);
    
    Logger.info(route, uid || "", "Creating consultant profile");
    const requestBodyForLog = {
      uid,
      personalInfo: {
        ...personalInfo,
        profileImage: personalInfo?.profileImage ? 'present' : 'missing'
      },
      professionalInfo
    };
    Logger.info(route, uid || "", `Request body: ${JSON.stringify(requestBodyForLog, null, 2)}`);

    // Validation
    if (!uid || !personalInfo || !professionalInfo) {
      console.log(`[${route}] VALIDATION FAILED: Missing required fields`);
      console.log(`[${route}] uid: ${!!uid}, personalInfo: ${!!personalInfo}, professionalInfo: ${!!professionalInfo}`);
      Logger.error(route, uid || "", `Missing required fields - uid: ${!!uid}, personalInfo: ${!!personalInfo}, professionalInfo: ${!!professionalInfo}`);
      return res.status(400).json({ 
        error: "Missing required fields: uid, personalInfo, professionalInfo",
        details: {
          hasUid: !!uid,
          hasPersonalInfo: !!personalInfo,
          hasProfessionalInfo: !!professionalInfo
        }
      });
    }

    // Check if objects are empty
    if (typeof personalInfo !== 'object' || personalInfo === null || Array.isArray(personalInfo) || Object.keys(personalInfo).length === 0) {
      console.log(`[${route}] VALIDATION FAILED: personalInfo is invalid`);
      console.log(`[${route}] personalInfo type: ${typeof personalInfo}, isArray: ${Array.isArray(personalInfo)}, keys: ${Object.keys(personalInfo || {}).length}`);
      Logger.error(route, uid, "personalInfo is empty or not an object");
      return res.status(400).json({ 
        error: "personalInfo must be a non-empty object",
        details: { personalInfo }
      });
    }

    if (typeof professionalInfo !== 'object' || professionalInfo === null || Array.isArray(professionalInfo) || Object.keys(professionalInfo).length === 0) {
      console.log(`[${route}] VALIDATION FAILED: professionalInfo is invalid`);
      console.log(`[${route}] professionalInfo type: ${typeof professionalInfo}, isArray: ${Array.isArray(professionalInfo)}, keys: ${Object.keys(professionalInfo || {}).length}`);
      Logger.error(route, uid, "professionalInfo is empty or not an object");
      return res.status(400).json({ 
        error: "professionalInfo must be a non-empty object",
        details: { professionalInfo }
      });
    }

    const fullName = typeof personalInfo.fullName === 'string' ? personalInfo.fullName.trim() : personalInfo.fullName;
    const bio = typeof personalInfo.bio === 'string' ? personalInfo.bio.trim() : personalInfo.bio;
    
    console.log(`[${route}] Validating personalInfo - fullName: "${fullName}", bio: "${bio}", experience: ${personalInfo.experience}`);
    
    if (!fullName || !bio || personalInfo.experience === undefined || personalInfo.experience === null) {
      console.log(`[${route}] VALIDATION FAILED: Missing personalInfo fields`);
      Logger.error(route, uid, `Missing personalInfo fields - fullName: "${fullName}", bio: "${bio}", experience: ${personalInfo.experience} (type: ${typeof personalInfo.experience})`);
      return res.status(400).json({ 
        error: "Missing required personalInfo fields",
        details: {
          hasFullName: !!fullName,
          hasBio: !!bio,
          experience: personalInfo.experience,
          experienceType: typeof personalInfo.experience
        }
      });
    }

    console.log(`[${route}] Validating professionalInfo - category: "${professionalInfo.category}"`);
    console.log(`[${route}] professionalInfo object:`, JSON.stringify(professionalInfo, null, 2));
    
    // Only category is required - hourlyRate, title, specialties are all optional
    const categoryValue = typeof professionalInfo.category === 'string' 
      ? professionalInfo.category.trim() 
      : professionalInfo.category;
    
    if (!categoryValue || categoryValue === '') {
      console.log(`[${route}] VALIDATION FAILED: Missing professionalInfo.category`);
      Logger.error(route, uid, `Missing professionalInfo.category - category: "${professionalInfo.category}" (type: ${typeof professionalInfo.category})`);
      return res.status(400).json({ 
        error: "Missing required professionalInfo field: category",
        message: "The 'category' field is required in professionalInfo. Note: hourlyRate, title, and specialties are optional.",
        details: {
          category: professionalInfo.category,
          categoryType: typeof professionalInfo.category,
          receivedFields: Object.keys(professionalInfo || {})
        }
      });
    }
    
    // Ensure hourlyRate is optional (not required)
    // No validation needed for optional fields like hourlyRate, title, specialties

    console.log(`[${route}] ✅ All validations passed, creating profile...`);
    Logger.success(route, uid, "Validation passed, creating profile");
    const profile = await consultantFlowService.createProfile(req.body);


    const consultantEmail = personalInfo.email || req.body.email;

    if (consultantEmail) {
      emailConsultantProfileCreated(personalInfo.fullName, consultantEmail).catch((error) => {
        Logger.error("Email", uid, "Failed to send profile creation email", error);
      });

      emailAdminNewProfile(ADMIN_EMAIL, personalInfo.fullName, uid).catch((error) => {
        Logger.error("Email", uid, "Failed to send admin notification email", error);
      });
    }

    res.status(201).json({
      message: "Consultant profile created successfully",
      profile
    });
  } catch (error: any) {
    Logger.error(route, req.body?.uid || "", `Error creating profile: ${error.message}`);
    Logger.error(route, req.body?.uid || "", `Error stack: ${error.stack}`);
    console.error("Create profile error:", error);

    // If it's a validation error from Firestore, return 400
    if (error.code === 'invalid-argument' || error.message?.includes('Invalid')) {
      return res.status(400).json({ error: error.message || "Invalid profile data" });
    }

    res.status(500).json({ error: error.message || "An error occurred while creating the profile" });
  }
};

export const getConsultantProfile = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const profile = await consultantFlowService.getProfileByUid(uid);
    res.status(200).json({ profile });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const getAllConsultantProfiles = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let profiles;
    if (status && typeof status === "string") {
      profiles = await consultantFlowService.getProfilesByStatus(status as any);
    } else {
      profiles = await consultantFlowService.getAllProfiles();
    }

    res.status(200).json({ profiles });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateConsultantProfile = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const profile = await consultantFlowService.updateProfile(uid, req.body);
    res.status(200).json({
      message: "Profile updated successfully",
      profile
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const approveConsultantProfile = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const profile = await consultantFlowService.updateProfileStatus(uid, "approved");

    const consultantEmail = profile.personalInfo?.email;
    const consultantName = profile.personalInfo?.fullName;

    if (consultantEmail && consultantName) {
      emailConsultantProfileApproved(consultantName, consultantEmail).catch((error) => {
        Logger.error("Email", uid, "Failed to send profile approval email", error);
      });
    }

    res.status(200).json({
      message: "Profile approved successfully",
      profile
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectConsultantProfile = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { reason } = req.body;

    const profile = await consultantFlowService.updateProfileStatus(uid, "rejected");


    const consultantEmail = profile.personalInfo?.email;
    const consultantName = profile.personalInfo?.fullName;

    if (consultantEmail && consultantName) {
      emailConsultantProfileRejected(consultantName, consultantEmail, reason).catch((error) => {
        Logger.error("Email", uid, "Failed to send profile rejection email", error);
      });
    }

    res.status(200).json({
      message: "Profile rejected",
      profile
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


export const createConsultantApplication = async (req: Request, res: Response) => {
  try {
    const { consultantId, type, serviceId, customService } = req.body;


    if (!consultantId || !type) {
      return res.status(400).json({ error: "Missing required fields: consultantId, type" });
    }

    if (type === "existing" && !serviceId) {
      return res.status(400).json({ error: "serviceId is required for existing service type" });
    }

    if (type === "new" && !customService) {
      return res.status(400).json({ error: "customService is required for new service type" });
    }

    if (type === "new" && customService) {
      if (!customService.title || !customService.description || !customService.duration || !customService.price) {
        return res.status(400).json({ error: "Missing required customService fields" });
      }
    }

    const application = await consultantFlowService.createApplication(req.body);


    try {
      const consultantProfile = await consultantFlowService.getProfileByUid(consultantId);
      const consultantEmail = consultantProfile.personalInfo?.email;
      const consultantName = consultantProfile.personalInfo?.fullName;
      const serviceTitle = type === "new" ? customService?.title : "Service Application";

      if (consultantEmail && consultantName && serviceTitle) {
        emailApplicationSubmitted(consultantName, consultantEmail, serviceTitle).catch((error) => {
          Logger.error("Email", consultantId, "Failed to send application submission email", error);
        });

        emailAdminNewApplication(ADMIN_EMAIL, consultantName, serviceTitle, application.id).catch((error) => {
          Logger.error("Email", consultantId, "Failed to send admin notification email", error);
        });
      }
    } catch (profileError) {
      Logger.error("Email", consultantId, "Could not fetch consultant profile for email notification", profileError);
    }

    res.status(201).json({
      message: "Application submitted successfully",
      application
    });
  } catch (error: any) {
    console.error("Create application error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getConsultantApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const application = await consultantFlowService.getApplicationById(id);
    res.status(200).json({ application });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

// Get MY applications (for authenticated consultant)
export const getMyConsultantApplications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Directly get applications for the authenticated user
    const applications = await consultantFlowService.getApplicationsByConsultant(user.uid);
    res.status(200).json({ applications });
  } catch (error: any) {
    console.error('Error getting my applications:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllConsultantApplications = async (req: Request, res: Response) => {
  try {
    const { status, consultantId } = req.query;

    let applications;
    if (consultantId && typeof consultantId === "string") {
      applications = await consultantFlowService.getApplicationsByConsultant(consultantId);
    } else if (status && typeof status === "string") {
      applications = await consultantFlowService.getApplicationsByStatus(status as any);
    } else {
      applications = await consultantFlowService.getAllApplications();
    }

    res.status(200).json({ applications });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const approveConsultantApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;

    const application = await consultantFlowService.updateApplicationStatus(id, "approved", reviewNotes);

    // 🔥 Automatically create service after approval
    let createdServiceId = null;

    if (application.type === "new" && application.customService) {
      // Create new service from custom service data
      const newServiceRef = db.collection("services").doc();
      const serviceData: any = {
        id: newServiceRef.id,
        consultantId: application.consultantId,
        title: application.customService.title,
        description: application.customService.description || "",
        duration: application.customService.duration,
        price: application.customService.price,
        isDefault: false,
        fromApplication: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Include image fields if they exist
      if (application.customService.imageUrl) {
        serviceData.imageUrl = application.customService.imageUrl;
      }
      if (application.customService.imagePublicId) {
        serviceData.imagePublicId = application.customService.imagePublicId;
      }

      await newServiceRef.set(serviceData);

      createdServiceId = newServiceRef.id;
      Logger.success("Service Creation", application.consultantId,
        `New service created from approved application: ${newServiceRef.id} - ${application.customService.title}`);
    }
    else if (application.type === "existing" && application.serviceId) {
      // Get default service details
      const defaultServiceDoc = await db.collection("services").doc(application.serviceId).get();

      if (defaultServiceDoc.exists) {
        const serviceData = defaultServiceDoc.data();

        // Create copy for this consultant
        const newServiceRef = db.collection("services").doc();
        await newServiceRef.set({
          id: newServiceRef.id,
          consultantId: application.consultantId,
          title: serviceData?.title || "Service",
          description: serviceData?.description || "",
          duration: serviceData?.duration || 60,
          price: serviceData?.price || 100,
          isDefault: false,
          basedOnDefaultService: application.serviceId,
          fromApplication: id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        createdServiceId = newServiceRef.id;
        Logger.success("Service Creation", application.consultantId,
          `Service created from default template: ${newServiceRef.id} - ${serviceData?.title}`);
      } else {
        Logger.error("Service Creation", application.consultantId,
          `Default service not found: ${application.serviceId}`);
      }
    }

    try {
      const consultantProfile = await consultantFlowService.getProfileByUid(application.consultantId);
      const consultantEmail = consultantProfile.personalInfo?.email;
      const consultantName = consultantProfile.personalInfo?.fullName;
      const serviceTitle = application.type === "new"
        ? application.customService?.title || "Service"
        : "Service Application";

      if (consultantEmail && consultantName) {
        emailApplicationApproved(consultantName, consultantEmail, serviceTitle, reviewNotes).catch((error) => {
          Logger.error("Email", application.consultantId, "Failed to send application approval email", error);
        });
      }
    } catch (profileError) {
      Logger.error("Email", application.consultantId, "Could not fetch consultant profile for email notification", profileError);
    }

    res.status(200).json({
      message: "Application approved and service created successfully",
      application,
      serviceId: createdServiceId
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectConsultantApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;

    const application = await consultantFlowService.updateApplicationStatus(id, "rejected", reviewNotes);


    try {
      const consultantProfile = await consultantFlowService.getProfileByUid(application.consultantId);
      const consultantEmail = consultantProfile.personalInfo?.email;
      const consultantName = consultantProfile.personalInfo?.fullName;
      const serviceTitle = application.type === "new"
        ? application.customService?.title || "Service"
        : "Service Application";

      if (consultantEmail && consultantName) {
        emailApplicationRejected(consultantName, consultantEmail, serviceTitle, reviewNotes).catch((error) => {
          Logger.error("Email", application.consultantId, "Failed to send application rejection email", error);
        });
      }
    } catch (profileError) {
      Logger.error("Email", application.consultantId, "Could not fetch consultant profile for email notification", profileError);
    }

    res.status(200).json({
      message: "Application rejected",
      application
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteConsultantApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await consultantFlowService.deleteApplication(id);
    res.status(200).json({ message: "Application deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};




export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      allProfiles,
      pendingProfiles,
      approvedProfiles,
      rejectedProfiles,
      allApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
    ] = await Promise.all([
      consultantFlowService.getAllProfiles(),
      consultantFlowService.getProfilesByStatus("pending"),
      consultantFlowService.getProfilesByStatus("approved"),
      consultantFlowService.getProfilesByStatus("rejected"),
      consultantFlowService.getAllApplications(),
      consultantFlowService.getApplicationsByStatus("pending"),
      consultantFlowService.getApplicationsByStatus("approved"),
      consultantFlowService.getApplicationsByStatus("rejected"),
    ]);

    res.status(200).json({
      profiles: {
        total: allProfiles.length,
        pending: pendingProfiles.length,
        approved: approvedProfiles.length,
        rejected: rejectedProfiles.length,
      },
      applications: {
        total: allApplications.length,
        pending: pendingApplications.length,
        approved: approvedApplications.length,
        rejected: rejectedApplications.length,
      },
      summary: {
        totalPendingReviews: pendingProfiles.length + pendingApplications.length,
        totalApproved: approvedProfiles.length + approvedApplications.length,
        totalRejected: rejectedProfiles.length + rejectedApplications.length,
      },
    });
  } catch (error: any) {
    Logger.error("Dashboard Stats", "", "Failed to fetch dashboard statistics", error);
    res.status(500).json({ error: error.message });
  }
};

// ========== Consultant Availability ==========

/**
 * Get consultant availability for students to book
 * This endpoint is public (no authentication required) so students can check availability
 */
export const getConsultantAvailability = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({ error: "Consultant UID is required" });
    }

    // Get consultant profile
    const profileDoc = await db.collection("consultantProfiles").doc(uid).get();

    if (!profileDoc.exists) {
      return res.status(404).json({ error: "Consultant profile not found" });
    }

    const profile = profileDoc.data();

    // Check if consultant is approved
    if (profile?.status !== "approved") {
      return res.status(404).json({ error: "Consultant is not available for booking" });
    }

    // Extract availability from professionalInfo
    const availability = profile?.professionalInfo?.availability;
    const availabilitySlots = profile?.professionalInfo?.availabilitySlots;

    console.log('🔍 Profile professionalInfo:', profile?.professionalInfo);
    console.log('🔍 Availability (legacy):', availability);
    console.log('🔍 AvailabilitySlots (new):', availabilitySlots);

    if (!availability && !availabilitySlots) {
      console.log('⚠️ No availability data found, returning unavailable');
      return res.status(200).json({
        available: false,
        message: "Consultant has not set their availability yet",
        availability: null,
        availabilitySlots: null
      });
    }

    // Return availability data (prioritize new format if available)
    res.status(200).json({
      available: true,
      consultantId: uid,
      consultantName: profile?.personalInfo?.fullName || "Consultant",
      availability: availability, // Legacy format
      availabilitySlots: availabilitySlots, // New format
      message: "Availability retrieved successfully"
    });

  } catch (error: any) {
    Logger.error("Get Consultant Availability", "", "Failed to fetch consultant availability", error);
    res.status(500).json({ error: error.message });
  }
};

// ========== Set Availability Slots ==========

/**
 * Set consultant availability slots for specific dates
 * This endpoint allows consultants to set specific dates with multiple time slots
 */
export const setAvailabilitySlots = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const user = (req as any).user;
    const { availabilitySlots } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "Consultant UID is required" });
    }

    // Check if user is updating their own profile
    if (user.uid !== uid) {
      return res.status(403).json({ error: "You can only update your own availability" });
    }

    if (!availabilitySlots || !Array.isArray(availabilitySlots)) {
      return res.status(400).json({ error: "availabilitySlots must be an array" });
    }

    // Validate availability slots format
    for (const slot of availabilitySlots) {
      if (!slot.date || !slot.timeSlots || !Array.isArray(slot.timeSlots)) {
        return res.status(400).json({
          error: "Each availability slot must have date (string) and timeSlots (array)"
        });
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(slot.date)) {
        return res.status(400).json({
          error: "Date must be in YYYY-MM-DD format"
        });
      }
    }

    // Get consultant profile
    const profileDoc = await db.collection("consultantProfiles").doc(uid).get();

    if (!profileDoc.exists) {
      return res.status(404).json({ error: "Consultant profile not found" });
    }

    const profile = profileDoc.data();

    // Check if consultant is approved
    if (profile?.status !== "approved") {
      return res.status(403).json({ error: "Only approved consultants can set availability" });
    }

    // Update availability slots
    await db.collection("consultantProfiles").doc(uid).update({
      "professionalInfo.availabilitySlots": availabilitySlots,
      updatedAt: new Date().toISOString(),
    });

    Logger.info("Set Availability Slots", uid, `Updated ${availabilitySlots.length} availability slots`);

    res.status(200).json({
      message: "Availability slots updated successfully",
      availabilitySlots: availabilitySlots,
      count: availabilitySlots.length
    });

  } catch (error: any) {
    Logger.error("Set Availability Slots", "", "Failed to update availability slots", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteAvailabilitySlot = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const user = (req as any).user;

    // For DELETE requests, body data needs to be passed differently
    // We'll get date and timeSlot from query params instead
    const date = req.query.date as string;
    const timeSlot = req.query.timeSlot as string;

    if (!uid) {
      return res.status(400).json({ error: "Consultant UID is required" });
    }

    // Check if user is updating their own profile
    if (user.uid !== uid) {
      return res.status(403).json({ error: "You can only delete your own availability slots" });
    }

    if (!date || !timeSlot) {
      return res.status(400).json({ error: "Both date and timeSlot are required" });
    }

    // Get consultant profile
    const profileDoc = await db.collection("consultantProfiles").doc(uid).get();

    if (!profileDoc.exists) {
      return res.status(404).json({ error: "Consultant profile not found" });
    }

    const profile = profileDoc.data();

    // Check if consultant is approved
    if (profile?.status !== "approved") {
      return res.status(403).json({ error: "Only approved consultants can manage availability" });
    }

    // Get current availability slots
    const availabilitySlots = profile.professionalInfo?.availabilitySlots || [];

    console.log('🔍 Before deletion - Availability slots:', JSON.stringify(availabilitySlots, null, 2));
    console.log('🎯 Trying to delete - Date:', date, 'TimeSlot:', timeSlot);

    // Filter out the slot to delete
    const updatedSlots = availabilitySlots
      .map((slot: any) => {
        if (slot.date === date) {
          console.log(`📅 Found matching date: ${date}`);
          console.log(`📋 Current time slots:`, slot.timeSlots);
          console.log(`🎯 Looking for time slot: ${timeSlot}`);

          // Remove the specific time slot from this date
          const updatedTimeSlots = slot.timeSlots.filter((ts: string) => {
            const matches = ts !== timeSlot;
            console.log(`  Comparing "${ts}" !== "${timeSlot}": ${matches}`);
            return matches;
          });

          console.log(`✅ Remaining time slots:`, updatedTimeSlots);

          // If no time slots remain for this date, remove the entire date entry
          if (updatedTimeSlots.length === 0) {
            console.log('🗑️ No slots remaining for this date, removing entire date entry');
            return null;
          }

          return {
            date: slot.date,
            timeSlots: updatedTimeSlots
          };
        }
        return slot;
      })
      .filter((slot: any) => slot !== null); // Remove null entries

    console.log('✅ After deletion - Updated slots:', JSON.stringify(updatedSlots, null, 2));

    // Update availability slots
    await db.collection("consultantProfiles").doc(uid).update({
      "professionalInfo.availabilitySlots": updatedSlots,
      updatedAt: new Date().toISOString(),
    });

    Logger.info("Delete Availability Slot", uid, `Deleted slot ${timeSlot} from date ${date}`);

    res.status(200).json({
      message: "Availability slot deleted successfully",
      availabilitySlots: updatedSlots,
      count: updatedSlots.length
    });

  } catch (error: any) {
    Logger.error("Delete Availability Slot", "", "Failed to delete availability slot", error);
    res.status(500).json({ error: error.message });
  }
};