import { useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import {
  getSpeechPreferences,
  stopOfflineSpeech,
  useOfflineSpeech,
} from '../features/offlineSpeech';
import { audioClips } from './audioClips';

export function useChapterAudio() {
  const player = useAudioPlayer(null);
  const { playOffline, speechMessage } = useOfflineSpeech();
  const [clipError, setClipError] = useState('');
  const ticket = useRef(0);
  useEffect(
    () => () => {
      ticket.current++;
      void stopOfflineSpeech();
    },
    [],
  );
  async function play(phrase: string) {
    const clip = audioClips[phrase];
    const id = ++ticket.current;
    setClipError('');
    try {
      if (!clip) return await playOffline(phrase);
      await stopOfflineSpeech();
      const settings = await getSpeechPreferences();
      if (ticket.current !== id) return;
      player.pause();
      player.replace(clip);
      player.setPlaybackRate(settings.rate ?? 1, 'high');
      player.play();
    } catch {
      setClipError('No pudimos reproducir la frase. Puedes seguir con el texto.');
    }
  }
  function stop() {
    ticket.current++;
    player.pause();
    void stopOfflineSpeech();
  }
  return { play, stop, speechMessage: clipError || speechMessage };
}
