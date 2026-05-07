package com.tray

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.media.AudioAttributes
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.oney.WebRTCModule.WebRTCModuleOptions
import org.webrtc.audio.JavaAudioDeviceModule

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    
    // Initialize notification channels for incoming calls
    initializeNotificationChannels()
    
    // Configure WebRTC audio to use media category instead of call category
    // This must be done before WebRTCModule initializes
    val options = WebRTCModuleOptions.getInstance()
    val audioAttributes = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_MEDIA)
      .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
      .build()
    options.audioDeviceModule = JavaAudioDeviceModule.builder(this)
      .setAudioAttributes(audioAttributes)
      .createAudioDeviceModule()
    
    // Enable screen sharing support (optional)
    options.enableMediaProjectionService = true
    
    loadReactNative(this)
  }
  
  private fun initializeNotificationChannels() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val notificationManager = getSystemService(NotificationManager::class.java)
      
      // Incoming calls channel
      val incomingCallChannel = NotificationChannel(
        "incoming_calls",
        "Incoming Calls",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Handles incoming call notifications"
        enableVibration(true)
        setShowBadge(true)
        enableLights(true)
      }
      
      notificationManager.createNotificationChannel(incomingCallChannel)
    }
  }
}
