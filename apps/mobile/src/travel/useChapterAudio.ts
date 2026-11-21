import { useCallback, useEffect, useRef, useState } from 'react';
import { useClipPlayer } from './useClipPlayer';
import {
  getSpeechPreferences,
  stopOfflineSpeech,
  playOfflineVoice,
} from '../features/offlineSpeech';
import { audioClips } from './audioClips';

export function useChapterAudio() {
  const player = useClipPlayer();
  const [speechMessage, setSpeechMessage] = useState('');
  const playback = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      playback.current?.abort();
      void stopOfflineSpeech();
    },
    [],
  );
  const playSequence = useCallback(
    async (
      phrases: readonly string[],
      onSelect?: (index: number) => void,
      useBundledIfUnavailable = false,
    ) => {
      playback.current?.abort();
      const controller = new AbortController();
      playback.current = controller;
      const { signal } = controller;
      setSpeechMessage('');
      try {
        player.stop();
        await stopOfflineSpeech();
        const preferences = await getSpeechPreferences();
        for (const [index, phrase] of phrases.entries()) {
          if (signal.aborted) return;
          onSelect?.(index);
          const result = await playOfflineVoice(phrase, preferences);
          if (signal.aborted) return;
          if (result.played) continue;
          if (!result.message) return;

          const clip = audioClips[phrase];
          if (!clip || (preferences.voice !== null && !useBundledIfUnavailable)) {
            setSpeechMessage(result.message);
            continue;
          }
          setSpeechMessage('Voz del sistema no disponible. Estás escuchando el audio incluido.');
          if (!(await player.play(clip, preferences.rate ?? 1, signal))) return;
        }
      } catch {
        if (!signal.aborted)
          setSpeechMessage('No pudimos reproducir la frase. Revisa la configuración de voz.');
      } finally {
        if (playback.current === controller) playback.current = null;
      }
    },
    [player],
  );
  const play = useCallback(
    (phrase: string, useBundledIfUnavailable = false) =>
      playSequence([phrase], undefined, useBundledIfUnavailable),
    [playSequence],
  );
  const stop = useCallback(() => {
    playback.current?.abort();
    player.stop();
    setSpeechMessage('');
    void stopOfflineSpeech();
  }, [player]);
  return { play, playSequence, stop, speechMessage };
}
