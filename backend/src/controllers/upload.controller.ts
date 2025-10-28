// src/controllers/upload.controller.ts
import { Request, Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { v4 as uuidv4 } from "uuid";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('☁️ Cloudinary configured with cloud name:', process.env.CLOUDINARY_CLOUD_NAME);

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!') as any, false);
    }
  },
});

// Middleware for single file upload
export const uploadSingle = upload.single('image');

// Upload profile image
export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log('📤 [uploadProfileImage] Uploading image for user:', userId);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'tray/profile-images',
          public_id: `${userId}/${uuidv4()}`,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(file.buffer);
    });

    console.log('✅ [uploadProfileImage] Image uploaded successfully to Cloudinary');

    // Update user profile with new image URL
    const { db } = await import("../config/firebase");
    await db.collection("users").doc(userId).update({
      profileImage: (result as any).secure_url,
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: (result as any).secure_url,
      publicId: (result as any).public_id,
    });

  } catch (error: any) {
    console.error("Upload profile image error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Upload consultant profile image
export const uploadConsultantImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log('📤 [uploadConsultantImage] Uploading consultant image for user:', userId);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'tray/consultant-images',
          public_id: `${userId}/${uuidv4()}`,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(file.buffer);
    });

    console.log('✅ [uploadConsultantImage] Image uploaded successfully to Cloudinary');

    // Update consultant profile with new image URL (in consultantProfiles collection)
    const { db } = await import("../config/firebase");
    const profileDoc = await db.collection("consultantProfiles").doc(userId).get();
    
    if (profileDoc.exists) {
      // Update existing consultant profile
      await db.collection("consultantProfiles").doc(userId).update({
        "personalInfo.profileImage": (result as any).secure_url,
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ [uploadConsultantImage] Updated consultantProfiles collection');
    } else {
      console.log('ℹ️ [uploadConsultantImage] No profile found yet - image will be saved when profile is created');
    }

    // Also update consultants collection if it exists (for already approved consultants)
    const consultantDoc = await db.collection("consultants").doc(userId).get();
    if (consultantDoc.exists) {
      await db.collection("consultants").doc(userId).update({
        profileImage: (result as any).secure_url,
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ [uploadConsultantImage] Updated consultants collection');
    }

    res.status(200).json({
      message: "Consultant image uploaded successfully",
      imageUrl: (result as any).secure_url,
      publicId: (result as any).public_id,
    });

  } catch (error: any) {
    console.error("Upload consultant image error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete profile image
export const deleteProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: "Public ID is required" });
    }

    console.log('🗑️ [deleteProfileImage] Deleting image for user:', userId);

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    console.log('✅ [deleteProfileImage] Image deleted successfully from Cloudinary');

    // Update user profile to remove image URL
    const { db } = await import("../config/firebase");
    await db.collection("users").doc(userId).update({
      profileImage: null,
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json({
      message: "Image deleted successfully",
    });

  } catch (error: any) {
    console.error("Delete profile image error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get Cloudinary upload signature for direct client upload
export const getUploadSignature = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const { folder = 'tray/profile-images' } = req.body;

    // Generate upload signature for Cloudinary
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: folder,
        public_id: `${userId}/${uuidv4()}`,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    res.status(200).json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
    });

  } catch (error: any) {
    console.error("Get upload signature error:", error);
    res.status(500).json({ error: error.message });
  }
};
