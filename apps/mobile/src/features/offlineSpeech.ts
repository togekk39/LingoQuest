import { useCallback, useState } from 'react';
import { localSettings } from '../lib/api';
import { getOfflineVoices, playDeviceSpeech, stopDeviceSpeech } from './tts/deviceSpeech';
import {
  DEFAULT_SPEECH_PREFERENCES,
  normalizeSpeechPreferences,
  type SpeechPreferences,
} from './tts/types';

export { getOfflineVoices };
export const OFFLINE_AUDIO_NOTICE =
  'No hay una voz de inglés sin conexión disponible. Revisa la voz elegida en Configuración de voz o instala una voz sin conexión en los ajustes TTS del sistema. Puedes seguir leyendo, grabarte y escuchar tu práctica.';
export async function getSpeechPreferences() {
  return normalizeSpeechPreferences(
    await localSettings.get<unknown>('speech', DEFAULT_SPEECH_PREFERENCES),
  );
}
export async function saveSpeechPreferences(value: SpeechPreferences) {
  await localSettings.set('speech', normalizeSpeechPreferences(value));
}
let request = 0;
async function playOfflineVoice(
  text: string,
  override?: SpeechPreferences,
): Promise<{ played: boolean; message: string }> {
  const ticket = ++request;
  try {
    const preferences = override ?? (await getSpeechPreferences());
    // Resolve delayed voice lists before checking whether the screen was closed.
    const voices = await getOfflineVoices();
    if (ticket !== request) return { played: false, message: '' };
    const played = await playDeviceSpeech(text, preferences, voices, () => ticket === request);
    return { played, message: '' };
  } catch {
    return { played: false, message: ticket === request ? OFFLINE_AUDIO_NOTICE : '' };
  }
}
export async function previewOfflineSpeech(
  text: string,
  preferences: SpeechPreferences,
  onUnavailable: (message: string) => void,
) {
  const result = await playOfflineVoice(text, preferences);
  if (result.message) onUnavailable(result.message);
  return result.played;
}
export async function speakOffline(
  text: string,
  onUnavailable?: (message: string) => void,
): Promise<boolean> {
  const result = await playOfflineVoice(text);
  if (result.message) onUnavailable?.(result.message);
  return result.played;
}
export async function stopOfflineSpeech() {
  request++;
  await stopDeviceSpeech();
}
export function useOfflineSpeech() {
  const [speechMessage, setSpeechMessage] = useState('');
  const playOffline = useCallback(async (text: string) => {
    setSpeechMessage('');
    const result = await playOfflineVoice(text);
    setSpeechMessage(result.message);
  }, []);
  return { playOffline, speechMessage };
}
