// Upload Middleware
// File upload handling with multer

import { Request } from 'express';
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  // Accept images and videos with specific size limits
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'));
  }
};

// File size limits based on type
const getFileSizeLimit = (file: Express.Multer.File): number => {
  const ONE_GB = 1024 * 1024 * 1024; // 1GB in bytes
  const TEN_MB = 10 * 1024 * 1024;  // 10MB in bytes
  
  if (file.mimetype.startsWith('video/')) {
    return ONE_GB; // 1GB for videos (paid Cloudinary)
  } else if (file.mimetype.startsWith('image/')) {
    return TEN_MB; // 10MB for images
  }
  return TEN_MB; // Default limit
};

// Enhanced upload with dynamic file size limits
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB max (videos), 10MB max (images)
    files: 5, // Max 5 files per upload
    fields: 10, // Max 10 form fields
  },
});

// Video upload with 1GB limit
export const uploadVideo = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB for videos
    files: 1, // Single video file
  },
});

// Image upload with 10MB limit
export const uploadImage = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for images
    files: 5, // Max 5 images
  },
});

// Single file upload
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Multiple files upload
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => 
  upload.array(fieldName, maxCount);

// Mixed files upload (video + thumbnail) with proper limits
export const uploadMixed = () => multer.fields([
  { 
    name: 'video', 
    maxCount: 1,
    maxFileSize: 1024 * 1024 * 1024 // 1GB for video
  },
  { 
    name: 'thumbnail', 
    maxCount: 1,
    maxFileSize: 10 * 1024 * 1024 // 10MB for thumbnail
  },
  { 
    name: 'resources', 
    maxCount: 10,
    maxFileSize: 10 * 1024 * 1024 // 10MB for resources
  },
]);

// Enhanced mixed upload with type-specific limits
export const uploadVideoWithThumbnail = () => multer.fields([
  { 
    name: 'video', 
    maxCount: 1,
    maxFileSize: 1024 * 1024 * 1024 // 1GB for video
  },
  { 
    name: 'thumbnail', 
    maxCount: 1,
    maxFileSize: 10 * 1024 * 1024 // 10MB for thumbnail
  },
]);

export default upload;
