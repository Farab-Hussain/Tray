import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

/**
 * Request mic (and optionally camera) before WebRTC getUserMedia on Android.
 * iOS prompts automatically when getUserMedia runs.
 */
export async function ensureCallMediaPermissions(needVideo: boolean): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const permissions: string[] = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
  if (needVideo) {
    permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
  }

  try {
    const results = await PermissionsAndroid.requestMultiple(permissions);
    const micGranted =
      results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
      PermissionsAndroid.RESULTS.GRANTED;
    const cameraGranted =
      !needVideo ||
      results[PermissionsAndroid.PERMISSIONS.CAMERA] ===
        PermissionsAndroid.RESULTS.GRANTED;

    if (micGranted && cameraGranted) {
      return true;
    }

    const deniedAlways = [
      needVideo ? results[PermissionsAndroid.PERMISSIONS.CAMERA] : null,
      results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO],
    ].some((r) => r === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);

    Alert.alert(
      needVideo ? 'Camera & microphone required' : 'Microphone required',
      needVideo
        ? 'Allow camera and microphone access in Settings to use video calls.'
        : 'Allow microphone access in Settings to use calls.',
      deniedAlways
        ? [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        : [{ text: 'OK' }],
    );
    return false;
  } catch {
    return false;
  }
}
