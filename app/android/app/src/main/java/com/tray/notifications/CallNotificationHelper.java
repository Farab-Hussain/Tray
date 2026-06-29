package com.tray.notifications;

import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

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
    handleIncomingCall(context, data, false);
  }

  public static void handleIncomingCall(Context context, Map<String, String> data, boolean forceWhenForeground) {
    if (context == null || data == null) {
      return;
    }

    String callId = data.get("callId");
    if (callId == null || callId.isEmpty()) {
      return;
    }

    if (!forceWhenForeground && isAppInForeground(context)) {
      Log.d(TAG, "App foreground — skipping background-only incoming handler");
      return;
    }

    String callType = valueOrDefault(data.get("callType"), "audio");
    String callerId = valueOrDefault(data.get("callerId"), "");
    String receiverId = valueOrDefault(data.get("receiverId"), "");
    String callerName = valueOrDefault(data.get("callerName"), "Incoming Call");

    TrayIntentModule.storePendingIncomingCall(
      context,
      callId,
      callType,
      callerId,
      receiverId,
      callerName,
      "open"
    );

    if (isAppInForeground(context)) {
      Log.d(TAG, "App foreground — stored pending call for React Native UI");
      return;
    }

    if (!canPostNotifications(context)) {
      Log.w(TAG, "POST_NOTIFICATIONS denied — launching MainActivity directly");
      launchIncomingActivityDirect(context, callId, callType, callerId, receiverId, callerName);
      return;
    }

    if (Build.VERSION.SDK_INT >= 34) {
      NotificationManager nm = context.getSystemService(NotificationManager.class);
      if (nm != null && !nm.canUseFullScreenIntent()) {
        Log.w(TAG, "Full-screen intent not allowed — user may need to enable in system settings");
      }
    }

    ensureChannel(context);
    acquireBriefWakeLock(context);

    try {
      Intent serviceIntent = new Intent(context, CallService.class);
      serviceIntent.putExtra("callId", callId);
      serviceIntent.putExtra("callType", callType);
      serviceIntent.putExtra("callerId", callerId);
      serviceIntent.putExtra("receiverId", receiverId);
      serviceIntent.putExtra("callerName", callerName);
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        ContextCompat.startForegroundService(context, serviceIntent);
      } else {
        context.startService(serviceIntent);
      }
    } catch (Exception e) {
      Log.w(TAG, "Could not start CallService — falling back to notification", e);
      postFallbackNotification(context, callId, callType, callerId, receiverId, callerName);
    }

    launchIncomingActivityDirect(context, callId, callType, callerId, receiverId, callerName);
  }

  public static void handleOutgoingCall(
    Context context,
    String callId,
    String callType,
    String callerId,
    String receiverId,
    String calleeName
  ) {
    if (context == null || callId == null || callId.isEmpty()) {
      return;
    }

    ensureChannel(context);

    try {
      Intent activityIntent = buildOutgoingActivityIntent(
        context,
        callId,
        valueOrDefault(callType, "audio"),
        valueOrDefault(callerId, ""),
        valueOrDefault(receiverId, ""),
        valueOrDefault(calleeName, "Calling…")
      );
      context.startActivity(activityIntent);
    } catch (Exception e) {
      Log.w(TAG, "Could not launch outgoing call UI", e);
    }
  }

  public static void dismissCallUi(Context context) {
    if (context == null) {
      return;
    }
    NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    if (manager != null) {
      manager.cancel(NOTIFICATION_ID);
    }
    try {
      context.stopService(new Intent(context, CallService.class));
    } catch (Exception e) {
      Log.w(TAG, "Could not stop CallService", e);
    }
  }

  public static void handleChatMessage(Context context, Map<String, String> data) {
    handleChatMessage(context, data, false);
  }

  public static void handleChatMessage(Context context, Map<String, String> data, boolean forceWhenForeground) {
    if (context == null || data == null) {
      return;
    }
    if (!forceWhenForeground && isAppInForeground(context)) {
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

  private static void postFallbackNotification(
    Context context,
    String callId,
    String callType,
    String callerId,
    String receiverId,
    String callerName
  ) {
    Intent fullScreenIntent = buildIncomingActivityIntent(context, callId, callType, callerId, receiverId, callerName);
    PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
      context,
      callId.hashCode(),
      fullScreenIntent,
      pendingIntentFlags()
    );

    String title = "video".equalsIgnoreCase(callType) ? "Incoming Video Call" : "Incoming Audio Call";

    NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle(title)
      .setContentText(callerName + " is calling you…")
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_CALL)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setContentIntent(fullScreenPendingIntent)
      .setFullScreenIntent(fullScreenPendingIntent, true)
      .setDefaults(Notification.DEFAULT_ALL);

    NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    if (manager != null) {
      manager.notify(NOTIFICATION_ID, builder.build());
    }
  }

  private static void launchIncomingActivityDirect(
    Context context,
    String callId,
    String callType,
    String callerId,
    String receiverId,
    String callerName
  ) {
    try {
      Intent activityIntent = buildIncomingActivityIntent(context, callId, callType, callerId, receiverId, callerName);
      context.startActivity(activityIntent);
    } catch (Exception e) {
      Log.w(TAG, "Could not launch IncomingCallActivity", e);
    }
  }

  private static void acquireBriefWakeLock(Context context) {
    try {
      PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
      if (powerManager == null) {
        return;
      }
      PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
        PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
        "tray:fcm_call_wake"
      );
      wakeLock.acquire(15_000L);
    } catch (Exception e) {
      Log.w(TAG, "Could not acquire wake lock", e);
    }
  }

  private static boolean canPostNotifications(Context context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      return true;
    }
    NotificationManager manager = context.getSystemService(NotificationManager.class);
    return manager != null && manager.areNotificationsEnabled();
  }

  private static Intent buildIncomingActivityIntent(
    Context context,
    String callId,
    String callType,
    String callerId,
    String receiverId,
    String callerName
  ) {
    Intent intent = new Intent(context, MainActivity.class);
    intent.putExtra("callId", callId);
    intent.putExtra("callType", callType);
    intent.putExtra("callerId", callerId);
    intent.putExtra("receiverId", receiverId);
    intent.putExtra("callerName", callerName);
    intent.putExtra("direction", "incoming");
    intent.putExtra("action", "open");
    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
    IntentSecurity.markInternal(context, intent);
    return intent;
  }

  private static Intent buildOutgoingActivityIntent(
    Context context,
    String callId,
    String callType,
    String callerId,
    String receiverId,
    String calleeName
  ) {
    Intent intent = new Intent(context, MainActivity.class);
    intent.putExtra("callId", callId);
    intent.putExtra("callType", callType);
    intent.putExtra("callerId", callerId);
    intent.putExtra("receiverId", receiverId);
    intent.putExtra("callerName", calleeName);
    intent.putExtra("direction", "outgoing");
    intent.putExtra("action", "open");
    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
    IntentSecurity.markInternal(context, intent);
    return intent;
  }

  public static boolean isAppInForeground(Context context) {
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
    if (manager == null) {
      return;
    }

    if (manager.getNotificationChannel(CHANNEL_ID) != null) {
      return;
    }

    Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
    AudioAttributes audioAttributes = new AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build();

    NotificationChannel channel = new NotificationChannel(
      CHANNEL_ID,
      "Incoming Calls",
      NotificationManager.IMPORTANCE_HIGH
    );
    channel.setDescription("Incoming audio and video calls");
    channel.enableVibration(true);
    channel.setVibrationPattern(new long[] { 0, 1000, 1000, 1000 });
    channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
    channel.setBypassDnd(true);
    if (ringtoneUri != null) {
      channel.setSound(ringtoneUri, audioAttributes);
    }
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
