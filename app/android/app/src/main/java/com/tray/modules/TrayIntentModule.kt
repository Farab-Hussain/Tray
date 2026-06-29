package com.tray.modules

import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.tray.MainActivity
import com.tray.notifications.CallNotificationHelper
import com.tray.security.IntentSecurity
import java.util.HashMap

class TrayIntentModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "TrayIntentModule"

  @ReactMethod
  fun peekPendingCallIntent(promise: Promise) {
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
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("TRAY_INTENT_ERROR", e.message, e)
    }
  }

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

      prefs.edit()
        .remove(KEY_CALL_ID)
        .remove(KEY_CALL_TYPE)
        .remove(KEY_ACTION)
        .remove(KEY_CALLER_ID)
        .remove(KEY_RECEIVER_ID)
        .apply()
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("TRAY_INTENT_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun getPendingChatIntent(promise: Promise) {
    try {
      val prefs =
        reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val chatId = prefs.getString(KEY_PENDING_CHAT_ID, null)
      if (chatId.isNullOrEmpty()) {
        promise.resolve(null)
        return
      }

      val map = Arguments.createMap()
      map.putString("chatId", chatId)
      val senderId = prefs.getString(KEY_PENDING_SENDER_ID, null)
      if (senderId != null) map.putString("senderId", senderId)

      prefs.edit()
        .remove(KEY_PENDING_CHAT_ID)
        .remove(KEY_PENDING_SENDER_ID)
        .apply()
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("TRAY_INTENT_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun presentIncomingCall(
    callId: String?,
    callType: String?,
    callerId: String?,
    receiverId: String?,
    callerName: String?,
    promise: Promise,
  ) {
    try {
      if (callId.isNullOrBlank() || callerId.isNullOrBlank() || receiverId.isNullOrBlank()) {
        promise.reject("INVALID_CALL", "callId, callerId, and receiverId are required")
        return
      }
      TrayIntentModule.storePendingIncomingCall(
        reactApplicationContext,
        callId,
        callType ?: "audio",
        callerId,
        receiverId,
        callerName ?: "Incoming Call",
        "open",
      )
      val intent = Intent(reactApplicationContext, MainActivity::class.java)
      intent.putExtra("callId", callId)
      intent.putExtra("callType", callType ?: "audio")
      intent.putExtra("callerId", callerId)
      intent.putExtra("receiverId", receiverId)
      intent.putExtra("callerName", callerName ?: "Incoming Call")
      intent.putExtra("action", "open")
      intent.addFlags(
        Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_CLEAR_TOP or
          Intent.FLAG_ACTIVITY_SINGLE_TOP,
      )
      IntentSecurity.markInternal(reactApplicationContext, intent)
      reactApplicationContext.startActivity(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("TRAY_CALL_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun presentOutgoingCall(
    callId: String?,
    callType: String?,
    callerId: String?,
    receiverId: String?,
    calleeName: String?,
    promise: Promise,
  ) {
    try {
      if (callId.isNullOrBlank() || callerId.isNullOrBlank() || receiverId.isNullOrBlank()) {
        promise.reject("INVALID_CALL", "callId, callerId, and receiverId are required")
        return
      }
      CallNotificationHelper.handleOutgoingCall(
        reactApplicationContext,
        callId,
        callType ?: "audio",
        callerId,
        receiverId,
        calleeName ?: "Calling…",
      )
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("TRAY_CALL_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun setVideoCallActive(active: Boolean, promise: Promise) {
    try {
      MainActivity.videoCallActive = active
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("TRAY_CALL_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun dismissCallUi(callId: String?, promise: Promise) {
    try {
      CallNotificationHelper.dismissCallUi(reactApplicationContext)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("TRAY_CALL_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun showChatMessageNotification(chatId: String?, senderId: String?, title: String?, body: String?, promise: Promise) {
    try {
      if (chatId.isNullOrBlank()) {
        promise.reject("INVALID_CHAT_NOTIFICATION", "chatId is required")
        return
      }

      val data = HashMap<String, String>()
      data["type"] = "chat_message"
      data["chatId"] = chatId
      if (!senderId.isNullOrBlank()) data["senderId"] = senderId
      if (!title.isNullOrBlank()) {
        data["title"] = title
        data["senderName"] = title
      }
      if (!body.isNullOrBlank()) data["messageText"] = body

      CallNotificationHelper.handleChatMessage(
        reactApplicationContext,
        data,
        true,
      )
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("TRAY_NOTIFICATION_ERROR", e.message, e)
    }
  }

  companion object {
    const val PREFS_NAME = "tray_call_intent"
    const val KEY_CALL_ID = "call_id"
    const val KEY_CALL_TYPE = "call_type"
    const val KEY_ACTION = "action"
    const val KEY_CALLER_ID = "caller_id"
    const val KEY_RECEIVER_ID = "receiver_id"
    const val KEY_CALLER_NAME = "caller_name"
    const val KEY_PENDING_CHAT_ID = "pending_chat_id"
    const val KEY_PENDING_SENDER_ID = "pending_sender_id"

    /** Persist incoming call so cold start can open the call screen even if UI was missed. */
    @JvmStatic
    fun storePendingIncomingCall(
      context: Context,
      callId: String,
      callType: String,
      callerId: String,
      receiverId: String,
      callerName: String,
      action: String = "open",
    ) {
      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .putString(KEY_CALL_ID, callId)
        .putString(KEY_CALL_TYPE, callType)
        .putString(KEY_ACTION, action)
        .putString(KEY_CALLER_ID, callerId)
        .putString(KEY_RECEIVER_ID, receiverId)
        .putString(KEY_CALLER_NAME, callerName)
        .apply()
    }
  }
}
