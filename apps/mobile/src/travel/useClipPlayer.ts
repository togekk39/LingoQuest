import { useMemo } from 'react';
import { useAudioPlayer } from 'expo-audio';

export function useClipPlayer() {
  const player = useAudioPlayer(null);
  return useMemo(
    () => ({
      stop: () => player.pause(),
      play: async (clip: number, rate: number) => {
        player.replace(clip);
        player.setPlaybackRate(rate, 'high');
        player.play();
      },
    }),
    [player],
  );
}
