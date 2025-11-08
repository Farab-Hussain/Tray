// src/controllers/consultant.controller.ts
import { Request, Response } from "express";
import { db } from "../config/firebase";
import { consultantServices } from "../services/consultant.service";
import { ConsultantCard } from "../models/consultant.model";

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
    
    // Get manually designated top consultant first
    const topConsultant = consultants.find((c: any) => c.isTopConsultant === true);
    
    // Get other consultants sorted by rating
    const otherConsultants = consultants
      .filter((c: any) => !c.isTopConsultant)
      .sort((a: any, b: any) => {
        const aRating = a.rating || 0;
        const bRating = b.rating || 0;
        return bRating - aRating;
      });
    
    // Combine: top consultant first, then others sorted by rating
    const topConsultants = topConsultant ? [topConsultant] : [];
    const cardData: ConsultantCard[] = [...topConsultants, ...otherConsultants].map((consultant: any) => ({
      uid: consultant.uid,
      name: consultant.name,
      category: consultant.category,
      rating: consultant.rating,
      totalReviews: consultant.totalReviews,
      profileImage: consultant.profileImage
    }));
    
    res.status(200).json({ topConsultants: cardData });
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
      }
    });
  } catch (error: any) {
    console.error(`❌ Error fetching service by ID: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Update a specific service
export const updateService = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { title, description, duration, price, availability, imageUrl } = req.body;

    const updateData: any = {
      title,
      description,
      duration,
      price,
      updatedAt: new Date().toISOString(),
    };

    // Include availability if provided
    if (availability !== undefined) {
      updateData.availability = availability;
    }
    
    // Include imageUrl if provided
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    }

    await db.collection("services").doc(serviceId).update(updateData);

    res.status(200).json({ message: "Service updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a service
export const deleteService = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    await db.collection("services").doc(serviceId).delete();
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error: any) {
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
        
        const consultantProfileImage =
          typeof consultant?.profileImage === "string" ? consultant.profileImage.trim() : "";

        if ((!imageUrl || imageUrl.trim() === "") && consultantProfileImage) {
          imageUrl = consultantProfileImage;
        }

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
    
    res.status(200).json({ services });
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
