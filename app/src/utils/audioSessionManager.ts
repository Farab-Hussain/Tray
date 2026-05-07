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
      if (Platform.OS === 'ios') {
        // On iOS, use earpiece by default for calls
        InCallManager.setForceSpeakerphoneOn(false);
        InCallManager.setSpeakerphoneOn(false);
      } else {
        // On Android, configure for voice calls
        InCallManager.setForceSpeakerphoneOn(false);
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
      
      await InCallManager.stop();
      this.isSessionActive = false;
      
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
  static async toggleSpeakerphone() {
    if (!InCallManager) {
      return;
    }

    try {
      const currentState = await InCallManager.getSpeakerphoneOn();
      const newState = !currentState;
      
      await InCallManager.setSpeakerphoneOn(newState);
      console.log(`🔊 [AudioSession] Speakerphone ${newState ? 'on' : 'off'}`);
      
      return newState;
    } catch (error: any) {
      console.error('❌ [AudioSession] Error toggling speakerphone:', error);
      return false;
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
