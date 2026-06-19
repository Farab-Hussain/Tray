package com.tray.notifications;

import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.tray.IncomingCallActivity;
import com.tray.MainActivity;
import com.tray.R;
import com.tray.modules.TrayIntentModule;
import com.tray.security.IntentSecurity;
import com.tray.services.CallService;

import java.util.Map;

/**
 * Builds WhatsApp-style incoming call UI when FCM arrives while app is backgrounded or killed.
 */
public final class CallNotificationHelper {
  private static final String TAG = "CallNotificationHelper";
  private static final String CHANNEL_ID = "incoming_calls";
  private static final int NOTIFICATION_ID = 9001;

  private CallNotificationHelper() {}

  public static void handleIncomingCall(Context context, Map<String, String> data) {
    if (context == null || data == null) {
      return;
    }

    String callId = data.get("callId");
    if (callId == null || callId.isEmpty()) {
      return;
    }

    if (isAppInForeground(context)) {
      Log.d(TAG, "App foreground — RN handles call UI");
      return;
    }

    String callType = valueOrDefault(data.get("callType"), "audio");
    String callerId = valueOrDefault(data.get("callerId"), "");
    String receiverId = valueOrDefault(data.get("receiverId"), "");
    String callerName = valueOrDefault(data.get("callerName"), "Incoming Call");

    ensureChannel(context);

    Intent fullScreenIntent = buildIncomingActivityIntent(context, callId, callType, callerId, receiverId, callerName);

    PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
      context,
      callId.hashCode(),
      fullScreenIntent,
      pendingIntentFlags()
    );

    PendingIntent acceptPendingIntent = PendingIntent.getActivity(
      context,
      (callId + "_accept").hashCode(),
      buildCallIntent(context, callId, callType, callerId, receiverId, "accept"),
      pendingIntentFlags()
    );

    PendingIntent declinePendingIntent = PendingIntent.getActivity(
      context,
      (callId + "_decline").hashCode(),
      buildCallIntent(context, callId, callType, callerId, receiverId, "decline"),
      pendingIntentFlags()
    );

    String title = "video".equalsIgnoreCase(callType) ? "Incoming Video Call" : "Incoming Audio Call";
    String body = callerName + " is calling you…";

    NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle(title)
      .setContentText(body)
      .setSubText(callerName)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_CALL)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setAutoCancel(true)
      .setOngoing(true)
      .setContentIntent(fullScreenPendingIntent)
      .setFullScreenIntent(fullScreenPendingIntent, true)
      .addAction(0, "Decline", declinePendingIntent)
      .addAction(0, "Accept", acceptPendingIntent)
      .setDefaults(Notification.DEFAULT_ALL);

    NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    if (manager != null) {
      manager.notify(NOTIFICATION_ID, builder.build());
    }

    try {
      Intent serviceIntent = new Intent(context, CallService.class);
      serviceIntent.putExtra("callId", callId);
      serviceIntent.putExtra("callType", callType);
      serviceIntent.putExtra("callerId", callerId);
      serviceIntent.putExtra("receiverId", receiverId);
      serviceIntent.putExtra("callerName", callerName);
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(serviceIntent);
      } else {
        context.startService(serviceIntent);
      }
    } catch (Exception e) {
      Log.w(TAG, "Could not start CallService", e);
    }

    try {
      Intent activityIntent = buildIncomingActivityIntent(context, callId, callType, callerId, receiverId, callerName);
      context.startActivity(activityIntent);
    } catch (Exception e) {
      Log.w(TAG, "Could not launch IncomingCallActivity", e);
    }
  }

  public static void handleChatMessage(Context context, Map<String, String> data) {
    handleChatMessage(context, data, false);
  }

  public static void handleChatMessage(Context context, Map<String, String> data, boolean allowForeground) {
    if (context == null || data == null) {
      return;
    }

    if (!allowForeground && isAppInForeground(context)) {
      return;
    }

    String chatId = data.get("chatId");
    if (chatId == null || chatId.isEmpty()) {
      return;
    }

    ensureChatChannel(context);

    String title = valueOrDefault(data.get("senderName"), valueOrDefault(data.get("title"), "New message"));
    String body = valueOrDefault(data.get("messageText"), "You have a new message");

    Intent openIntent = new Intent(context, MainActivity.class);
    openIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
    openIntent.putExtra("notificationType", "chat_message");
    openIntent.putExtra("chatId", chatId);
    openIntent.putExtra("senderId", valueOrDefault(data.get("senderId"), ""));
    IntentSecurity.markInternal(context, openIntent);

    PendingIntent pendingIntent = PendingIntent.getActivity(
      context,
      chatId.hashCode(),
      openIntent,
      pendingIntentFlags()
    );

    NotificationCompat.Builder builder = new NotificationCompat.Builder(context, "chat_messages")
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle(title)
      .setContentText(body)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setAutoCancel(true)
      .setContentIntent(pendingIntent);

    NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    if (manager != null) {
      manager.notify(chatId.hashCode(), builder.build());
    }
  }

  private static Intent buildIncomingActivityIntent(
    Context context,
    String callId,
    String callType,
    String callerId,
    String receiverId,
    String callerName
  ) {
    Intent intent = new Intent(context, IncomingCallActivity.class);
    intent.putExtra("callId", callId);
    intent.putExtra("callType", callType);
    intent.putExtra("callerId", callerId);
    intent.putExtra("receiverId", receiverId);
    intent.putExtra("callerName", callerName);
    intent.putExtra("action", "open");
    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
    IntentSecurity.markInternal(context, intent);
    return intent;
  }

  private static Intent buildCallIntent(
    Context context,
    String callId,
    String callType,
    String callerId,
    String receiverId,
    String action
  ) {
    Intent intent = new Intent(context, IncomingCallActivity.class);
    intent.putExtra("callId", callId);
    intent.putExtra("callType", callType);
    intent.putExtra("callerId", callerId);
    intent.putExtra("receiverId", receiverId);
    intent.putExtra("action", action);
    intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
    IntentSecurity.markInternal(context, intent);
    return intent;
  }

  private static boolean isAppInForeground(Context context) {
    ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
    if (activityManager == null) {
      return false;
    }
    for (ActivityManager.RunningAppProcessInfo process : activityManager.getRunningAppProcesses()) {
      if (process == null) {
        continue;
      }
      if (process.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
        && process.processName.equals(context.getPackageName())) {
        return true;
      }
    }
    return false;
  }

  private static void ensureChannel(Context context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return;
    }
    NotificationManager manager = context.getSystemService(NotificationManager.class);
    if (manager == null || manager.getNotificationChannel(CHANNEL_ID) != null) {
      return;
    }
    android.app.NotificationChannel channel = new android.app.NotificationChannel(
      CHANNEL_ID,
      "Incoming Calls",
      NotificationManager.IMPORTANCE_HIGH
    );
    channel.setDescription("Incoming audio and video calls");
    channel.enableVibration(true);
    channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
    manager.createNotificationChannel(channel);
  }

  private static void ensureChatChannel(Context context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return;
    }
    NotificationManager manager = context.getSystemService(NotificationManager.class);
    if (manager == null || manager.getNotificationChannel("chat_messages") != null) {
      return;
    }
    android.app.NotificationChannel channel = new android.app.NotificationChannel(
      "chat_messages",
      "Chat Messages",
      NotificationManager.IMPORTANCE_HIGH
    );
    channel.setDescription("New chat message notifications");
    manager.createNotificationChannel(channel);
  }

  private static int pendingIntentFlags() {
    int flags = PendingIntent.FLAG_UPDATE_CURRENT;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      flags |= PendingIntent.FLAG_IMMUTABLE;
    }
    return flags;
  }

  private static String valueOrDefault(String value, String fallback) {
    return value == null || value.isEmpty() ? fallback : value;
  }
}
