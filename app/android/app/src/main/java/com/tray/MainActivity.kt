package com.tray

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.tray.modules.TrayIntentModule
import com.tray.security.IntentSecurity

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "app"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    saveValidatedIntentExtras(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    saveValidatedIntentExtras(intent)
  }

  private fun saveValidatedIntentExtras(intent: Intent?) {
    if (intent == null) return

    if (Intent.ACTION_VIEW == intent.action) {
      if (!IntentSecurity.isValidDeepLink(intent.data)) {
        intent.data = null
      }
      return
    }

    val callId = intent.getStringExtra("callId")
    if (!callId.isNullOrEmpty()) {
      if (!IntentSecurity.shouldProcessCallIntent(this, intent)) {
        return
      }

      val prefs = getSharedPreferences(TrayIntentModule.PREFS_NAME, MODE_PRIVATE)
      prefs.edit()
        .putString(TrayIntentModule.KEY_CALL_ID, callId)
        .putString(TrayIntentModule.KEY_CALL_TYPE, intent.getStringExtra("callType") ?: "audio")
        .putString(TrayIntentModule.KEY_ACTION, intent.getStringExtra("action") ?: "open")
        .putString(TrayIntentModule.KEY_CALLER_ID, intent.getStringExtra("callerId"))
        .putString(TrayIntentModule.KEY_RECEIVER_ID, intent.getStringExtra("receiverId"))
        .apply()
      return
    }

    val chatId = intent.getStringExtra("chatId")
    if (!chatId.isNullOrEmpty()) {
      if (!IntentSecurity.shouldProcessChatIntent(this, intent)) {
        return
      }

      val prefs = getSharedPreferences(TrayIntentModule.PREFS_NAME, MODE_PRIVATE)
      prefs.edit()
        .putString(TrayIntentModule.KEY_PENDING_CHAT_ID, chatId)
        .putString(TrayIntentModule.KEY_PENDING_SENDER_ID, intent.getStringExtra("senderId"))
        .apply()
    }
  }
}
