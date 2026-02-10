// src/controllers/upload.controller.ts
import { Request, Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('☁️ Cloudinary configured with cloud name:', process.env.CLOUDINARY_CLOUD_NAME);

// Configure multer for memory storage - VIDEO UPLOAD ENABLED
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit (images and videos)
  },
  fileFilter: (req, file, cb) => {
    // Check file type - allow both images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!') as any, false);
    }
  },
});

// Configure multer for file uploads (PDF/DOC) - for resumes
const uploadFile = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for PDF/DOC files
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF and DOC files
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC files are allowed!') as any, false);
    }
  },
});

// Middleware for single file upload with error handling (supports both image and video)
export const uploadSingle = (req: Request, res: Response, next: any) => {
  console.log('📎 [uploadSingle] Multer middleware started');
  console.log('📎 [uploadSingle] Content-Type:', req.headers['content-type']);
  console.log('📎 [uploadSingle] Content-Length:', req.headers['content-length']);
  
  // Use .any() to accept any field name (image or video)
  // This is more flexible and handles both field names
  upload.any()(req, res, (err: any) => {
    if (err) {
      console.error('❌ [uploadSingle] Multer error:', err.message);
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    
    // Get the file from either req.file or req.files
    let file = (req as any).file;
    if (!file) {
      const files = (req as any).files as Express.Multer.File[];
      if (files && files.length > 0) {
        file = files[0];
        (req as any).file = file; // Set for compatibility
      }
    }
    
    if (file) {
      console.log('✅ [uploadSingle] File received:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        isVideo: file.mimetype.startsWith('video/'),
        isImage: file.mimetype.startsWith('image/'),
      });
    } else {
      console.warn('⚠️ [uploadSingle] No file in request');
    }
    
    next();
  });
};

