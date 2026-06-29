package com.tray.notifications;

import android.util.Log;

import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService;

/**
 * Intercepts FCM before RN so calls always use native WhatsApp-style UI.
 */
public class TrayFirebaseMessagingService extends ReactNativeFirebaseMessagingService {
  private static final String TAG = "TrayFCMService";

  @Override
  public void onMessageReceived(RemoteMessage remoteMessage) {
    Map<String, String> data = remoteMessage.getData();
    if (data != null && !data.isEmpty()) {
      String type = data.get("type");
      if ("call".equals(type) || data.containsKey("callId")) {
        Log.d(TAG, "Incoming call push — showing native call UI");
        CallNotificationHelper.handleIncomingCall(getApplicationContext(), data, true);
        // Also forward to RN so AsyncStorage pending-call fallback is stored if native UI fails.
        try {
          super.onMessageReceived(remoteMessage);
        } catch (Exception e) {
          Log.w(TAG, "RN messaging fallback failed", e);
        }
        return;
      }
      if ("chat_message".equals(type) || data.containsKey("chatId")) {
        if (remoteMessage.getNotification() == null) {
          CallNotificationHelper.handleChatMessage(getApplicationContext(), data);
        }
      }
    }

    super.onMessageReceived(remoteMessage);
  }
}
