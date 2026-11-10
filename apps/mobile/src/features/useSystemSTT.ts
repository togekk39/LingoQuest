import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  ExpoSpeechRecognitionModule as recognition,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { stopOfflineSpeech } from './offlineSpeech';

export function recognitionError(code: string) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Permite el micrófono y el reconocimiento de voz en los ajustes del navegador o del sistema. También puedes practicar solo con una grabación.';
    case 'audio-capture':
      return 'No se pudo abrir el micrófono. Comprueba que esté conectado y que otra aplicación no lo esté usando.';
    case 'no-speech':
    case 'nomatch':
      return 'No reconocimos palabras. Habla un poco más cerca del micrófono y vuelve a intentarlo.';
    case 'network':
      return 'El reconocimiento del sistema necesita conexión. Revisa tu red o practica solo con una grabación sin conexión.';
    case 'language-not-supported':
    case 'language-unavailable':
      return 'El reconocimiento de inglés no está disponible. Instala o activa inglés en el servicio de voz del sistema, o practica solo con una grabación.';
    default:
      return 'El reconocimiento de voz no está disponible. Activa el servicio de voz del sistema o usa un navegador compatible. Puedes practicar solo con una grabación.';
  }
}

export function useSystemSTT() {
  const [phase, setPhase] = useState<'idle' | 'starting' | 'listening' | 'stopping'>('idle');
  const [transcript, setTranscript] = useState('');
  const [message, setMessage] = useState('');
  const mounted = useRef(true);
  const active = useRef(false);
  const hasResult = useRef(false);
  const hasError = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current = false;
      recognition.abort();
    };
  }, []);
  useSpeechRecognitionEvent('start', () => {
    if (active.current) setPhase('listening');
  });
  useSpeechRecognitionEvent('result', (event) => {
    if (!active.current) return;
    const value = event.results[0]?.transcript.trim() ?? '';
    hasResult.current = !!value;
    setTranscript(value);
  });
  useSpeechRecognitionEvent('error', (event) => {
    if (!active.current) return;
    hasError.current = true;
    setMessage(recognitionError(event.error));
    // Wait for end before permitting another session.
    setPhase('stopping');
  });
  useSpeechRecognitionEvent('nomatch', () => {
    if (!active.current) return;
    hasError.current = true;
    setMessage(recognitionError('nomatch'));
  });
  useSpeechRecognitionEvent('end', () => {
    if (!active.current) return;
    active.current = false;
    setPhase('idle');
    if (!hasResult.current && !hasError.current) setMessage(recognitionError('no-speech'));
  });
  async function start() {
    if (active.current) return;
    active.current = true;
    hasResult.current = false;
    hasError.current = false;
    setTranscript('');
    setMessage('');
    setPhase('starting');
    try {
      if (!recognition.isRecognitionAvailable()) throw new Error('unavailable');
      await stopOfflineSpeech();
      if (!mounted.current || !active.current) return;
      // Web Speech requests permission in start(), preserving the browser's prompt.
      if (Platform.OS !== 'web') {
        const permission = await recognition.requestPermissionsAsync();
        if (!mounted.current || !active.current) return;
        if (!permission.granted) throw new Error('not-allowed');
      }
      recognition.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        recordingOptions: { persist: false },
      });
    } catch (error) {
      if (!mounted.current || !active.current) return;
      active.current = false;
      setPhase('idle');
      setMessage(recognitionError(error instanceof Error ? error.message : 'unavailable'));
    }
  }
  function stop() {
    if (!active.current) return;
    setPhase('stopping');
    try {
      recognition.stop();
    } catch {
      active.current = false;
      setPhase('idle');
      setMessage(recognitionError('unavailable'));
    }
  }
  function cancel() {
    active.current = false;
    recognition.abort();
    setPhase('idle');
    setTranscript('');
    setMessage('');
  }
  return { phase, transcript, message, start, stop, cancel };
}