// Upload profile image
export const uploadProfileImage = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let cloudinaryUploadCompleted = false;
  
  try {
    const userId = (req as any).user.uid;
    const file = req.file;

    if (!file) {
      console.error('❌ [uploadProfileImage] No file uploaded');
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log('📤 [uploadProfileImage] Uploading image for user:', userId, 'File size:', file.size, 'bytes');

    // Set a longer timeout for the response (ngrok free tier has limits)
    req.setTimeout(120000); // 2 minutes
    res.setTimeout(120000);

    // Upload to Cloudinary with timeout
    const cloudinaryPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'tray/profile-images',
          public_id: `${userId}/${randomUUID()}`,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' }
          ],
          timeout: 60000, // 60 second timeout for Cloudinary
        },
        (error, result) => {
          if (error) {
            console.error('❌ [uploadProfileImage] Cloudinary upload error:', error);
            reject(error);
          } else {
            cloudinaryUploadCompleted = true;
            console.log('✅ [uploadProfileImage] Cloudinary upload completed in', Date.now() - startTime, 'ms');
            resolve(result);
          }
        }
      );
      
      uploadStream.end(file.buffer);
    });

    // Add timeout wrapper for Cloudinary upload
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        if (!cloudinaryUploadCompleted) {
          console.error('❌ [uploadProfileImage] Cloudinary upload timeout after 60 seconds');
          reject(new Error('Cloudinary upload timeout'));
        }
      }, 60000);
    });

    const result = await Promise.race([cloudinaryPromise, timeoutPromise]);

    console.log('✅ [uploadProfileImage] Image uploaded successfully to Cloudinary');

    // Update user profile with new image URL
    const { db } = await import("../config/firebase");
    await db.collection("users").doc(userId).update({
      profileImage: (result as any).secure_url,
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ [uploadProfileImage] User profile updated in database');

    const responseData = {
      message: "Image uploaded successfully",
      imageUrl: (result as any).secure_url,
      publicId: (result as any).public_id,
    };

    console.log('✅ [uploadProfileImage] Total time:', Date.now() - startTime, 'ms');
    res.status(200).json(responseData);

  } catch (error: any) {
    console.error("❌ [uploadProfileImage] Upload error:", {
      message: error.message,
      stack: error.stack,
      elapsedTime: Date.now() - startTime,
    });
    
    // Make sure to send a response even on error
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to upload image' });
    }
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
          public_id: `${userId}/${randomUUID()}`,
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

// Upload service image (does NOT update profile)
export const uploadServiceImage = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const userId = (req as any).user.uid;
    
    // Handle both single file (req.file) and multiple fields (req.files)
    let file = (req as any).file;
    if (!file) {
      const files = (req as any).files as Express.Multer.File[];
      if (files && Array.isArray(files) && files.length > 0) {
        file = files[0];
        (req as any).file = file; // Set for compatibility
      }
    }

    if (!file) {
      console.error('❌ [uploadServiceImage] No file found in request');
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    console.log(`📤 [uploadServiceImage] File received:`, {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2),
    });

    // VIDEO UPLOAD CODE - COMMENTED OUT
    // const isVideo = file.mimetype.startsWith('video/');
    const isVideo = false; // Video uploads disabled
    const fileSizeMB = file.size / (1024 * 1024);
    
    // VIDEO UPLOAD CODE - COMMENTED OUT
    // // Set longer timeout for video uploads (20 minutes for large videos)
    // const serverTimeout = isVideo 
    //   ? Math.max(1200000, Math.ceil(fileSizeMB / 10) * 60000) // At least 20 min
    //   : 120000;
    // req.setTimeout(serverTimeout);
    // res.setTimeout(serverTimeout);
    const serverTimeout = 120000; // 2 minutes for images only
    req.setTimeout(serverTimeout);
    res.setTimeout(serverTimeout);
    
    console.log(`📤 [uploadServiceImage] Uploading service image for user:`, userId);
    console.log(`📤 [uploadServiceImage] File size: ${fileSizeMB.toFixed(2)} MB`);

    const uploadOptions: any = {
      folder: 'tray/service-images',
      public_id: `${userId}/${randomUUID()}`,
    };

    // VIDEO UPLOAD CODE - COMMENTED OUT
    // if (isVideo) {
    //   uploadOptions.resource_type = 'video';
    //   // For videos, use chunk_size to enable chunked uploads for better reliability
    //   if (fileSizeMB > 20) {
    //     uploadOptions.chunk_size = 10000000; // 10MB chunks for large videos
    //   }
    //   // Don't use eager transformations for videos - they're expensive and slow
    //   // Videos will be processed on-demand when accessed
    // } else {
      uploadOptions.resource_type = 'image';
      uploadOptions.transformation = [
        { width: 800, height: 600, crop: 'fill' },
        { quality: 'auto' }
      ];
    // }

    console.log(`📤 [uploadServiceImage] Starting Cloudinary upload with options:`, {
      folder: uploadOptions.folder,
      resource_type: uploadOptions.resource_type,
    });

    // VIDEO UPLOAD CODE - COMMENTED OUT
    // // Use Promise.race to add a timeout wrapper
    // // For large videos (59MB), allow up to 20 minutes
    // // Estimate: ~1 minute per 10MB for slow connections
    // const uploadTimeout = isVideo 
    //   ? Math.max(1200000, Math.ceil(fileSizeMB / 10) * 60000) // At least 20 min, or 1 min per 10MB
    //   : 120000; // 2 minutes for images
    const uploadTimeout = 120000; // 2 minutes for images
    
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('❌ [uploadServiceImage] Cloudinary upload error:', error);
            reject(error);
          } else {
            const elapsed = Date.now() - startTime;
            console.log(`✅ [uploadServiceImage] Cloudinary upload completed in ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s)`);
            resolve(result);
          }
        }
      );
      
      // Write buffer to stream
      uploadStream.end(file.buffer);
    });

    // VIDEO UPLOAD CODE - COMMENTED OUT
    // // Add timeout protection with Promise.race
    // const timeoutPromise = new Promise((_, reject) => {
    //   setTimeout(() => {
    //     reject(new Error(`Upload timeout after ${uploadTimeout / 1000} seconds. File size: ${fileSizeMB.toFixed(2)}MB`));
    //   }, uploadTimeout);
    // });
    // const result = await Promise.race([uploadPromise, timeoutPromise]);
    const result = await uploadPromise;

    const mediaUrl = (result as any).secure_url;
    console.log(`✅ [uploadServiceImage] Service image uploaded successfully to Cloudinary`);
    console.log(`✅ [uploadServiceImage] Image URL:`, mediaUrl);
    console.log('ℹ️ [uploadServiceImage] NOT updating profile - this is a service media only');

    // DO NOT update profile - service media is separate from profile images
    res.status(200).json({
      message: `Service image uploaded successfully`,
      imageUrl: mediaUrl,
      publicId: (result as any).public_id,
      mediaType: 'image',
    });

  } catch (error: any) {
    console.error("Upload service media error:", error);
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

export const deleteConsultantImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: "Public ID is required" });
    }

    console.log('🗑️ [deleteConsultantImage] Deleting consultant image for user:', userId);

    await cloudinary.uploader.destroy(publicId);

    const { db } = await import("../config/firebase");

    await db.collection("consultantProfiles").doc(userId).set(
      {
        "personalInfo.profileImage": null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    await db.collection("consultants").doc(userId).set(
      {
        profileImage: null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    res.status(200).json({
      message: "Consultant image deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete consultant image error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Middleware for file upload (PDF/DOC)
export const uploadFileMiddleware = (req: Request, res: Response, next: any) => {
  uploadFile.single('file')(req, res, (err: any) => {
    if (err) {
      console.error('❌ [uploadFileMiddleware] Multer error:', err.message);
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    
    const file = (req as any).file;
    if (file) {
      console.log('✅ [uploadFileMiddleware] File received:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });
    } else {
      console.warn('⚠️ [uploadFileMiddleware] No file in request');
    }
    
    next();
  });
};

// Upload file (PDF/DOC) for resumes
export const uploadResumeFile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const file = req.file;
    const { fileType = 'resume' } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log('📤 [uploadResumeFile] Uploading file for user:', userId, 'File size:', file.size, 'bytes');

    // Set timeout for file uploads
    req.setTimeout(120000); // 2 minutes
    res.setTimeout(120000);

    // Upload to Cloudinary as raw file (not image)
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw', // Use 'raw' for PDF/DOC files
          folder: `tray/${fileType}-files`,
          public_id: `${userId}/${randomUUID()}`,
          timeout: 60000, // 60 second timeout for Cloudinary
        },
        (error, result) => {
          if (error) {
            console.error('❌ [uploadResumeFile] Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ [uploadResumeFile] File uploaded successfully to Cloudinary');
            resolve(result);
          }
        }
      ).end(file.buffer);
    });

    res.status(200).json({
      message: "File uploaded successfully",
      imageUrl: (result as any).secure_url, // Keep as imageUrl for compatibility
      url: (result as any).secure_url, // Also provide as url
      publicId: (result as any).public_id,
    });

  } catch (error: any) {
    console.error("Upload file error:", error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
};

// Get Cloudinary upload signature for direct client upload
export const getUploadSignature = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const { folder = 'tray/profile-images' } = req.body;

    // Generate upload signature for Cloudinary
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `${userId}/${randomUUID()}`;
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        public_id: publicId,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    res.status(200).json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
      publicId,
    });

  } catch (error: any) {
    console.error("Get upload signature error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Upload service video (NEW FUNCTION)
export const uploadServiceVideo = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let cloudinaryUploadCompleted = false;
  
  try {
    const userId = (req as any).user.uid;
    const file = req.file;

    if (!file) {
      console.error('❌ [uploadServiceVideo] No file uploaded');
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Check if it's actually a video file
    if (!file.mimetype.startsWith('video/')) {
      console.error('❌ [uploadServiceVideo] Not a video file:', file.mimetype);
      return res.status(400).json({ error: "Only video files are allowed" });
    }

    console.log('📤 [uploadServiceVideo] Uploading video for user:', userId, 'File size:', file.size, 'bytes');

    // Set a longer timeout for video uploads (20 minutes for large videos)
    req.setTimeout(1200000); // 20 minutes
    res.setTimeout(1200000);

    // Upload to Cloudinary with timeout
    const cloudinaryPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'tray/service-videos',
          public_id: `${userId}/${randomUUID()}`,
          timeout: 1200000, // 20 minute timeout for Cloudinary
        },
        (error, result) => {
          if (error) {
            console.error('❌ [uploadServiceVideo] Cloudinary upload error:', error);
            reject(error);
          } else {
            cloudinaryUploadCompleted = true;
            console.log('✅ [uploadServiceVideo] Cloudinary upload completed in', Date.now() - startTime, 'ms');
            resolve(result);
          }
        }
      );
      
      uploadStream.end(file.buffer);
    });

    // Add timeout wrapper for Cloudinary upload
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        if (!cloudinaryUploadCompleted) {
          console.error('❌ [uploadServiceVideo] Cloudinary upload timeout after 20 minutes');
          reject(new Error('Cloudinary upload timeout'));
        }
      }, 1200000);
    });

    const result = await Promise.race([cloudinaryPromise, timeoutPromise]);

    console.log('✅ [uploadServiceVideo] Video uploaded successfully to Cloudinary');

    const responseData = {
      message: "Video uploaded successfully",
      videoUrl: (result as any).secure_url,
      publicId: (result as any).public_id,
      mediaType: 'video',
    };

    console.log('✅ [uploadServiceVideo] Total time:', Date.now() - startTime, 'ms');
    res.status(200).json(responseData);

  } catch (error: any) {
    console.error('❌ [uploadServiceVideo] Upload error:', {
      message: error.message,
      code: error.code,
      status: error.status || error.response?.status,
      statusText: error.statusText || error.response?.statusText,
      data: error.data || error.response?.data,
      elapsedTime: Date.now() - startTime,
    });
    
    // Make sure to send a response even on error
    if (!res.headersSent) {
      res.status(500).json({ error: error.data?.error || error.response?.data?.error || error.message || 'Failed to upload video' });
    }
  }
};
