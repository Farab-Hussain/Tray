package com.fairchance.app.security

import android.content.Context
import android.content.Intent
import android.net.Uri
import java.util.UUID

/**
 * Validates intents delivered to exported activities and marks trusted in-app intents.
 */
object IntentSecurity {
  const val EXTRA_INTERNAL = "com.fairchance.app.extra.INTERNAL_TOKEN"

  private const val PREFS_NAME = "tray_intent_security"
  private const val KEY_TOKEN = "internal_intent_token"

  private val ID_PATTERN = Regex("^[a-zA-Z0-9_-]{1,128}$")
  private val CALL_TYPE_PATTERN = Regex("^(audio|video)$", RegexOption.IGNORE_CASE)
  private val CALL_ACTION_PATTERN = Regex("^(accept|decline|open)$", RegexOption.IGNORE_CASE)

  @JvmStatic
  fun markInternal(context: Context, intent: Intent) {
    intent.putExtra(EXTRA_INTERNAL, ensureToken(context))
  }

  @JvmStatic
  fun isTrustedInternalIntent(context: Context, intent: Intent): Boolean {
    val token = intent.getStringExtra(EXTRA_INTERNAL) ?: return false
    return token == ensureToken(context)
  }

  @JvmStatic
  fun isValidDeepLink(uri: Uri?): Boolean {
    if (uri == null) return false
    if (uri.scheme != "tray") return false
    return uri.host == "email-verification"
  }

  @JvmStatic
  fun isValidCallPayload(intent: Intent): Boolean {
    val callId = intent.getStringExtra("callId") ?: return false
    if (!ID_PATTERN.matches(callId)) return false

    val callType = intent.getStringExtra("callType") ?: "audio"
    if (!CALL_TYPE_PATTERN.matches(callType)) return false

    val action = intent.getStringExtra("action") ?: "open"
    if (!CALL_ACTION_PATTERN.matches(action)) return false

    val callerId = intent.getStringExtra("callerId")
    if (callerId != null && callerId.isNotEmpty() && !ID_PATTERN.matches(callerId)) return false

    val receiverId = intent.getStringExtra("receiverId")
    if (receiverId != null && receiverId.isNotEmpty() && !ID_PATTERN.matches(receiverId)) return false

    return true
  }

  @JvmStatic
  fun isValidChatPayload(intent: Intent): Boolean {
    val chatId = intent.getStringExtra("chatId") ?: return false
    if (!ID_PATTERN.matches(chatId)) return false

    val senderId = intent.getStringExtra("senderId")
    if (senderId != null && senderId.isNotEmpty() && !ID_PATTERN.matches(senderId)) return false

    val notificationType = intent.getStringExtra("notificationType")
    if (notificationType != null && notificationType != "chat_message") return false

    return true
  }

  @JvmStatic
  fun shouldProcessCallIntent(context: Context, intent: Intent): Boolean {
    return isTrustedInternalIntent(context, intent) && isValidCallPayload(intent)
  }

  @JvmStatic
  fun shouldProcessChatIntent(context: Context, intent: Intent): Boolean {
    return isTrustedInternalIntent(context, intent) && isValidChatPayload(intent)
  }

  private fun ensureToken(context: Context): String {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val existing = prefs.getString(KEY_TOKEN, null)
    if (existing != null) return existing

    val token = UUID.randomUUID().toString()
    prefs.edit().putString(KEY_TOKEN, token).apply()
    return token
  }
}
