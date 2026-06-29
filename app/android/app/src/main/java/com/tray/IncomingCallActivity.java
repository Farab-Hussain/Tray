package com.tray;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

import com.tray.modules.TrayIntentModule;
import com.tray.notifications.CallNotificationHelper;
import com.tray.security.IntentSecurity;

/**
 * Legacy entry point — immediately forwards to MainActivity so React Native
 * renders the unified incoming call UI (never shows the old native layout).
 */
public class IncomingCallActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent = getIntent();
        if (intent == null || !IntentSecurity.isTrustedInternalIntent(this, intent)
            || !IntentSecurity.isValidCallPayload(intent)) {
            finish();
            return;
        }

        String callId = intent.getStringExtra("callId");
        String callType = intent.getStringExtra("callType");
        String callerId = intent.getStringExtra("callerId");
        String receiverId = intent.getStringExtra("receiverId");
        String callerName = intent.getStringExtra("callerName");
        String action = intent.getStringExtra("action");
        if (action == null || action.isEmpty()) {
            action = "open";
        }

        CallNotificationHelper.dismissCallUi(this);

        TrayIntentModule.storePendingIncomingCall(
            this,
            callId != null ? callId : "",
            callType != null ? callType : "audio",
            callerId != null ? callerId : "",
            receiverId != null ? receiverId : "",
            callerName != null ? callerName : "Incoming Call",
            action
        );

        Intent mainIntent = new Intent(this, MainActivity.class);
        mainIntent.putExtra("callId", callId);
        mainIntent.putExtra("callType", callType);
        mainIntent.putExtra("callerId", callerId);
        mainIntent.putExtra("receiverId", receiverId);
        mainIntent.putExtra("callerName", callerName);
        mainIntent.putExtra("action", action);
        mainIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        IntentSecurity.markInternal(this, mainIntent);
        startActivity(mainIntent);
        finish();
    }
}
