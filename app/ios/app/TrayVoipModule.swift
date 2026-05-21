import Foundation
import React

@objc(TrayVoipModule)
class TrayVoipModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { false }

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
}
