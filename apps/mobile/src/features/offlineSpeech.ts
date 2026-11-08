import { useState } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

export const OFFLINE_AUDIO_NOTICE =
  'Audio de referencia no incluido en este paquete. Puedes seguir leyendo, grabarte y escuchar tu práctica.';

/** Never fall back to an unverified/network speech voice. */
async function playVerifiedOfflineVoice(
  text: string,
  rate = 0.85,
): Promise<{ played: boolean; message: string }> {
  if (Platform.OS !== 'web') {
    // Expo's native Voice metadata does not expose Android's
    // isNetworkConnectionRequired. Leave native demo speech disabled until an
    // offline voice bridge or a locally installed audio pack can prove locality.
    return { played: false, message: OFFLINE_AUDIO_NOTICE };
  }
  try {
    const voices = (await Speech.getAvailableVoicesAsync()) as Speech.WebVoice[];
    const localVoices = voices.filter(
      (voice) => voice.localService === true && /^en(?:-|$)/i.test(voice.language),
    );
    const voice = localVoices.find((item) => /^en-US$/i.test(item.language)) ?? localVoices[0];
    if (!voice) return { played: false, message: OFFLINE_AUDIO_NOTICE };
    await Speech.stop();
    Speech.speak(text, { language: voice.language, voice: voice.identifier, rate });
    return { played: true, message: '' };
  } catch {
    return { played: false, message: OFFLINE_AUDIO_NOTICE };
  }
}
export async function speakOffline(
  text: string,
  onUnavailable?: (message: string) => void,
): Promise<boolean> {
  const result = await playVerifiedOfflineVoice(text);
  if (!result.played) onUnavailable?.(result.message);
  return result.played;
}
export async function stopOfflineSpeech() {
  if (Platform.OS === 'web') await Speech.stop();
}
export function useOfflineSpeech() {
  const [speechMessage, setSpeechMessage] = useState('');
  async function playOffline(text: string, rate = 0.85) {
    const result = await playVerifiedOfflineVoice(text, rate);
    setSpeechMessage(result.message);
  }
  return { playOffline, speechMessage };
}
