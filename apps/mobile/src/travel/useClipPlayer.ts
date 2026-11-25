import { useEffect, useMemo, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import { pausePracticePlayback } from '../features/pausePracticePlayback';
import { playPracticeClip } from '../features/playPracticeClip';

export function useClipPlayer() {
  const player = useAudioPlayer(null);
  const current = useRef<AbortController | null>(null);
  useEffect(() => () => current.current?.abort(), []);
  return useMemo(() => {
    const stop = (reset = false) => {
      const playback = current.current;
      if (playback && !playback.signal.aborted) playback.abort();
      else if (!reset) return;
      pausePracticePlayback(player, Platform.OS);
    };
    return {
      stop,
      async play(clip: number | string, rate: number, signal: AbortSignal) {
        if (signal.aborted) return false;
        stop();
        const playback = new AbortController();
        current.current = playback;
        const cancel = () => {
          if (current.current === playback) stop();
        };
        signal.addEventListener('abort', cancel, { once: true });
        try {
          return await playPracticeClip(player, clip, rate, playback.signal);
        } finally {
          signal.removeEventListener('abort', cancel);
          if (current.current === playback) current.current = null;
        }
      },
    };
  }, [player]);
}
