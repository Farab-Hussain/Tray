package com.tray;

import android.content.Intent;
import com.google.firebase.messaging.RemoteMessage;
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService;
import java.util.Map;

public class TrayMessagingService extends ReactNativeFirebaseMessagingService {

  @Override
  public void onMessageReceived(RemoteMessage remoteMessage) {
    Map<String, String> data = remoteMessage.getData();
    if (data != null && (data.containsKey("callId") || "call".equals(data.get("type")))) {
      String callId = data.get("callId");
      String callType = data.get("callType") != null ? data.get("callType") : "audio";
      String callerId = data.get("callerId");
      String receiverId = data.get("receiverId");

      Intent activityIntent = new Intent(this, IncomingCallActivity.class);
      activityIntent.putExtra("callId", callId);
      activityIntent.putExtra("callType", callType);
      if (callerId != null) activityIntent.putExtra("callerId", callerId);
      if (receiverId != null) activityIntent.putExtra("receiverId", receiverId);
      activityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
      startActivity(activityIntent);

      Intent serviceIntent = new Intent(this, com.tray.services.CallService.class);
      serviceIntent.putExtra("callId", callId);
      serviceIntent.putExtra("callType", callType);
      startForegroundService(serviceIntent);
    }
    super.onMessageReceived(remoteMessage);
  }
}
