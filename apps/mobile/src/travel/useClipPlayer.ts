import { useMemo } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { playPracticeClip } from '../features/playPracticeClip';

export function useClipPlayer() {
  const player = useAudioPlayer(null);
  return useMemo(
    () => ({
      stop: () => player.pause(),
      play: (clip: number, rate: number, signal: AbortSignal) =>
        playPracticeClip(player, clip, rate, signal),
    }),
    [player],
  );
}
