import type { AudioPlayer, AudioSource } from 'expo-audio';

type PracticeAudioPlayer = Pick<
  AudioPlayer,
  'addListener' | 'replace' | 'setPlaybackRate' | 'play'
>;

export function playPracticeClip(
  player: PracticeAudioPlayer,
  source: AudioSource,
  rate: number,
  signal: AbortSignal,
): Promise<boolean> {
  if (signal.aborted) return Promise.resolve(false);

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      subscription.remove();
      clearTimeout(timeout);
      signal.removeEventListener('abort', cancelled);
    };
    const cancelled = () => {
      cleanup();
      resolve(false);
    };
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        cleanup();
        resolve(true);
      }
    });
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Audio playback did not finish'));
    }, 30000);
    signal.addEventListener('abort', cancelled, { once: true });

    try {
      player.replace(source);
      player.setPlaybackRate(rate, 'high');
      player.play();
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}
