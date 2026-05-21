package com.tray.modules

import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TrayIntentModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "TrayIntentModule"

  @ReactMethod
  fun getPendingCallIntent(promise: Promise) {
    try {
      val prefs =
        reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val callId = prefs.getString(KEY_CALL_ID, null)
      if (callId.isNullOrEmpty()) {
        promise.resolve(null)
        return
      }

      val map = Arguments.createMap()
      map.putString("callId", callId)
      map.putString("callType", prefs.getString(KEY_CALL_TYPE, "audio"))
      map.putString("action", prefs.getString(KEY_ACTION, "open"))
      val callerId = prefs.getString(KEY_CALLER_ID, null)
      val receiverId = prefs.getString(KEY_RECEIVER_ID, null)
      if (callerId != null) map.putString("callerId", callerId)
      if (receiverId != null) map.putString("receiverId", receiverId)

      prefs.edit().clear().apply()
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("TRAY_INTENT_ERROR", e.message, e)
    }
  }

  companion object {
    const val PREFS_NAME = "tray_call_intent"
    const val KEY_CALL_ID = "call_id"
    const val KEY_CALL_TYPE = "call_type"
    const val KEY_ACTION = "action"
    const val KEY_CALLER_ID = "caller_id"
    const val KEY_RECEIVER_ID = "receiver_id"
  }
}
