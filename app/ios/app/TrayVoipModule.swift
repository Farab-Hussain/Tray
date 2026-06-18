import Foundation
import React
import CallKit

@objc(TrayVoipModule)
class TrayVoipModule: RCTEventEmitter {

  private static weak var sharedInstance: TrayVoipModule?

  override init() {
    super.init()
    TrayVoipModule.sharedInstance = self
  }

  @objc override static func requiresMainQueueSetup() -> Bool { true }

  @objc override func supportedEvents() -> [String]! {
    ["CallKitCallAction"]
  }

  @objc static func emitCallKitAction(action: String, callId: String, payload: [String: String] = [:]) {
    var body: [String: String] = [
      "action": action,
      "callId": callId,
    ]
    for (key, value) in payload where key != "action" && key != "callId" {
      body[key] = value
    }
    sharedInstance?.sendEvent(withName: "CallKitCallAction", body: body)
  }

  @objc func getVoipToken(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    resolve(TrayVoipStorage.getVoipToken())
  }

  @objc func getPendingCallIntent(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    if let map = TrayVoipStorage.consumePendingCall() {
      resolve(map)
    } else {
      resolve(nil)
    }
  }

  @objc func hasActiveCallKitCall(_ callId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    resolve(TrayCallKitManager.shared.hasActiveCall(callId: callId))
  }

  @objc func endCallKitCall(_ callId: String, reason: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let endedReason: CXCallEndedReason
    switch reason {
    case "missed", "decline":
      endedReason = .unanswered
    case "failed":
      endedReason = .failed
    default:
      endedReason = .remoteEnded
    }
    TrayCallKitManager.shared.endCall(callId: callId, reason: endedReason)
    resolve(true)
  }

  @objc func presentIncomingCall(
    _ callId: String,
    callType: String,
    callerId: String,
    receiverId: String,
    callerName: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    TrayCallKitManager.shared.reportIncomingCall(
      callId: callId,
      callType: callType,
      callerId: callerId,
      receiverId: receiverId,
      callerName: callerName.isEmpty ? "Incoming Call" : callerName
    ) {
      resolve(true)
    }
  }

  @objc func presentOutgoingCall(
    _ callId: String,
    callType: String,
    callerId: String,
    receiverId: String,
    calleeName: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    TrayCallKitManager.shared.reportOutgoingCall(
      callId: callId,
      callType: callType,
      callerId: callerId,
      receiverId: receiverId,
      calleeName: calleeName.isEmpty ? "Outgoing Call" : calleeName
    ) { success in
      resolve(success)
    }
  }

  @objc func reportCallKitConnected(_ callId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    TrayCallKitManager.shared.reportCallConnected(callId: callId)
    resolve(true)
  }
}
