// src/controllers/fcm.controller.ts
import { Request, Response } from "express";
import { db } from "../config/firebase";
import { Logger } from "../utils/logger";

/**
 * POST /fcm/token
 * Register FCM token for current user
 */
export const registerFCMToken = async (req: Request, res: Response) => {
  const route = "POST /fcm/token";
  
  try {
    const { fcmToken, deviceType = 'ios' } = req.body;
    const user = (req as any).user;

    if (!user || !user.uid) {
      Logger.error(route, "", "User not authenticated");
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!fcmToken) {
      Logger.error(route, "", "FCM token is required");
      return res.status(400).json({ error: 'FCM token is required' });
    }

    // Check if token already exists for this user
    const fcmTokensRef = db
      .collection('users')
      .doc(user.uid)
      .collection('fcmTokens');

    const existingTokensSnapshot = await fcmTokensRef
      .where('fcmToken', '==', fcmToken)
      .get();

    // If token exists, update it
    if (!existingTokensSnapshot.empty) {
      const existingToken = existingTokensSnapshot.docs[0];
      await existingToken.ref.update({
        updatedAt: new Date(),
      });
      Logger.success(route, user.uid, `FCM token updated: ${fcmToken}`);
      return res.json({ success: true, message: 'FCM token updated' });
    }

    // Create new token document
    await fcmTokensRef.add({
      fcmToken,
      deviceType,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    Logger.success(route, user.uid, `FCM token registered: ${fcmToken}`);
    res.json({ success: true, message: 'FCM token registered' });
  } catch (error) {
    Logger.error(route, "", "Error registering FCM token", error);
    res.status(500).json({ error: 'Failed to register FCM token' });
  }
};

/**
 * DELETE /fcm/token
 * Delete FCM token(s) for current user
 */
export const deleteFCMToken = async (req: Request, res: Response) => {
  const route = "DELETE /fcm/token";
  
  try {
    const { fcmToken } = req.body;
    const user = (req as any).user;

    if (!user || !user.uid) {
      Logger.error(route, "", "User not authenticated");
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fcmTokensRef = db
      .collection('users')
      .doc(user.uid)
      .collection('fcmTokens');

    if (fcmToken) {
      // Delete specific token
      const tokensSnapshot = await fcmTokensRef
        .where('fcmToken', '==', fcmToken)
        .get();

      if (tokensSnapshot.empty) {
        Logger.warn(route, user.uid, "FCM token not found");
        return res.status(404).json({ error: 'FCM token not found' });
      }

      const batch = db.batch();
      tokensSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      Logger.success(route, user.uid, `FCM token deleted: ${fcmToken}`);
      res.json({ success: true, message: 'FCM token deleted' });
    } else {
      // Delete all tokens (on logout)
      const allTokensSnapshot = await fcmTokensRef.get();
      
      if (allTokensSnapshot.empty) {
        Logger.warn(route, user.uid, "No FCM tokens found");
        return res.json({ success: true, message: 'No tokens to delete' });
      }

      const batch = db.batch();
      allTokensSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      Logger.success(route, user.uid, `All FCM tokens deleted`);
      res.json({ success: true, message: 'All FCM tokens deleted' });
    }
  } catch (error) {
    Logger.error(route, "", "Error deleting FCM token", error);
    res.status(500).json({ error: 'Failed to delete FCM token' });
  }
};

