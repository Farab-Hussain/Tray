// Avoid static import from 'react-native-webrtc' because it throws if pods aren't installed
import { Alert, Platform } from 'react-native';
import { getIceServers } from '../config/webrtc.config';

// Export ICE servers for use in peer connection
// Configuration is managed in app/src/config/webrtc.config.ts
// See docs/COTURN_SETUP.md for setup instructions
export const iceServers = getIceServers();

export interface CreatePeerParams {
  isCaller: boolean;
  audioOnly?: boolean;
  onLocalStream?: (s: any) => void;
  onRemoteStream?: (s: any) => void;
  onIce?: (c: any) => void;
  onConnectionStateChange?: (state: string) => void;
  onIceConnectionStateChange?: (state: string) => void;
  onError?: (error: string) => void;
  offerSdp?: any;
}

export async function createPeer({ 
  isCaller, 
  audioOnly, 
  onLocalStream, 
  onRemoteStream, 
  onIce, 
  onConnectionStateChange,
  onIceConnectionStateChange,
  onError,
  offerSdp 
}: CreatePeerParams) {
  let RTCPeerConnection: any, mediaDevices: any;
  try {
    const rnWebRTC = require('react-native-webrtc');
    RTCPeerConnection = rnWebRTC.RTCPeerConnection;
    mediaDevices = rnWebRTC.mediaDevices;
  } catch {
    const installHint = Platform.OS === 'ios'
      ? 'Run: cd ios && export LANG=en_US.UTF-8 && export LC_ALL=en_US.UTF-8 && pod install, then rebuild the app.'
      : 'Rebuild the app to link native modules.';
    Alert.alert('WebRTC native module not found', installHint);
    throw new Error('WebRTC native module missing');
  }

  // Log ICE server configuration for debugging
  if (__DEV__) {
    console.log('🌐 [ICE] Configuring peer connection with ICE servers:');
    iceServers.forEach((server, index) => {
      if (server.urls) {
        const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
        console.log(`🌐 [ICE]   Server ${index + 1}: ${urls.join(', ')}`);
        if (server.username) {
          console.log(`🌐 [ICE]     Username: ${server.username}`);
        }
      }
    });
  }
  
  // Create peer connection with better configuration
  const pc = new RTCPeerConnection({
    iceServers,
    iceCandidatePoolSize: 0, // Set to 0 to avoid pre-gathering (can cause delays if TURN servers are slow)
    bundlePolicy: 'max-bundle', // Bundle RTP and RTCP for efficiency
    rtcpMuxPolicy: 'require',
    // Add ICE transport policy to prefer direct connections but allow relay
    // This helps when TURN servers are slow or unavailable
    iceTransportPolicy: 'all', // Try all: host, srflx, and relay (default)
  });
  
  if (__DEV__) {
    console.log('✅ [ICE] Peer connection created with ICE server configuration');
  }

  // Monitor ICE connection state changes for debugging
  let iceStateCheckCount = 0;
  let iceStateCheckInterval: any = null;
  
  const startIceStateMonitoring = () => {
    if (iceStateCheckInterval) {
      clearInterval(iceStateCheckInterval);
    }
    iceStateCheckCount = 0;
    iceStateCheckInterval = setInterval(() => {
      const currentState = pc.iceConnectionState;
      if (currentState === 'checking' || currentState === 'new') {
        iceStateCheckCount++;
        if (iceStateCheckCount > 10) { // After 20 seconds (2s * 10)
          console.warn(`⚠️ [ICE] Still in ${currentState} state after ${iceStateCheckCount * 2} seconds`);
          console.warn(`⚠️ [ICE] This may indicate TURN server connectivity issues or network problems.`);
          console.warn(`⚠️ [ICE] Check network connectivity and TURN server configuration.`);
        }
      } else {
        if (iceStateCheckInterval) {
          clearInterval(iceStateCheckInterval);
          iceStateCheckInterval = null;
        }
      }
    }, 2000);
  };
  
  // Start monitoring when peer connection is created
  startIceStateMonitoring();
  
  pc.addEventListener('iceconnectionstatechange', () => {
    const state = pc.iceConnectionState;
    if (iceStateCheckInterval) {
      clearInterval(iceStateCheckInterval);
      iceStateCheckInterval = null;
    }
    console.log(`🌐 [ICE] State changed to: ${state}`);
    
    // Notify callback
    onIceConnectionStateChange?.(state);
    
    if (state === 'connected' || state === 'completed') {
      console.log(`✅ [ICE] ✅✅✅ CONNECTION ESTABLISHED SUCCESSFULLY ✅✅✅`);
      console.log(`✅ [ICE] Media should now be flowing between peers!`);
    } else if (state === 'failed') {
      const errorMsg = 'ICE connection failed. TURN servers may be unreachable or devices are behind incompatible NATs.';
      console.error(`🚨 [ICE] ❌❌❌ CONNECTION FAILED ❌❌❌`);
      console.error(`🚨 [ICE] This usually indicates a NAT/firewall traversal issue.`);
      console.error(`🚨 [ICE] Possible causes:`);
      console.error(`🚨 [ICE]   1. TURN servers are not reachable or misconfigured (MOST LIKELY)`);
      console.error(`🚨 [ICE]   2. Both devices are behind symmetric NATs`);
      console.error(`🚨 [ICE]   3. Firewall blocking UDP/TCP traffic`);
      console.error(`🚨 [ICE]   4. Network connectivity issues`);
      console.error(`🚨 [ICE]   5. Free TURN servers are down or rate-limited`);
      console.error(`🚨 [ICE]`);
      console.error(`🚨 [ICE] If you see "0 relay" candidates in the summary above, TURN servers are not working.`);
      console.error(`🚨 [ICE] For production, use a reliable paid TURN service (Twilio, Metered.ca, Xirsys, or self-hosted).`);
      onError?.(errorMsg);
    } else if (state === 'disconnected') {
      console.warn(`⚠️ [ICE] Connection disconnected - attempting to reconnect...`);
      // Restart monitoring if disconnected
      startIceStateMonitoring();
    } else if (state === 'closed') {
      console.log(`🔒 [ICE] Connection closed.`);
    } else if (state === 'checking' || state === 'new') {
      // Restart monitoring if back to checking/new
      startIceStateMonitoring();
    }
  });

  // Get user media with better constraints
  const constraints: any = audioOnly
    ? {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false
    }
    : {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
        frameRate: { ideal: 30 },
      }
    };

  const stream = await mediaDevices.getUserMedia(constraints);

  // Ensure all video tracks are enabled
  stream.getVideoTracks().forEach((t: any) => {
    t.enabled = true;
    if (__DEV__) {
      console.log(`📹 Local video track enabled:`, t.id);
    }
  });

  // 🎧 Step 1: Confirm Local Audio Track Is Active
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    console.error('❌ [Audio Debug] No audio tracks found in local stream!');
  } else {
    audioTracks.forEach((audioTrack: any, index: number) => {
      console.log(`🎤 [Audio Debug] Audio track ${index + 1}/${audioTracks.length}:`, {
        id: audioTrack.id,
        enabled: audioTrack.enabled,
        readyState: audioTrack.readyState,
        kind: audioTrack.kind,
        label: audioTrack.label,
      });
      
      // Get audio track settings
      // Note: getSettings() may return undefined values on React Native WebRTC
      // This is normal and doesn't indicate a problem
      try {
        const settings = audioTrack.getSettings();
        const settingsInfo: any = {};
        if (settings.sampleRate !== undefined) settingsInfo.sampleRate = settings.sampleRate;
        if (settings.channelCount !== undefined) settingsInfo.channelCount = settings.channelCount;
        if (settings.echoCancellation !== undefined) settingsInfo.echoCancellation = settings.echoCancellation;
        if (settings.noiseSuppression !== undefined) settingsInfo.noiseSuppression = settings.noiseSuppression;
        if (settings.autoGainControl !== undefined) settingsInfo.autoGainControl = settings.autoGainControl;
        if (settings.deviceId !== undefined) settingsInfo.deviceId = settings.deviceId;
        if (settings.groupId !== undefined) settingsInfo.groupId = settings.groupId;
        
        if (Object.keys(settingsInfo).length > 0) {
          console.log(`🎤 [Audio Debug] Audio track ${index + 1} settings:`, settingsInfo);
        } else {
          console.log(`🎤 [Audio Debug] Audio track ${index + 1} settings: (not available - this is normal for React Native WebRTC)`);
        }
      } catch (error: any) {
        console.warn(`⚠️ [Audio Debug] Could not get audio track settings:`, error.message);
      }
      
      // Ensure audio track is enabled
      if (!audioTrack.enabled) {
        console.warn(`⚠️ [Audio Debug] Audio track ${index + 1} was disabled, enabling now...`);
        audioTrack.enabled = true;
      }
      
      // Monitor audio track state changes
      audioTrack.addEventListener('ended', () => {
        console.warn(`⚠️ [Audio Debug] Audio track ${index + 1} ended!`);
      });
      
      audioTrack.addEventListener('mute', () => {
        console.warn(`⚠️ [Audio Debug] Audio track ${index + 1} muted!`);
      });
      
      audioTrack.addEventListener('unmute', () => {
        console.log(`✅ [Audio Debug] Audio track ${index + 1} unmuted`);
      });
    });
  }

  // Add tracks to peer connection
  stream.getTracks().forEach((t: any) => {
    pc.addTrack(t, stream);
    // Log track info for debugging
    if (__DEV__) {
      console.log(`📹 Added ${t.kind} track:`, t.enabled ? 'enabled' : 'disabled', t.id);
    }
  });

  onLocalStream?.(stream);

  // Handle remote stream - collect tracks and create stream
  let remoteStream: any = null;

  pc.ontrack = (e: any) => {
    // Handle both e.streams[0] and e.track scenarios
    let track = e.track;
    let eventStream = e.streams?.[0];

    if (!track) {
      if (__DEV__) {
        console.warn('⚠️ ontrack event received without track');
      }
      return;
    }

    // Ensure video tracks are enabled
    if (track.kind === 'video') {
      track.enabled = true;
      if (__DEV__) {
        console.log('📹 Remote video track received:', track.id);
      }
    } else if (track.kind === 'audio') {
      track.enabled = true;
      if (__DEV__) {
        console.log('🎤 [Audio Debug] Remote audio track received:', {
          id: track.id,
          enabled: track.enabled,
          readyState: track.readyState,
          label: track.label,
        });
        
        // Get remote audio track settings
        // Note: getSettings() often returns undefined for remote tracks on React Native WebRTC
        // This is normal and doesn't indicate a problem
        try {
          const settings = track.getSettings();
          const settingsInfo: any = {};
          if (settings.sampleRate !== undefined) settingsInfo.sampleRate = settings.sampleRate;
          if (settings.channelCount !== undefined) settingsInfo.channelCount = settings.channelCount;
          if (settings.echoCancellation !== undefined) settingsInfo.echoCancellation = settings.echoCancellation;
          if (settings.noiseSuppression !== undefined) settingsInfo.noiseSuppression = settings.noiseSuppression;
          if (settings.autoGainControl !== undefined) settingsInfo.autoGainControl = settings.autoGainControl;
          
          if (Object.keys(settingsInfo).length > 0) {
            console.log('🎤 [Audio Debug] Remote audio track settings:', settingsInfo);
          } else {
            console.log('🎤 [Audio Debug] Remote audio track settings: (not available - this is normal for remote tracks)');
          }
        } catch (error: any) {
          console.warn('⚠️ [Audio Debug] Could not get remote audio track settings:', error.message);
        }
      }
    }

        // Prefer using the stream from e.streams[0] if available
    if (eventStream) {
      // If we don't have a remote stream yet, use this one
      if (!remoteStream) {
        remoteStream = eventStream;
        if (__DEV__) {
          const videoTracks = eventStream.getVideoTracks();
          const eventAudioTracks = eventStream.getAudioTracks();
            console.log('📹 Remote stream created (from e.streams[0]):', {
            streamId: eventStream.id,
            totalTracks: eventStream.getTracks().length,
            videoTracks: videoTracks.length,
            audioTracks: eventAudioTracks.length,
          });
          
          // 🔎 Step 3: Verify Remote Audio Tracks
          console.log('🔎 [Audio Debug] Remote stream audio tracks count:', eventAudioTracks.length);
          if (eventAudioTracks.length === 0) {
            console.error('❌ [Audio Debug] WARNING: Remote stream has no audio tracks!');
          } else {
            eventAudioTracks.forEach((t: any, index: number) => {
              console.log(`🔎 [Audio Debug] Remote audio track ${index + 1}:`, {
                id: t.id,
                enabled: t.enabled,
                readyState: t.readyState,
              });
              // Ensure enabled
              t.enabled = true;
            });
          }
        }
        onRemoteStream?.(remoteStream);
      } else if (remoteStream.id === eventStream.id) {
        // Same stream ID - check if stream has more tracks now
        const currentTrackCount = remoteStream.getTracks().length;
        const streamTrackCount = eventStream.getTracks().length;
        const existingTrack = remoteStream.getTracks().find((t: any) => t.id === track.id);
        
        // If stream has more tracks than our tracked stream, update our reference
        if (streamTrackCount > currentTrackCount) {
          // Stream object has been updated with new tracks - use the updated stream
          remoteStream = eventStream;
          // Ensure all tracks are enabled
          remoteStream.getVideoTracks().forEach((t: any) => { t.enabled = true; });
          remoteStream.getAudioTracks().forEach((t: any) => { 
            t.enabled = true;
            if (__DEV__) {
              console.log('🎤 [Audio Debug] Remote audio track enabled in updated stream:', {
                id: t.id,
                enabled: t.enabled,
                readyState: t.readyState,
              });
            }
          });
          if (__DEV__) {
            const videoTracks = remoteStream.getVideoTracks();
            const updatedAudioTracks = remoteStream.getAudioTracks();
            console.log(`📹 Stream updated with new tracks (stream had ${streamTrackCount} vs ${currentTrackCount}):`, {
              streamId: remoteStream.id,
              totalTracks: remoteStream.getTracks().length,
              videoTracks: videoTracks.length,
              audioTracks: updatedAudioTracks.length,
            });
            
            // 🔎 Step 3: Verify Remote Audio Tracks
            console.log('🔎 [Audio Debug] Remote stream audio tracks count:', updatedAudioTracks.length);
            if (updatedAudioTracks.length === 0) {
              console.error('❌ [Audio Debug] WARNING: Remote stream has no audio tracks!');
            } else {
              updatedAudioTracks.forEach((t: any, index: number) => {
                console.log(`🔎 [Audio Debug] Remote audio track ${index + 1}:`, {
                  id: t.id,
                  enabled: t.enabled,
                  readyState: t.readyState,
                });
              });
            }
          }
          onRemoteStream?.(remoteStream);
        } else if (!existingTrack) {
          // Track not in our stream yet - use the stream from event if it has the track
          // Otherwise add it manually
          if (eventStream && eventStream.getTracks().length > remoteStream.getTracks().length) {
            // Use the updated stream from the event
            remoteStream = eventStream;
            if (__DEV__) {
              const videoTracks = remoteStream.getVideoTracks();
              const addedAudioTracks = remoteStream.getAudioTracks();
              console.log(`📹 Using updated stream from event (ID: ${remoteStream.id}):`, {
                streamId: remoteStream.id,
                totalTracks: remoteStream.getTracks().length,
                videoTracks: videoTracks.length,
                audioTracks: addedAudioTracks.length,
              });
            }
          } else {
            // Add track manually if stream from event doesn't have it
            remoteStream.addTrack(track);
            if (__DEV__) {
              console.log(`📹 Added ${track.kind} track to existing remote stream:`, track.id);
              const videoTracks = remoteStream.getVideoTracks();
              const manualAudioTracks = remoteStream.getAudioTracks();
              console.log('📹 Remote stream updated:', {
                streamId: remoteStream.id,
                totalTracks: remoteStream.getTracks().length,
                videoTracks: videoTracks.length,
                audioTracks: manualAudioTracks.length,
              });
            }
          }
          onRemoteStream?.(remoteStream);
        } else {
          // Track already exists - ensure it's enabled and notify if it's a video track
          if (track.kind === 'video') {
            existingTrack.enabled = true;
            if (__DEV__) {
              console.log(`📹 Video track already in stream, ensuring enabled:`, track.id);
            }
            // Always notify for video tracks to ensure UI updates
            // Use the stream from the event if it has more tracks, otherwise use existing stream
            if (eventStream && eventStream.getTracks().length > remoteStream.getTracks().length) {
              remoteStream = eventStream;
              if (__DEV__) {
                console.log(`📹 Using updated stream from event (ID: ${remoteStream.id}) with ${remoteStream.getTracks().length} tracks`);
              }
            }
            onRemoteStream?.(remoteStream);
          }
        }
      } else {
        // Different stream ID - this shouldn't happen normally, but handle it
        if (__DEV__) {
          console.warn('⚠️ Received track with different stream ID:', {
            existingStreamId: remoteStream.id,
            newStreamId: eventStream.id,
            trackKind: track.kind,
          });
        }
        // Add track to existing stream anyway
        const existingTrack = remoteStream.getTracks().find((t: any) => t.id === track.id);
        if (!existingTrack) {
          remoteStream.addTrack(track);
          onRemoteStream?.(remoteStream);
        }
      }
    } else {
      // No stream in event - create or update our own stream
      if (!remoteStream) {
        const rnWebRTC = require('react-native-webrtc');
        const MediaStream = rnWebRTC.MediaStream;
        remoteStream = new MediaStream();
        remoteStream.addTrack(track);
        if (__DEV__) {
          console.log('📹 Created new remote stream from track:', {
            streamId: remoteStream.id,
            trackKind: track.kind,
            trackId: track.id,
          });
          
          // 🔎 Step 3: Verify Remote Audio Tracks for newly created stream
          if (track.kind === 'audio') {
            const newStreamAudioTracks = remoteStream.getAudioTracks();
            console.log('🔎 [Audio Debug] Remote stream audio tracks count:', newStreamAudioTracks.length);
            newStreamAudioTracks.forEach((t: any, index: number) => {
              console.log(`🔎 [Audio Debug] Remote audio track ${index + 1}:`, {
                id: t.id,
                enabled: t.enabled,
                readyState: t.readyState,
              });
            });
          }
        }
        onRemoteStream?.(remoteStream);
      } else {
        // Add track to existing stream if not already present
        const existingTrack = remoteStream.getTracks().find((t: any) => t.id === track.id);
        if (!existingTrack) {
          remoteStream.addTrack(track);
          if (__DEV__) {
            const videoTracks = remoteStream.getVideoTracks();
            const finalAudioTracks = remoteStream.getAudioTracks();
            console.log(`📹 Added ${track.kind} track to remote stream (no stream in event):`, {
              streamId: remoteStream.id,
              trackId: track.id,
              totalTracks: remoteStream.getTracks().length,
              videoTracks: videoTracks.length,
              audioTracks: finalAudioTracks.length,
            });
            
            // 🔎 Step 3: Verify Remote Audio Tracks after adding
            if (track.kind === 'audio') {
              console.log('🔎 [Audio Debug] Remote stream audio tracks count:', finalAudioTracks.length);
              finalAudioTracks.forEach((t: any, index: number) => {
                console.log(`🔎 [Audio Debug] Remote audio track ${index + 1}:`, {
                  id: t.id,
                  enabled: t.enabled,
                  readyState: t.readyState,
                });
              });
            }
          }
          // Always notify when tracks are added
          onRemoteStream?.(remoteStream);
        } else {
          // Track already exists - for video tracks, ensure enabled and notify
          if (track.kind === 'video') {
            existingTrack.enabled = true;
            if (__DEV__) {
              console.log(`📹 Video track already in stream (no stream in event), ensuring enabled:`, track.id);
            }
            onRemoteStream?.(remoteStream);
          }
        }
      }
    }
  };

  // Handle ICE candidates
  let candidateCount = 0;
  let hostCandidateCount = 0;
  let srflxCandidateCount = 0;
  let relayCandidateCount = 0;
  let prflxCandidateCount = 0;
  let iceGatheringComplete = false;
  let iceGatheringTimeout: any = null;
  
  // Set a timeout for ICE gathering - if TURN servers are slow, proceed anyway
  const ICE_GATHERING_TIMEOUT = 15000; // 15 seconds
  iceGatheringTimeout = setTimeout(() => {
    if (!iceGatheringComplete && pc.iceGatheringState !== 'complete') {
      if (__DEV__) {
        console.warn(`⚠️ [ICE] ICE gathering timeout after ${ICE_GATHERING_TIMEOUT}ms`);
        console.warn(`⚠️ [ICE] Proceeding with available candidates (${candidateCount} total)`);
        console.warn(`⚠️ [ICE] TURN servers may be slow or unreachable, but connection may still work with host/srflx candidates`);
      }
      // Force ICE gathering to complete if possible
      // Note: We can't actually force it, but we can log that we're proceeding
    }
  }, ICE_GATHERING_TIMEOUT);
  
  pc.addEventListener('icecandidate', (e: any) => {
    if (e.candidate) {
      candidateCount++;
      if (__DEV__) {
        // Parse candidate type from candidate string
        const candidateStr = e.candidate.candidate || '';
        let candidateType = 'unknown';
        let ip = 'unknown';
        let port = 'unknown';
        let protocol = 'unknown';
        
        // Parse candidate string format: "candidate:1 1 udp 2130706431 192.168.1.1 54321 typ host"
        // or: "candidate:1 1 tcp 1518280447 192.168.1.1 54321 typ host tcptype active"
        const parts = candidateStr.split(' ');
        if (parts.length >= 6) {
          protocol = parts[2] || 'unknown'; // udp or tcp
          ip = parts[4] || 'unknown';
          port = parts[5] || 'unknown';
        }
        
        // Determine candidate type
        if (candidateStr.includes(' typ host')) {
          candidateType = 'host (local)';
          hostCandidateCount++;
        } else if (candidateStr.includes(' typ srflx')) {
          candidateType = 'srflx (STUN-reflexive)';
          srflxCandidateCount++;
        } else if (candidateStr.includes(' typ relay')) {
          candidateType = 'relay (TURN)';
          relayCandidateCount++;
        } else if (candidateStr.includes(' typ prflx')) {
          candidateType = 'prflx (peer-reflexive)';
          prflxCandidateCount++;
        }
        
        // Extract IP address for logging (fallback if parsing failed)
        if (ip === 'unknown') {
          const ipMatch = candidateStr.match(/(\d+\.\d+\.\d+\.\d+|\[?[0-9a-fA-F:]+]?)/);
          ip = ipMatch ? ipMatch[1] : 'unknown';
        }
        
        console.log(`🧊 [ICE] Candidate #${candidateCount} [${candidateType}] ${protocol}://${ip}:${port} - ${candidateStr.substring(0, 100)}`);
        
        // Log TURN relay candidates specifically with more detail
        if (candidateType === 'relay (TURN)') {
          console.log('✅ [ICE] ✅✅✅ TURN RELAY CANDIDATE DETECTED ✅✅✅');
          console.log('✅ [ICE] TURN servers are working! This candidate will be used if direct P2P connection fails.');
          console.log(`✅ [ICE] Relay candidate details: ${protocol}://${ip}:${port}`);
        }
      }
      onIce?.(e.candidate);
    } else {
      iceGatheringComplete = true;
      if (iceGatheringTimeout) {
        clearTimeout(iceGatheringTimeout);
        iceGatheringTimeout = null;
      }
      if (__DEV__) {
        console.log('✅ [ICE] ICE gathering complete');
        console.log(`📊 [ICE] Candidate summary: ${candidateCount} total (${hostCandidateCount} host, ${srflxCandidateCount} srflx, ${relayCandidateCount} relay, ${prflxCandidateCount} prflx)`);
        if (relayCandidateCount === 0) {
          console.warn('⚠️ [ICE] ⚠️⚠️⚠️ WARNING: No TURN relay candidates generated! ⚠️⚠️⚠️');
          console.warn('⚠️ [ICE] Connection may fail if devices are behind firewalls or symmetric NATs.');
          console.warn('⚠️ [ICE] However, connection may still work if:');
          console.warn('⚠️ [ICE]   - Both devices are on the same network');
          console.warn('⚠️ [ICE]   - NATs are compatible (cone NATs)');
          console.warn('⚠️ [ICE]   - STUN-reflexive candidates are sufficient');
          console.warn('⚠️ [ICE]');
          console.warn('⚠️ [ICE] Possible reasons for no TURN candidates:');
          console.warn('⚠️ [ICE]   1. TURN servers are not reachable from your network');
          console.warn('⚠️ [ICE]   2. TURN server credentials are incorrect or expired');
          console.warn('⚠️ [ICE]   3. Firewall is blocking TURN server access (ports 80, 443, 3478)');
          console.warn('⚠️ [ICE]   4. Free TURN servers may be down or rate-limited');
          console.warn('⚠️ [ICE]');
          console.warn('⚠️ [ICE] SOLUTION: For production, you MUST use a reliable TURN server:');
          console.warn('⚠️ [ICE]   - Twilio Network Traversal (recommended): https://www.twilio.com/stun-turn');
          console.warn('⚠️ [ICE]   - Self-hosted Coturn: https://github.com/coturn/coturn');
          console.warn('⚠️ [ICE]   - Metered.ca paid TURN: https://www.metered.ca/tools/openrelay/');
          console.warn('⚠️ [ICE]   - Xirsys TURN: https://xirsys.com/');
          console.warn('⚠️ [ICE]');
          console.warn('⚠️ [ICE] Free TURN servers are unreliable and should only be used for testing.');
        } else {
          console.log(`✅ [ICE] ${relayCandidateCount} TURN relay candidate(s) generated - NAT traversal should work!`);
        }
      }
    }
  });

  // Handle connection state changes
  pc.addEventListener('connectionstatechange', () => {
    const state = pc.connectionState;
    console.log('🔌 [Peer] Connection state:', state);
    
    // Notify callback
    onConnectionStateChange?.(state);
    
    if (state === 'connected') {
      console.log('✅ [Peer] ✅✅✅ PEER CONNECTION ESTABLISHED ✅✅✅');
    } else if (state === 'failed' || state === 'disconnected') {
      console.error('❌ [Peer] Connection failed or disconnected:', state);
      if (state === 'failed') {
        const errorMsg = 'Peer connection failed. This may be due to network issues or TURN server problems.';
        onError?.(errorMsg);
      }
    }
  });

  // Note: ICE connection state changes are already handled above (line 192)
  // No need for duplicate handler

  if (isCaller) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return { pc, localDescription: offer };
  } else {
    if (!offerSdp) throw new Error('Missing offer SDP for callee');
    await pc.setRemoteDescription(offerSdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return { pc, localDescription: answer };
  }
}

