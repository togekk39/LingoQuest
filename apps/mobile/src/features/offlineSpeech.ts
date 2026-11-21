import { useCallback, useEffect, useRef, useState } from 'react';
import { localSettings } from '../lib/api';
import { getChapterAudio } from '../lib/chapterPacks';
import { useClipPlayer } from '../travel/useClipPlayer';
import { getOfflineVoices, playDeviceSpeech, stopDeviceSpeech } from './tts/deviceSpeech';
import {
  DEFAULT_SPEECH_PREFERENCES,
  normalizeSpeechPreferences,
  type SpeechPreferences,
} from './tts/types';

export { getOfflineVoices };
export const OFFLINE_AUDIO_NOTICE =
  'No pudimos usar una voz de inglés sin conexión. Elige una voz en Configuración de voz o instala una en los ajustes TTS del sistema.';
export const DOWNLOADED_AUDIO_NOTICE =
  'Voz del sistema no disponible. Estás escuchando el audio descargado.';
export async function getAvailableChapterAudio(chapterId: string | undefined, text: string) {
  return chapterId ? getChapterAudio(chapterId, text).catch(() => undefined) : undefined;
}
export async function getSpeechPreferences() {
  return normalizeSpeechPreferences(
    await localSettings.get<unknown>('speech', DEFAULT_SPEECH_PREFERENCES),
  );
}
export async function saveSpeechPreferences(value: SpeechPreferences) {
  await localSettings.set('speech', normalizeSpeechPreferences(value));
}
let request = 0;
export async function playOfflineVoice(
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
export function useOfflineSpeech(chapterId?: string) {
  const player = useClipPlayer();
  const playback = useRef<AbortController | null>(null);
  const [speechMessage, setSpeechMessage] = useState('');
  const cancel = useCallback(() => {
    const current = playback.current;
    if (!current || current.signal.aborted) return;
    current.abort();
    void stopOfflineSpeech();
  }, []);
  const stop = useCallback(() => {
    cancel();
    setSpeechMessage('');
  }, [cancel]);
  useEffect(() => cancel, [cancel, chapterId]);
  const playOffline = useCallback(
    async (text: string) => {
      cancel();
      const run = new AbortController();
      playback.current = run;
      setSpeechMessage('');
      try {
        const result = await playOfflineVoice(text);
        if (run.signal.aborted || !result.message) return;
        const clip = await getAvailableChapterAudio(chapterId, text);
        if (clip && !run.signal.aborted) {
          const { rate } = await getSpeechPreferences();
          if (run.signal.aborted) return;
          setSpeechMessage(DOWNLOADED_AUDIO_NOTICE);
          if (await player.play(clip, rate ?? 1, run.signal).catch(() => false)) return;
        }
        if (!run.signal.aborted) setSpeechMessage(result.message);
      } finally {
        if (playback.current === run) playback.current = null;
      }
    },
    [cancel, chapterId, player],
  );
  return { playOffline, speechMessage, stop };
}
