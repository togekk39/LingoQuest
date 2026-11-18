import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import {
  getSpeechPreferences,
  stopOfflineSpeech,
  playOfflineVoice,
} from '../features/offlineSpeech';
import { audioClips } from './audioClips';

export function useChapterAudio() {
  const player = useAudioPlayer(null);
  const [speechMessage, setSpeechMessage] = useState('');
  const ticket = useRef(0);
  useEffect(
    () => () => {
      ticket.current++;
      void stopOfflineSpeech();
    },
    [],
  );
  const play = useCallback(
    async (phrase: string) => {
      const id = ++ticket.current;
      setSpeechMessage('');
      try {
        player.pause();
        await stopOfflineSpeech();
        const preferences = await getSpeechPreferences();
        if (ticket.current !== id) return;
        const result = await playOfflineVoice(phrase, preferences);
        if (ticket.current !== id || !result.message) return;
        const clip = audioClips[phrase];
        if (preferences.voice !== null || !clip) {
          setSpeechMessage(result.message);
          return;
        }
        player.replace(clip);
        player.setPlaybackRate(preferences.rate ?? 1, 'high');
        player.play();
        setSpeechMessage('Voz del sistema no disponible. Estás escuchando el audio incluido.');
      } catch {
        if (ticket.current === id)
          setSpeechMessage('No pudimos reproducir la frase. Revisa la configuración de voz.');
      }
    },
    [player],
  );
  const stop = useCallback(() => {
    ticket.current++;
    player.pause();
    setSpeechMessage('');
    void stopOfflineSpeech();
  }, [player]);
  return { play, stop, speechMessage };
}
