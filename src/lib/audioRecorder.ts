import { Audio } from 'expo-av';

export async function ensureMicPermission(): Promise<boolean> {
  const { granted } = await Audio.requestPermissionsAsync();
  return granted;
}

export async function startRecording() {
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await recording.startAsync();
  return recording;
}

export async function stopRecording(recording: Audio.Recording | null): Promise<string | null> {
  if (!recording) return null;
  try {
    await recording.stopAndUnloadAsync();
  } finally {
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  }
  return recording.getURI();
}
