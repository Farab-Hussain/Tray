package com.tray

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.tray.modules.TrayIntentModule

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "app"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    saveCallIntentExtras(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    saveCallIntentExtras(intent)
  }

  private fun saveCallIntentExtras(intent: Intent?) {
    val callId = intent?.getStringExtra("callId") ?: return
    val prefs = getSharedPreferences(TrayIntentModule.PREFS_NAME, MODE_PRIVATE)
    prefs.edit()
      .putString(TrayIntentModule.KEY_CALL_ID, callId)
      .putString(TrayIntentModule.KEY_CALL_TYPE, intent.getStringExtra("callType") ?: "audio")
      .putString(TrayIntentModule.KEY_ACTION, intent.getStringExtra("action") ?: "accept")
      .putString(TrayIntentModule.KEY_CALLER_ID, intent.getStringExtra("callerId"))
      .putString(TrayIntentModule.KEY_RECEIVER_ID, intent.getStringExtra("receiverId"))
      .apply()
  }
}
