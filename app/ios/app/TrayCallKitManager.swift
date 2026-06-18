import CallKit
import Foundation

final class TrayCallKitManager: NSObject {
  static let shared = TrayCallKitManager()

  private var provider: CXProvider?
  private let callController = CXCallController()
  private var uuidByCallId: [String: UUID] = [:]
  private var callIdByUUID: [UUID: String] = [:]
  private var payloadByCallId: [String: [String: String]] = [:]
  private var answeredCallIds = Set<String>()

  private override init() {
    super.init()
  }

  func configure() {
    let configuration = CXProviderConfiguration(localizedName: "Tray")
    configuration.maximumCallGroups = 1
    configuration.maximumCallsPerCallGroup = 1
    configuration.supportsVideo = true
    configuration.supportedHandleTypes = [.generic]
    configuration.includesCallsInRecents = false
    provider = CXProvider(configuration: configuration)
    provider?.setDelegate(self, queue: nil)
  }

  func reportIncomingCall(
    callId: String,
    callType: String,
    callerId: String,
    receiverId: String,
    callerName: String,
    completion: (() -> Void)?
  ) {
    if uuidByCallId[callId] != nil {
      completion?()
      return
    }

    let uuid = UUID()
    uuidByCallId[callId] = uuid
    callIdByUUID[uuid] = callId
    payloadByCallId[callId] = [
      "callId": callId,
      "callType": callType,
      "callerId": callerId,
      "receiverId": receiverId,
    ]

    let update = CXCallUpdate()
    update.remoteHandle = CXHandle(type: .generic, value: callerId.isEmpty ? callId : callerId)
    update.hasVideo = (callType == "video")
    update.localizedCallerName = callerName
    update.supportsHolding = false
    update.supportsGrouping = false
    update.supportsUngrouping = false
    update.supportsDTMF = false

    provider?.reportNewIncomingCall(with: uuid, update: update) { error in
      if let error = error {
        NSLog("❌ [CallKit] reportNewIncomingCall failed: \(error.localizedDescription)")
        self.removeTrackedCall(callId: callId, uuid: uuid)
      } else {
        NSLog("✅ [CallKit] Incoming call reported for \(callId)")
      }
      completion?()
    }
  }

  func hasActiveCall(callId: String) -> Bool {
    uuidByCallId[callId] != nil
  }

  func reportOutgoingCall(
    callId: String,
    callType: String,
    callerId: String,
    receiverId: String,
    calleeName: String,
    completion: ((Bool) -> Void)? = nil
  ) {
    if uuidByCallId[callId] != nil {
      completion?(true)
      return
    }

    let uuid = UUID()
    uuidByCallId[callId] = uuid
    callIdByUUID[uuid] = callId
    payloadByCallId[callId] = [
      "callId": callId,
      "callType": callType,
      "callerId": callerId,
      "receiverId": receiverId,
    ]

    let handle = CXHandle(type: .generic, value: receiverId.isEmpty ? callId : receiverId)
    let action = CXStartCallAction(call: uuid, handle: handle)
    action.isVideo = (callType == "video")
    action.contactIdentifier = calleeName

    callController.request(CXTransaction(action: action)) { error in
      if let error = error {
        NSLog("❌ [CallKit] Outgoing call failed: \(error.localizedDescription)")
        self.removeTrackedCall(callId: callId, uuid: uuid)
        completion?(false)
        return
      }

      self.provider?.reportOutgoingCall(with: uuid, startedConnectingAt: Date())
      NSLog("✅ [CallKit] Outgoing call started for \(callId)")
      completion?(true)
    }
  }

  func reportCallConnected(callId: String) {
    guard let uuid = uuidByCallId[callId] else { return }
    provider?.reportOutgoingCall(with: uuid, connectedAt: Date())
  }

  func endCall(callId: String?, reason: CXCallEndedReason = .remoteEnded) {
    DispatchQueue.main.async {
      if let callId = callId, !callId.isEmpty, let uuid = self.uuidByCallId[callId] {
        self.provider?.reportCall(with: uuid, endedAt: Date(), reason: reason)
        self.removeTrackedCall(callId: callId, uuid: uuid)
        NSLog("✅ [CallKit] Reported call ended for \(callId)")
        return
      }

      for (trackedCallId, uuid) in self.uuidByCallId {
        self.provider?.reportCall(with: uuid, endedAt: Date(), reason: reason)
        self.removeTrackedCall(callId: trackedCallId, uuid: uuid)
      }
      if !self.uuidByCallId.isEmpty {
        NSLog("✅ [CallKit] Reported all tracked calls ended")
      }
    }
  }

  private func removeTrackedCall(callId: String, uuid: UUID) {
    uuidByCallId.removeValue(forKey: callId)
    callIdByUUID.removeValue(forKey: uuid)
    payloadByCallId.removeValue(forKey: callId)
    answeredCallIds.remove(callId)
  }

  private func payload(for uuid: UUID) -> [String: String] {
    guard let callId = callIdByUUID[uuid] else { return [:] }
    return payloadByCallId[callId] ?? ["callId": callId]
  }
}

extension TrayCallKitManager: CXProviderDelegate {
  func providerDidReset(_ provider: CXProvider) {
    uuidByCallId.removeAll()
    callIdByUUID.removeAll()
    payloadByCallId.removeAll()
    answeredCallIds.removeAll()
  }

  func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
    action.fulfill()
  }

  func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    let callPayload = payload(for: action.callUUID)
    let callId = callPayload["callId"] ?? ""
    if !callId.isEmpty {
      answeredCallIds.insert(callId)
    }

    TrayVoipStorage.savePendingCall(
      callId: callId,
      callType: callPayload["callType"] ?? "audio",
      callerId: callPayload["callerId"],
      receiverId: callPayload["receiverId"],
      action: "accept"
    )
    TrayVoipModule.emitCallKitAction(
      action: "accept",
      callId: callId,
      payload: callPayload
    )
    action.fulfill()
  }

  func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
    let callPayload = payload(for: action.callUUID)
    let callId = callPayload["callId"] ?? ""
    let wasAnswered = answeredCallIds.contains(callId)
    let actionName = wasAnswered ? "end" : "decline"

    TrayVoipStorage.savePendingCall(
      callId: callId,
      callType: callPayload["callType"] ?? "audio",
      callerId: callPayload["callerId"],
      receiverId: callPayload["receiverId"],
      action: actionName
    )
    TrayVoipModule.emitCallKitAction(
      action: actionName,
      callId: callId,
      payload: callPayload
    )

    if let uuid = uuidByCallId[callId] {
      removeTrackedCall(callId: callId, uuid: uuid)
    }
    action.fulfill()
  }
}
