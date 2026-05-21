import Foundation

enum TrayVoipStorage {
  static let prefs = UserDefaults.standard
  static let voipTokenKey = "tray_voip_token"
  static let callIdKey = "tray_voip_call_id"
  static let callTypeKey = "tray_voip_call_type"
  static let callerIdKey = "tray_voip_caller_id"
  static let receiverIdKey = "tray_voip_receiver_id"
  static let actionKey = "tray_voip_action"

  static func saveVoipToken(_ token: String) {
    prefs.set(token, forKey: voipTokenKey)
  }

  static func getVoipToken() -> String? {
    prefs.string(forKey: voipTokenKey)
  }

  static func savePendingCall(
    callId: String,
    callType: String,
    callerId: String?,
    receiverId: String?,
    action: String
  ) {
    prefs.set(callId, forKey: callIdKey)
    prefs.set(callType, forKey: callTypeKey)
    prefs.set(action, forKey: actionKey)
    if let callerId { prefs.set(callerId, forKey: callerIdKey) }
    if let receiverId { prefs.set(receiverId, forKey: receiverIdKey) }
  }

  static func consumePendingCall() -> [String: String]? {
    guard let callId = prefs.string(forKey: callIdKey) else { return nil }
    var map: [String: String] = [
      "callId": callId,
      "callType": prefs.string(forKey: callTypeKey) ?? "audio",
      "action": prefs.string(forKey: actionKey) ?? "open",
    ]
    if let c = prefs.string(forKey: callerIdKey) { map["callerId"] = c }
    if let r = prefs.string(forKey: receiverIdKey) { map["receiverId"] = r }
    prefs.removeObject(forKey: callIdKey)
    prefs.removeObject(forKey: callTypeKey)
    prefs.removeObject(forKey: callerIdKey)
    prefs.removeObject(forKey: receiverIdKey)
    prefs.removeObject(forKey: actionKey)
    return map
  }
}
