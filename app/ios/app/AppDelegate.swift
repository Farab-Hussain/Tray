import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import FirebaseMessaging
import UserNotifications
import FBSDKCoreKit
import PushKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, PKPushRegistryDelegate {
  var window: UIWindow?
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  var pushRegistry: PKPushRegistry?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseApp.configure()
    Settings.shared.appID = "1062926749049"
    Settings.shared.clientToken = "b9857fc3912f5f51556932745d508d08"
    Settings.shared.displayName = "FairChance"
    ApplicationDelegate.shared.application(application, didFinishLaunchingWithOptions: launchOptions)
    UNUserNotificationCenter.current().delegate = self
    application.registerForRemoteNotifications()
    setupPushKit()
    TrayCallKitManager.shared.configure()

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()
    reactNativeDelegate = delegate
    reactNativeFactory = factory
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(withModuleName: "app", in: window, launchOptions: launchOptions)
    return true
  }

  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Messaging.messaging().apnsToken = deviceToken
  }

  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    NSLog("❌ [APNS] Failed to register: \(error.localizedDescription)")
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    let userInfo = notification.request.content.userInfo
    if isCallNotification(userInfo) {
      completionHandler([])
      return
    }
    completionHandler([.banner, .sound, .badge])
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    let userInfo = response.notification.request.content.userInfo
    storeNotificationPayload(userInfo)
    completionHandler()
  }

  func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    return ApplicationDelegate.shared.application(app, open: url, options: options)
  }

  func setupPushKit() {
    pushRegistry = PKPushRegistry(queue: DispatchQueue.main)
    pushRegistry?.delegate = self
    pushRegistry?.desiredPushTypes = [.voIP]
  }

  func pushRegistry(_ registry: PKPushRegistry, didUpdate credentials: PKPushCredentials, for type: PKPushType) {
    guard type == .voIP else { return }
    let token = credentials.token.map { String(format: "%02x", $0) }.joined()
    TrayVoipStorage.saveVoipToken(token)
    NSLog("✅ [VoIP] PushKit token received")
  }

  func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
    TrayVoipStorage.prefs.removeObject(forKey: TrayVoipStorage.voipTokenKey)
  }

  func pushRegistry(
    _ registry: PKPushRegistry,
    didReceiveIncomingPushWith payload: PKPushPayload,
    for type: PKPushType,
    completion: @escaping () -> Void
  ) {
    handleVoipPush(payload: payload, type: type, completion: completion)
  }

  func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType) {
    handleVoipPush(payload: payload, type: type, completion: nil)
  }

  private func handleVoipPush(payload: PKPushPayload, type: PKPushType, completion: (() -> Void)?) {
    guard type == .voIP else {
      completion?()
      return
    }

    let dict = payload.dictionaryPayload
    guard let callId = stringValue(dict["callId"]) else {
      completion?()
      return
    }

    let callType = stringValue(dict["callType"]) ?? "audio"
    let callerId = stringValue(dict["callerId"]) ?? ""
    let receiverId = stringValue(dict["receiverId"]) ?? ""
    let callerName = stringValue(dict["callerName"]) ?? "Incoming Call"

    // App is open — use in-app CallingScreen instead of system CallKit UI.
    if UIApplication.shared.applicationState == .active {
      TrayVoipStorage.savePendingCall(
        callId: callId,
        callType: callType,
        callerId: callerId,
        receiverId: receiverId,
        action: "open"
      )
      completion?()
      return
    }

    TrayCallKitManager.shared.reportIncomingCall(
      callId: callId,
      callType: callType,
      callerId: callerId,
      receiverId: receiverId,
      callerName: callerName,
      completion: completion
    )
  }

  private func storeNotificationPayload(_ userInfo: [AnyHashable: Any]) {
    var data: [String: String] = [:]
    for (key, value) in userInfo {
      if let stringKey = key as? String, let stringValue = value as? String {
        data[stringKey] = stringValue
      }
    }

    if let nested = userInfo["data"] as? [String: Any] {
      for (key, value) in nested {
        if let stringKey = key as? String, let stringValue = value as? String {
          data[stringKey] = stringValue
        }
      }
    }

    if data["callId"] != nil {
      TrayVoipStorage.savePendingCall(
        callId: data["callId"] ?? "",
        callType: data["callType"] ?? "audio",
        callerId: data["callerId"],
        receiverId: data["receiverId"],
        action: "open"
      )
    }
  }

  private func isCallNotification(_ userInfo: [AnyHashable: Any]) -> Bool {
    if stringValue(userInfo["type"]) == "call" { return true }
    if stringValue(userInfo["callId"]) != nil { return true }
    if let nested = userInfo["data"] as? [String: Any] {
      if stringValue(nested["type"]) == "call" { return true }
      if stringValue(nested["callId"]) != nil { return true }
    }
    return false
  }

  private func stringValue(_ value: Any?) -> String? {
    if let string = value as? String { return string }
    if let number = value as? NSNumber { return number.stringValue }
    return nil
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? { bundleURL() }
  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
