import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import FirebaseMessaging
import UserNotifications
import FBSDKCoreKit
import PushKit
import CallKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, PKPushRegistryDelegate, CXProviderDelegate {
  var window: UIWindow?
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  var callKitProvider: CXProvider?
  var pushRegistry: PKPushRegistry?
  private var activeCallUUID: UUID?
  private var activeCallPayload: [String: String] = [:]

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseApp.configure()
    Settings.shared.appID = "1062926749049"
    Settings.shared.clientToken = "b9857fc3912f5f51556932745d508d08"
    Settings.shared.displayName = "Tray"
    ApplicationDelegate.shared.application(application, didFinishLaunchingWithOptions: launchOptions)
    UNUserNotificationCenter.current().delegate = self
    application.registerForRemoteNotifications()
    setupPushKit()
    setupCallKit()

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

  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([.banner, .sound, .badge])
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
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

  func setupCallKit() {
    let configuration = CXProviderConfiguration(localizedName: "Tray")
    configuration.maximumCallGroups = 1
    configuration.maximumCallsPerCallGroup = 1
    configuration.supportsVideo = true
    configuration.supportedHandleTypes = [.generic]
    callKitProvider = CXProvider(configuration: configuration)
    callKitProvider?.setDelegate(self, queue: nil)
  }

  func pushRegistry(_ registry: PKPushRegistry, didUpdate credentials: PKPushCredentials, for type: PKPushType) {
    let token = credentials.token.map { String(format: "%02x", $0) }.joined()
    TrayVoipStorage.saveVoipToken(token)
  }

  func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
    TrayVoipStorage.prefs.removeObject(forKey: TrayVoipStorage.voipTokenKey)
  }

  func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType) {
    guard type == .voIP else { return }
    let dict = payload.dictionaryPayload
    guard let callId = dict["callId"] as? String else { return }
    let callType = (dict["callType"] as? String) ?? "audio"
    let callerId = dict["callerId"] as? String
    let receiverId = dict["receiverId"] as? String
    let callerName = (dict["callerName"] as? String) ?? "Incoming Call"

    activeCallUUID = UUID()
    activeCallPayload = [
      "callId": callId,
      "callType": callType,
      "callerId": callerId ?? "",
      "receiverId": receiverId ?? "",
    ]

    let update = CXCallUpdate()
    update.remoteHandle = CXHandle(type: .generic, value: callerId ?? callId)
    update.hasVideo = (callType == "video")
    update.localizedCallerName = callerName
    update.supportsHolding = false
    update.supportsGrouping = false
    update.supportsUngrouping = false
    update.supportsDTMF = false

    if let uuid = activeCallUUID {
      callKitProvider?.reportNewIncomingCall(with: uuid, update: update) { _ in }
    }
  }

  func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    TrayVoipStorage.savePendingCall(
      callId: activeCallPayload["callId"] ?? "",
      callType: activeCallPayload["callType"] ?? "audio",
      callerId: activeCallPayload["callerId"],
      receiverId: activeCallPayload["receiverId"],
      action: "accept"
    )
    action.fulfill()
  }

  func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
    TrayVoipStorage.savePendingCall(
      callId: activeCallPayload["callId"] ?? "",
      callType: activeCallPayload["callType"] ?? "audio",
      callerId: activeCallPayload["callerId"],
      receiverId: activeCallPayload["receiverId"],
      action: "decline"
    )
    action.fulfill()
  }

  func providerDidReset(_ provider: CXProvider) {}
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
