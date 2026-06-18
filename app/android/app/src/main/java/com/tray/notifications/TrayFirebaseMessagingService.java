package com.tray.notifications;

import android.util.Log;

import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService;

/**
 * Intercepts FCM before RN so killed/background calls show native incoming-call UI.
 */
public class TrayFirebaseMessagingService extends ReactNativeFirebaseMessagingService {
  private static final String TAG = "TrayFCMService";

  @Override
  public void onMessageReceived(RemoteMessage remoteMessage) {
    Map<String, String> data = remoteMessage.getData();
    if (data != null && !data.isEmpty()) {
      String type = data.get("type");
      if ("call".equals(type) || data.containsKey("callId")) {
        Log.d(TAG, "Incoming call push received — showing native call UI");
        CallNotificationHelper.handleIncomingCall(getApplicationContext(), data);
      } else if ("chat_message".equals(type) || data.containsKey("chatId")) {
        if (remoteMessage.getNotification() == null) {
          CallNotificationHelper.handleChatMessage(getApplicationContext(), data);
        }
      }
    }

    super.onMessageReceived(remoteMessage);
  }
}
