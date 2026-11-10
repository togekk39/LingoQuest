interface PracticePlayer {
  pause(): void;
  replace(source: null): void;
}
export function pausePracticePlayback(player: PracticePlayer, platform: string) {
  player.pause();
  // expo-audio 1.1.1 accepts null on web but Android's native replace requires AudioSource.
  if (platform === 'web') player.replace(null);
}