export async function applyAnswer(pc: any, answerSdp: any) {
  try {
    // Check if peer connection is still valid and in a state where we can set remote description
    if (!pc) {
      console.warn('⚠️ [applyAnswer] Peer connection is null');
      return;
    }

    // Check if peer connection is closed
    if (pc.signalingState === 'closed' || pc.connectionState === 'closed') {
      console.warn(`⚠️ [applyAnswer] Peer connection is closed, skipping`);
      return;
    }

    // Check signaling state - can only set remote description if in 'have-local-offer' or 'have-remote-offer' state
    const signalingState = pc.signalingState;
    if (signalingState === 'closed' || signalingState === 'stable') {
      console.warn(`⚠️ [applyAnswer] Cannot set remote answer in state: ${signalingState}`);
      return;
    }

    // Check connection state - don't set if already closed or failed
    const connectionState = pc.connectionState;
    if (connectionState === 'closed' || connectionState === 'failed') {
      console.warn(`⚠️ [applyAnswer] Cannot set remote answer, connection state: ${connectionState}`);
      return;
    }

    // Validate answerSdp exists and is valid
    if (!answerSdp) {
      console.warn('⚠️ [applyAnswer] Answer SDP is null or undefined');
      return;
    }

    // Convert answerSdp to RTCSessionDescription if needed
    let answer = answerSdp;
    const rnWebRTC = require('react-native-webrtc');
    const RTCSessionDescription = rnWebRTC.RTCSessionDescription;

    // If answerSdp is already an RTCSessionDescription instance, use it directly
    if (answerSdp && typeof answerSdp === 'object' && answerSdp.toJSON && answerSdp.sdp) {
      // It's already an RTCSessionDescription instance with valid SDP
      answer = answerSdp;
    } else if (answerSdp && typeof answerSdp === 'object') {
      // It's a plain object, convert to RTCSessionDescription
      // Try to get sdp and type from various possible formats
      let sdp = '';
      let type = 'answer';

      // Try to extract SDP from different possible locations
      if (answerSdp.sdp && typeof answerSdp.sdp === 'string') {
        sdp = answerSdp.sdp;
      } else if (answerSdp.localDescription && answerSdp.localDescription.sdp && typeof answerSdp.localDescription.sdp === 'string') {
        sdp = answerSdp.localDescription.sdp;
      }

      // Try to extract type
      if (answerSdp.type && typeof answerSdp.type === 'string') {
        type = answerSdp.type;
      } else if (answerSdp.localDescription && answerSdp.localDescription.type && typeof answerSdp.localDescription.type === 'string') {
        type = answerSdp.localDescription.type;
      }

      // Validate SDP before creating RTCSessionDescription
      if (sdp && sdp.length > 0 && sdp.includes('v=') && sdp.includes('m=')) {
        try {
          answer = new RTCSessionDescription({ type, sdp });
          console.log('✅ [applyAnswer] Created RTCSessionDescription from plain object');
        } catch (createError: any) {
          console.warn('⚠️ [applyAnswer] Failed to create RTCSessionDescription:', createError?.message || createError);
          return;
        }
      } else {
        console.warn('⚠️ [applyAnswer] Invalid SDP format - missing or malformed SDP');
        return;
      }
    } else {
      console.warn('⚠️ [applyAnswer] Invalid answer format:', typeof answerSdp);
      return;
    }

    // Final validation before setting
    if (!answer || !answer.sdp || typeof answer.sdp !== 'string' || answer.sdp.length === 0) {
      console.warn('⚠️ [applyAnswer] Invalid answer object - missing or invalid SDP');
      return;
    }

    // Set remote description with additional error handling
    try {
      await pc.setRemoteDescription(answer);
    } catch (setError: any) {
      // Re-throw to be caught by outer catch block
      throw setError;
    }
    console.log('✅ [applyAnswer] Remote answer set successfully');
  } catch (error: any) {
    // Safely extract error message without accessing nested properties
    let errorMessage = '';
    try {
      // Try to get error message safely
      if (error) {
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (typeof error === 'object') {
          // Try message property first
          if (error.message && typeof error.message === 'string') {
            errorMessage = error.message;
          } else if (error.toString && typeof error.toString === 'function') {
            try {
              errorMessage = error.toString();
            } catch {
              errorMessage = 'Error object';
            }
          } else {
            errorMessage = 'Error setting remote description';
          }
        } else {
          errorMessage = String(error);
        }
      }
    } catch  {
      // If we can't extract the error message, use a generic one
      errorMessage = 'Unknown error occurred';
    }

    // Ignore errors if connection is already closed or in wrong state
    if (errorMessage.includes('wrong state') ||
      errorMessage.includes('stable') ||
      errorMessage.includes('closed') ||
      errorMessage.includes('InvalidStateError') ||
      errorMessage.includes('receiver')) {
      console.warn('⚠️ [applyAnswer] Ignoring error - connection state issue:', errorMessage);
      return;
    }

    // Log error safely without accessing nested properties
    console.error('❌ [applyAnswer] Error setting remote answer:', errorMessage);
    // Don't throw - just log the error to prevent uncaught promise rejections
    return;
  }
}

export async function addRemoteIce(pc: any, candidate: any) {
  try {
    // If candidate is a plain object (from Firestore), reconstruct RTCIceCandidate
    let iceCandidate = candidate;
    if (candidate && typeof candidate === 'object' && candidate.candidate && typeof candidate.candidate === 'string') {
      // Check if it's already an RTCIceCandidate instance by checking for WebRTC-specific properties
      // If not, reconstruct it from the plain object
      const rnWebRTC = require('react-native-webrtc');
      const RTCIceCandidate = rnWebRTC.RTCIceCandidate;
      // If candidate doesn't have native WebRTC methods, it's a plain object from Firestore
      if (!candidate.toJSON && typeof candidate.candidate === 'string') {
        iceCandidate = new RTCIceCandidate({
          candidate: candidate.candidate,
          sdpMLineIndex: candidate.sdpMLineIndex ?? undefined,
          sdpMid: candidate.sdpMid ?? undefined,
        });
      }
    }
    await pc.addIceCandidate(iceCandidate);
  } catch { }
}


