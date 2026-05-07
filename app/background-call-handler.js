/**
 * Background Call Handler for React Native
 * This file handles incoming calls when the app is in the background or killed state
 */

import { getFCMToken } from './src/services/notification.service';
import { listenIncomingCalls } from './src/services/call.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

let callListener = null;
let currentUserId = null;

// Initialize background call handling
const initializeBackgroundCallHandling = async () => {
  try {
    // Get current user ID from storage
    currentUserId = await AsyncStorage.getItem('currentUserId');
    if (!currentUserId) {
      console.log('📞 [Background] No user found, skipping call listener setup');
      return;
    }

    console.log('📞 [Background] Setting up call listener for user:', currentUserId);

    // Set up Firestore listener for incoming calls
    callListener = listenIncomingCalls(currentUserId, async (callId, callData) => {
      console.log('📞 [Background] ⚡ INCOMING CALL DETECTED!', {
        callId,
        callerId: callData.callerId,
        type: callData.type,
        status: callData.status,
      });

      // Create a local notification for the incoming call
      await createIncomingCallNotification(callId, callData);
    });

    console.log('✅ [Background] Call listener set up successfully');
  } catch (error) {
    console.error('❌ [Background] Error setting up call listener:', error);
  }
};

// Create local notification for incoming call
const createIncomingCallNotification = async (callId, callData) => {
  try {
    // Import React Native modules dynamically
    const { Platform } = require('react-native');
    const PushNotification = require('react-native-push-notification');

    const callType = callData.type === 'video' ? 'Video' : 'Audio';
    const title = `Incoming ${callType} Call`;
    const message = `Someone is calling you...`;

    // Configure notification
    PushNotification.configure({
      onNotification: function(notification) {
        if (notification.userInteraction) {
          console.log('📞 [Background] User interacted with call notification');
          // Navigate to call screen when user taps notification
          handleCallNotificationAction(callId, callData, 'accept');
        }
      },
      requestPermissions: Platform.OS === 'ios',
    });

    // Show incoming call notification
    PushNotification.localNotification({
      channelId: 'incoming-calls',
      title: title,
      message: message,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: 'high',
      ongoing: true, // Keep notification persistent
      actions: ['Accept', 'Decline'],
      userInfo: {
        callId: callId,
        callData: callData,
        type: 'incoming_call'
      }
    });

    console.log('✅ [Background] Call notification created');
  } catch (error) {
    console.error('❌ [Background] Error creating call notification:', error);
  }
};

// Handle notification actions (accept/decline)
const handleCallNotificationAction = async (callId, callData, action) => {
  try {
    console.log('📞 [Background] Handling call action:', action);

    if (action === 'accept') {
      // Navigate to call screen
      const { navigate } = require('./src/navigator/navigationRef');
      const screenName = callData.type === 'video' ? 'VideoCallingScreen' : 'CallingScreen';
      
      navigate('Screen', {
        screen: screenName,
        params: {
          callId,
          isCaller: false,
          callerId: callData.callerId,
          receiverId: currentUserId,
          autoAccept: true,
        },
      });
    } else if (action === 'decline') {
      // End the call
      const { endCall } = require('./src/services/call.service');
      await endCall(callId, 'missed');
    }
  } catch (error) {
    console.error('❌ [Background] Error handling call action:', error);
  }
};

// Cleanup function
const cleanup = () => {
  if (callListener) {
    callListener();
    callListener = null;
  }
  currentUserId = null;
};

// Export for use in index.js or App.js
module.exports = {
  initializeBackgroundCallHandling,
  cleanup,
};
