import { useCallback, useEffect, useRef, useState } from 'react';
import { useClipPlayer } from './useClipPlayer';
import {
  DOWNLOADED_AUDIO_NOTICE,
  getAvailableChapterAudio,
  getSpeechPreferences,
  stopOfflineSpeech,
  playOfflineVoice,
} from '../features/offlineSpeech';
import { audioClips } from './audioClips';

export function useChapterAudio(chapterId = 'home') {
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
      onPlayed?: () => void,
    ) => {
      playback.current?.abort();
      const controller = new AbortController();
      playback.current = controller;
      const { signal } = controller;
      setSpeechMessage('');
      let completed = true;
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

          const downloaded = await getAvailableChapterAudio(chapterId, phrase);
          if (signal.aborted) return;
          if (downloaded) {
            setSpeechMessage(DOWNLOADED_AUDIO_NOTICE);
            if (await player.play(downloaded, preferences.rate ?? 1, signal).catch(() => false))
              continue;
            if (signal.aborted) return;
          }
          const clip = chapterId === 'home' ? audioClips[phrase] : undefined;
          if (!clip || (preferences.voice !== null && !useBundledIfUnavailable)) {
            setSpeechMessage(result.message);
            completed = false;
            continue;
          }
          setSpeechMessage('Voz del sistema no disponible. Estás escuchando el audio incluido.');
          if (!(await player.play(clip, preferences.rate ?? 1, signal))) return;
        }
        if (completed && !signal.aborted) onPlayed?.();
      } catch {
        if (!signal.aborted)
          setSpeechMessage('No pudimos reproducir la frase. Revisa la configuración de voz.');
      } finally {
        if (playback.current === controller) playback.current = null;
      }
    },
    [chapterId, player],
  );
  const play = useCallback(
    (phrase: string, useBundledIfUnavailable = false, onPlayed?: () => void) =>
      playSequence([phrase], undefined, useBundledIfUnavailable, onPlayed),
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
