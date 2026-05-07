package com.tray;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

public class IncomingCallActivity extends Activity {
    private String callId;
    private String callType;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Show activity over lock screen
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

        // Get call details from intent
        Intent intent = getIntent();
        callId = intent.getStringExtra("callId");
        callType = intent.getStringExtra("callType");

        // Setup UI
        TextView callTypeText = findViewById(R.id.callTypeText);
        if (callTypeText != null) {
            callTypeText.setText("Incoming " + callType + " Call");
        }

        Button acceptButton = findViewById(R.id.acceptButton);
        Button declineButton = findViewById(R.id.declineButton);

        if (acceptButton != null) {
            acceptButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    acceptCall();
                }
            });
        }

        if (declineButton != null) {
            declineButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    declineCall();
                }
            });
        }
    }

    private void acceptCall() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra("callId", callId);
        intent.putExtra("callType", callType);
        intent.putExtra("action", "accept");
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
        finish();
    }

    private void declineCall() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra("callId", callId);
        intent.putExtra("callType", callType);
        intent.putExtra("action", "decline");
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
        finish();
    }

    @Override
    public void onBackPressed() {
        // Prevent back button from dismissing the incoming call screen
        // User must explicitly accept or decline
    }
}
