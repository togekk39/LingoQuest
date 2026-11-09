import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import * as Speech from 'expo-speech';
import { selectOfflineVoice, type OfflineVoice, type SpeechPreferences } from './types';

interface AndroidOfflineTts {
  getVoices(): Promise<OfflineVoice[]>;
  speak(text: string, voice: string | null, rate: number | null): Promise<boolean>;
  stop(): Promise<void>;
  openSettings(): Promise<void>;
}
const android =
  Platform.OS === 'android' ? requireOptionalNativeModule<AndroidOfflineTts>('OfflineTts') : null;
export async function getOfflineVoices(): Promise<OfflineVoice[]> {
  if (Platform.OS === 'android') return android ? android.getVoices() : [];
  if (Platform.OS !== 'ios') return [];
  // AVSpeechSynthesizer enumerates voices installed on the device.
  return (await Speech.getAvailableVoicesAsync())
    .filter((voice) => /^en(?:-|$)/i.test(voice.language))
    .map((voice) => ({ ...voice, isDefault: false }));
}
export async function playDeviceSpeech(
  text: string,
  preferences: SpeechPreferences,
  voices: OfflineVoice[],
  isCurrent: () => boolean,
) {
  if (!isCurrent()) return false;
  if (Platform.OS === 'android') {
    if (!android) throw new Error('Offline TTS requires a native build');
    return android.speak(text, preferences.voice, preferences.rate);
  }
  const voice = selectOfflineVoice(voices, preferences.voice);
  if (!voice) throw new Error('No offline voice');
  await Speech.stop();
  if (!isCurrent()) return false;
  return new Promise<boolean>((resolve, reject) => {
    Speech.speak(text, {
      language: voice.language,
      // Let iOS choose its preferred installed English voice by default.
      ...(preferences.voice ? { voice: voice.identifier } : {}),
      ...(preferences.rate === null ? {} : { rate: preferences.rate }),
      onDone: () => resolve(true),
      onStopped: () => resolve(false),
      onError: reject,
    });
  });
}
export async function stopDeviceSpeech() {
  if (Platform.OS === 'android') await android?.stop();
  else await Speech.stop();
}
export async function openDeviceSpeechSettings() {
  if (Platform.OS === 'android' && android) return android.openSettings();
  throw new Error('Configura las voces sin conexión en los ajustes de voz de tu dispositivo.');
}
