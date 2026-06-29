package com.tray.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.tray.MainActivity;

public class CallBroadcastReceiver extends BroadcastReceiver {
    private static final String TAG = "CallBroadcastReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d(TAG, "Received broadcast: " + action);

        if (action != null) {
            switch (action) {
                case "android.intent.action.BOOT_COMPLETED":
                    Log.d(TAG, "Boot completed - starting call monitoring");
                    // Start call monitoring service if needed
                    break;
                    
                case "android.intent.action.PHONE_STATE":
                    Log.d(TAG, "Phone state changed");
                    // Handle phone state changes if needed
                    break;
                    
                case "com.tray.INCOMING_CALL":
                    Log.d(TAG, "Incoming call broadcast received");
                    handleIncomingCall(context, intent);
                    break;
            }
        }
    }

    private void handleIncomingCall(Context context, Intent intent) {
        String callId = intent.getStringExtra("callId");
        String callType = intent.getStringExtra("callType");
        
        if (callId != null && callType != null) {
            // Start the call service to show notification
            Intent serviceIntent = new Intent(context, com.tray.services.CallService.class);
            serviceIntent.putExtra("callId", callId);
            serviceIntent.putExtra("callType", callType);
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            
            // Also show the incoming call activity
            Intent activityIntent = new Intent(context, MainActivity.class);
            activityIntent.putExtra("callId", callId);
            activityIntent.putExtra("callType", callType);
            activityIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            context.startActivity(activityIntent);
        }
    }
}
