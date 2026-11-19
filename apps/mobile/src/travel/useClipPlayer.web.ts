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
      play: async (clip: number, rate: number) => {
        stop();
        const audio = new Audio(Asset.fromModule(clip).uri);
        current.current = audio;
        audio.playbackRate = rate;
        audio.preservesPitch = true;
        await audio.play();
      },
    };
  }, []);
  useEffect(() => player.stop, [player]);
  return player;
}
