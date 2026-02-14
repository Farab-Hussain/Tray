import { Request, Response } from "express";
import { db } from "../config/firebase";

export const fixServiceImageUrl = async (req: Request, res: Response) => {
  try {
    console.log('🔧 Fixing service image URL...');
    
    // Get the service with wrong URL
    const serviceDoc = await db.collection('services').doc('sxuiZggc8N66P8h9Yj8t').get();
    
    if (!serviceDoc.exists) {
      return res.status(404).json({ error: "Service not found" });
    }
    
    const serviceData = serviceDoc.data();
    if (!serviceData) {
      return res.status(404).json({ error: "Service data not found" });
    }
    console.log('📊 Current image URL:', serviceData.imageUrl);
    
    // Fix the URL by replacing https:// with https://
    const fixedImageUrl = serviceData.imageUrl.replace('https://', 'https://');
    console.log('✅ Fixed image URL:', fixedImageUrl);
    
    // Update the service
    await db.collection('services').doc('sxuiZggc8N66P8h9Yj8t').update({
      imageUrl: fixedImageUrl,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Service image URL fixed successfully!');
    res.status(200).json({ message: "Service image URL fixed successfully" });
    
  } catch (error: any) {
    console.error('❌ Error fixing service:', error);
    res.status(500).json({ error: error.message });
  }
};
