import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import UserNotifications
import FBSDKCoreKit
import PushKit
import CallKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, PKPushRegistryDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  
  // CallKit and PushKit
  var callKitProvider: CXProvider?
  var pushRegistry: PKPushRegistry?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Configure Firebase - must be called before React Native initializes
    FirebaseApp.configure()
    
    // Initialize Facebook SDK
    // Set App ID programmatically as fallback (also configured in Info.plist)
    Settings.shared.appID = "1062926749049"
    Settings.shared.clientToken = "b9857fc3912f5f51556932745d508d08"
    Settings.shared.displayName = "Tray"
    
    ApplicationDelegate.shared.application(
      application,
      didFinishLaunchingWithOptions: launchOptions
    )
    
    // Set up push notification delegate
    UNUserNotificationCenter.current().delegate = self
    
    // Register for remote notifications
    application.registerForRemoteNotifications()
    
    // Initialize PushKit for VoIP calls
    setupPushKit()
    
    // Initialize CallKit
    setupCallKit()
    
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "app",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
  
  // Handle registration for remote notifications
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    // React Native Firebase handles this automatically
    print("✅ [AppDelegate] Registered for remote notifications")
  }
  
  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("❌ [AppDelegate] Failed to register for remote notifications: \(error.localizedDescription)")
  }
  
  // Handle notifications when app is in foreground
  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    // Show notification even when app is in foreground
    completionHandler([.banner, .sound, .badge])
  }
  
  // Handle notification tap
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    // React Native Firebase handles this automatically
    completionHandler()
  }
  
  // Handle Facebook SDK URL opening
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return ApplicationDelegate.shared.application(app, open: url, options: options)
  }
  
  // MARK: - PushKit and CallKit Setup
  
  func setupPushKit() {
    pushRegistry = PKPushRegistry(queue: DispatchQueue.main)
    pushRegistry?.delegate = self
    pushRegistry?.desiredPushTypes = [.voIP]
    print("✅ [AppDelegate] PushKit configured for VoIP calls")
  }
  
  func setupCallKit() {
    let configuration = CXProviderConfiguration(localizedName: "Tray")
    configuration.maximumCallGroups = 1
    configuration.maximumCallsPerCallGroup = 1
    configuration.supportsVideo = true
    configuration.supportedHandleTypes = [.generic]
    
    callKitProvider = CXProvider(configuration: configuration)
    print("✅ [AppDelegate] CallKit configured")
  }
  
  // MARK: - PKPushRegistryDelegate
  
  func pushRegistry(_ registry: PKPushRegistry, didUpdate credentials: PKPushCredentials, for type: PKPushType) {
    print("📱 [AppDelegate] PushKit credentials updated")
  }
  
  func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
    print("⚠️ [AppDelegate] PushKit token invalidated")
  }
  
  func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType) {
    if type == .voIP {
      print("📞 [AppDelegate] ⚡ VoIP push received!")
      
      guard let dictionary = payload.dictionaryPayload,
            let callId = dictionary["callId"] as? String,
            let callType = dictionary["callType"] as? String else {
        print("❌ [AppDelegate] Invalid VoIP push payload")
        return
      }
      
      // Report incoming call to CallKit
      let update = CXCallUpdate()
      update.remoteHandle = CXHandle(type: .generic, value: callId)
      update.hasVideo = (callType == "video")
      update.localizedCallerName = "Incoming Call"
      update.supportsHolding = false
      update.supportsGrouping = false
      update.supportsUngrouping = false
      update.supportsDTMF = false
      
      callKitProvider?.reportNewIncomingCall(with: UUID(), update: update) { error in
        if let error = error {
          print("❌ [AppDelegate] Error reporting incoming call: \(error.localizedDescription)")
        } else {
          print("✅ [AppDelegate] Incoming call reported to CallKit")
        }
      }
    }
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
