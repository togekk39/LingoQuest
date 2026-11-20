import { useEffect, useMemo, useRef } from 'react';
import { Asset } from 'expo-asset';

export function useClipPlayer() {
  const current = useRef<HTMLAudioElement | null>(null);
  const player = useMemo(() => {
    const stop = () => {
      const audio = current.current;
      if (!audio) return;
      current.current = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
    return {
      stop,
      play: (clip: number, rate: number, signal: AbortSignal) => {
        if (signal.aborted) return Promise.resolve(false);
        stop();
        const audio = new Audio(Asset.fromModule(clip).uri);
        current.current = audio;
        audio.playbackRate = rate;
        audio.preservesPitch = true;
        return new Promise<boolean>((resolve, reject) => {
          const cleanup = () => {
            audio.removeEventListener('ended', ended);
            audio.removeEventListener('error', failed);
            signal.removeEventListener('abort', cancelled);
          };
          const ended = () => {
            cleanup();
            resolve(true);
          };
          const failed = () => {
            cleanup();
            reject(audio.error ?? new Error('Audio playback failed'));
          };
          const cancelled = () => {
            cleanup();
            resolve(false);
          };
          audio.addEventListener('ended', ended);
          audio.addEventListener('error', failed);
          signal.addEventListener('abort', cancelled, { once: true });
          void audio.play().catch(failed);
        });
      },
    };
  }, []);
  useEffect(() => player.stop, [player]);
  return player;
}
