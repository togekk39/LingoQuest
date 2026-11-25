import { useEffect, useMemo, useRef } from 'react';
import { Asset } from 'expo-asset';

const mp3DataPrefix = 'data:audio/mpeg;base64,';

export function useClipPlayer() {
  const current = useRef<(() => void) | null>(null);
  const prepared = useRef<HTMLAudioElement | null>(null);
  const player = useMemo(() => {
    const stop = (reset = false) => {
      if (current.current) current.current();
      else if (reset) (prepared.current ??= new Audio()).pause();
    };
    return {
      stop,
      async play(clip: number | string, rate: number, signal: AbortSignal) {
        if (signal.aborted) return false;
        stop();
        const uri = typeof clip === 'number' ? Asset.fromModule(clip).uri : clip;
        let blobUri: string | undefined;
        if (uri.startsWith(mp3DataPrefix)) {
          const binary = atob(uri.slice(mp3DataPrefix.length));
          const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
          blobUri = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
        }
        const audio = prepared.current ?? new Audio();
        prepared.current = null;
        audio.src = blobUri ?? uri;
        audio.playbackRate = rate;
        audio.preservesPitch = true;
        return new Promise<boolean>((resolve, reject) => {
          const cleanup = (unload: boolean) => {
            if (current.current !== cancelled) return false;
            current.current = null;
            audio.removeEventListener('ended', ended);
            audio.removeEventListener('error', failed);
            signal.removeEventListener('abort', cancelled);
            if (unload) {
              audio.pause();
              audio.removeAttribute('src');
              audio.load();
            }
            if (blobUri) URL.revokeObjectURL(blobUri);
            return true;
          };
          const ended = () => {
            if (cleanup(false)) resolve(true);
          };
          const failed = (cause?: unknown) => {
            if (cleanup(true)) reject(audio.error ?? cause ?? new Error('Audio playback failed'));
          };
          const cancelled = () => {
            if (cleanup(true)) resolve(false);
          };
          current.current = cancelled;
          audio.addEventListener('ended', ended);
          audio.addEventListener('error', failed);
          signal.addEventListener('abort', cancelled, { once: true });
          try {
            void audio.play().catch(failed);
          } catch (error) {
            failed(error);
          }
        });
      },
    };
  }, []);
  useEffect(() => player.stop, [player]);
  return player;
}
