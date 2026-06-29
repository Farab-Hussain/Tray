/**
 * Audio Session Manager for Call Accept/Reject Fix
 * 
 * This utility handles audio session conflicts and ensures proper
 * audio routing during call operations.
 */

import { Platform } from 'react-native';

let InCallManager: any = null;
try {
  InCallManager = require('react-native-incall-manager').default;
} catch (error) {
  console.warn('⚠️ [AudioSession] InCallManager not available:', error);
}

export class AudioSessionManager {
  private static isSessionActive = false;
  private static pendingOperations: Array<() => void> = [];
  /** Tracked locally — InCallManager.getSpeakerphoneOn is not available on all platforms. */
  private static speakerOn = false;

  /**
   * Initialize audio session for calls
   */
  static async initializeForCall(isVideo: boolean = false) {
    if (!InCallManager) {
      console.warn('⚠️ [AudioSession] InCallManager not available');
      return;
    }

    try {
      console.log('🎤 [AudioSession] Initializing audio session for call');
      
      // Configure audio session for voice calls
      await InCallManager.start({
        media: isVideo ? 'video' : 'audio',
        auto: true,
      });

      // Configure audio routing
      if (isVideo) {
        this.speakerOn = true;
        InCallManager.setForceSpeakerphoneOn(true);
        InCallManager.setSpeakerphoneOn(true);
        console.log('🔊 [AudioSession] Speakerphone enabled for video call');
      } else {
        this.speakerOn = false;
        if (Platform.OS === 'ios') {
          // On iOS, use earpiece by default for audio calls
          InCallManager.setForceSpeakerphoneOn(false);
          InCallManager.setSpeakerphoneOn(false);
          console.log('👂 [AudioSession] Earpiece enabled for audio call (iOS)');
        } else {
          // On Android, configure for voice calls
          InCallManager.setForceSpeakerphoneOn(false);
          InCallManager.setSpeakerphoneOn(false);
          console.log('👂 [AudioSession] Earpiece configured for audio call (Android)');
        }
        if (typeof InCallManager.setProximitySensorEnabled === 'function') {
          InCallManager.setProximitySensorEnabled(true);
          console.log('📱 [AudioSession] Proximity sensor enabled');
        }
      }

      this.isSessionActive = true;
      console.log('✅ [AudioSession] Audio session initialized successfully');
    } catch (error: any) {
      console.error('❌ [AudioSession] Error initializing audio session:', error);
      throw error;
    }
  }

  /**
   * Stop audio session
   */
  static async stopSession() {
    if (!InCallManager || !this.isSessionActive) {
      return;
    }

    try {
      console.log('🔇 [AudioSession] Stopping audio session');
      
      if (typeof InCallManager.setProximitySensorEnabled === 'function') {
        InCallManager.setProximitySensorEnabled(false);
      }

      await InCallManager.stop();
      this.isSessionActive = false;
      this.speakerOn = false;
      
      // Process any pending operations
      this.pendingOperations.forEach(operation => {
        try {
          operation();
        } catch (error) {
          console.warn('⚠️ [AudioSession] Error in pending operation:', error);
        }
      });
      this.pendingOperations = [];
      
      console.log('✅ [AudioSession] Audio session stopped successfully');
    } catch (error: any) {
      console.error('❌ [AudioSession] Error stopping audio session:', error);
    }
  }

  /**
   * Set microphone mute state
   */
  static async setMicrophoneMute(muted: boolean) {
    if (!InCallManager) {
      return;
    }

    try {
      await InCallManager.setMicrophoneMute(muted);
      console.log(`🎤 [AudioSession] Microphone ${muted ? 'muted' : 'unmuted'}`);
    } catch (error: any) {
      console.error('❌ [AudioSession] Error setting microphone mute:', error);
    }
  }

  /**
   * Toggle speakerphone
   */
  static isSpeakerOn(): boolean {
    return this.speakerOn;
  }

  static async toggleSpeakerphone(): Promise<boolean> {
    if (!InCallManager) {
      return this.speakerOn;
    }

    try {
      const newState = !this.speakerOn;
      InCallManager.setForceSpeakerphoneOn(newState);
      InCallManager.setSpeakerphoneOn(newState);
      this.speakerOn = newState;
      console.log(`🔊 [AudioSession] Speakerphone ${newState ? 'on' : 'off'}`);
      return newState;
    } catch (error: any) {
      console.error('❌ [AudioSession] Error toggling speakerphone:', error);
      return this.speakerOn;
    }
  }

  /**
   * Add operation to queue (for session conflicts)
   */
  static addPendingOperation(operation: () => void) {
    this.pendingOperations.push(operation);
  }

  /**
   * Check if session is active
   */
  static isActive(): boolean {
    return this.isSessionActive;
  }

  /**
   * Force reconfigure audio session (for recovery)
   */
  static async reconfigure() {
    if (!this.isSessionActive) {
      return;
    }

    try {
      console.log('🔄 [AudioSession] Reconfiguring audio session');
      
      // Stop and restart session
      await InCallManager.stop();
      
      // Small delay before restarting
      setTimeout(async () => {
        try {
          await InCallManager.start({ media: 'audio', auto: true });
          InCallManager.setForceSpeakerphoneOn(false);
          console.log('✅ [AudioSession] Audio session reconfigured');
        } catch (error) {
          console.error('❌ [AudioSession] Error reconfiguring session:', error);
        }
      }, 100);
    } catch (error: any) {
      console.error('❌ [AudioSession] Error in reconfigure:', error);
    }
  }
}
