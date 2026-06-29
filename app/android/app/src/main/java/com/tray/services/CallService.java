package com.tray.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.tray.MainActivity;
import com.tray.R;
import com.tray.security.IntentSecurity;

public class CallService extends Service {
    private static final String TAG = "TrayCallService";
    private static final String CHANNEL_ID = "incoming_calls";
    private static final int NOTIFICATION_ID = 9001;

    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String callId = intent.getStringExtra("callId");
        if (callId == null || callId.isEmpty()) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String callType = valueOrDefault(intent.getStringExtra("callType"), "audio");
        String callerId = valueOrDefault(intent.getStringExtra("callerId"), "");
        String receiverId = valueOrDefault(intent.getStringExtra("receiverId"), "");
        String callerName = valueOrDefault(intent.getStringExtra("callerName"), "Incoming Call");

        acquireWakeLock();

        Notification notification = buildIncomingCallNotification(
            callId,
            callType,
            callerId,
            receiverId,
            callerName
        );

        try {
            startForeground(NOTIFICATION_ID, notification);
        } catch (Exception e) {
            Log.e(TAG, "startForeground failed", e);
            releaseWakeLock();
            stopSelf();
            return START_NOT_STICKY;
        }

        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        releaseWakeLock();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private Notification buildIncomingCallNotification(
        String callId,
        String callType,
        String callerId,
        String receiverId,
        String callerName
    ) {
        Intent fullScreenIntent = buildIncomingActivityIntent(callId, callType, callerId, receiverId, callerName, "open");
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
            this,
            callId.hashCode(),
            fullScreenIntent,
            pendingIntentFlags()
        );

        PendingIntent acceptPendingIntent = PendingIntent.getActivity(
            this,
            (callId + "_accept").hashCode(),
            buildIncomingActivityIntent(callId, callType, callerId, receiverId, callerName, "accept"),
            pendingIntentFlags()
        );

        PendingIntent declinePendingIntent = PendingIntent.getActivity(
            this,
            (callId + "_decline").hashCode(),
            buildIncomingActivityIntent(callId, callType, callerId, receiverId, callerName, "decline"),
            pendingIntentFlags()
        );

        String title = "video".equalsIgnoreCase(callType) ? "Incoming Video Call" : "Incoming Audio Call";
        String body = callerName + " is calling you…";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(body)
            .setSubText(callerName)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setOngoing(true)
            .setContentIntent(fullScreenPendingIntent)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .addAction(0, "Decline", declinePendingIntent)
            .addAction(0, "Accept", acceptPendingIntent)
            .setDefaults(Notification.DEFAULT_ALL);

        return builder.build();
    }

    private Intent buildIncomingActivityIntent(
        String callId,
        String callType,
        String callerId,
        String receiverId,
        String callerName,
        String action
    ) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra("callId", callId);
        intent.putExtra("callType", callType);
        intent.putExtra("callerId", callerId);
        intent.putExtra("receiverId", receiverId);
        intent.putExtra("callerName", callerName);
        intent.putExtra("direction", "incoming");
        intent.putExtra("action", action);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        IntentSecurity.markInternal(this, intent);
        return intent;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CHANNEL_ID) != null) {
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

    private void acquireWakeLock() {
        try {
            PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (powerManager == null) {
                return;
            }
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "tray:incoming_call_wake"
            );
            wakeLock.acquire(60_000L);
        } catch (Exception e) {
            Log.w(TAG, "Could not acquire wake lock", e);
        }
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception e) {
                Log.w(TAG, "Could not release wake lock", e);
            }
            wakeLock = null;
        }
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
