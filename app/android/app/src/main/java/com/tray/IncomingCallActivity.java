package com.tray;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import com.tray.modules.TrayIntentModule;
import com.tray.security.IntentSecurity;

public class IncomingCallActivity extends Activity {
    private String callId;
    private String callType;
    private String callerId;
    private String receiverId;
    private String callerName;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent = getIntent();
        if (intent == null || !IntentSecurity.isTrustedInternalIntent(this, intent)
            || !IntentSecurity.isValidCallPayload(intent)) {
            finish();
            return;
        }

        callId = intent.getStringExtra("callId");
        callType = intent.getStringExtra("callType");
        callerId = intent.getStringExtra("callerId");
        receiverId = intent.getStringExtra("receiverId");
        callerName = intent.getStringExtra("callerName");

        String action = intent.getStringExtra("action");
        if ("accept".equalsIgnoreCase(action) || "decline".equalsIgnoreCase(action)) {
            launchMainActivity(action.toLowerCase());
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }

        setContentView(R.layout.activity_incoming_call);

        TextView callTypeText = findViewById(R.id.callTypeText);
        if (callTypeText != null) {
            String label = callerName != null && !callerName.isEmpty()
                ? callerName
                : ("Incoming " + (callType != null ? callType : "audio") + " Call");
            callTypeText.setText(label);
        }

        Button acceptButton = findViewById(R.id.acceptButton);
        Button declineButton = findViewById(R.id.declineButton);

        if (acceptButton != null) {
            acceptButton.setOnClickListener(v -> acceptCall());
        }

        if (declineButton != null) {
            declineButton.setOnClickListener(v -> declineCall());
        }
    }

    private void acceptCall() {
        launchMainActivity("accept");
    }

    private void declineCall() {
        launchMainActivity("decline");
    }

    private void launchMainActivity(String action) {
        getSharedPreferences(TrayIntentModule.PREFS_NAME, MODE_PRIVATE)
            .edit()
            .putString(TrayIntentModule.KEY_CALL_ID, callId != null ? callId : "")
            .putString(TrayIntentModule.KEY_CALL_TYPE, callType != null ? callType : "audio")
            .putString(TrayIntentModule.KEY_ACTION, action)
            .putString(TrayIntentModule.KEY_CALLER_ID, callerId)
            .putString(TrayIntentModule.KEY_RECEIVER_ID, receiverId)
            .apply();

        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra("callId", callId);
        intent.putExtra("callType", callType);
        intent.putExtra("callerId", callerId);
        intent.putExtra("receiverId", receiverId);
        intent.putExtra("action", action);
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        IntentSecurity.markInternal(this, intent);
        startActivity(intent);
        finish();
    }

    @Override
    @Deprecated
    public void onBackPressed() {
        // Require explicit accept or decline
    }
}
