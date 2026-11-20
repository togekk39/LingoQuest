import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  canCheckOnDeviceRecognition,
  onDeviceRecognitionOptions,
  recognitionLocale,
  selectedRecognitionService,
} from './recognitionService';
import { speechRecognition as recognition } from './speechRecognitionModule';
import { stopOfflineSpeech } from './offlineSpeech';

export type RecognitionMode = 'on-device' | 'system';

type Attempt = {
  mode: RecognitionMode;
  started: boolean;
  hasFinal: boolean;
  failed: boolean;
  timeout?: ReturnType<typeof setTimeout>;
};

export const onDeviceUnavailable =
  'El reconocimiento en el dispositivo no está disponible aquí. Puedes grabar y escuchar tu voz o continuar sin micrófono.';
const onDeviceLanguageUnavailable =
  'Instala el modelo de inglés (Estados Unidos) para reconocimiento sin conexión en los ajustes de voz de Android. También puedes grabar o continuar sin micrófono.';

function abortAttempt(attempt: Attempt | null) {
  clearTimeout(attempt?.timeout);
  if (!attempt?.started) return;
  try {
    recognition?.abort();
  } catch {
    // The system session may already have ended.
    // Es posible que la sesión del sistema ya haya terminado.
  }
}

function recognitionError(code: string, mode: RecognitionMode) {
  switch (code) {
    case 'audio-preparation':
      return 'No pudimos preparar el audio para la práctica. Vuelve a intentarlo o continúa sin micrófono.';
    case 'on-device-unavailable':
      return onDeviceUnavailable;
    case 'on-device-language-unavailable':
      return onDeviceLanguageUnavailable;
    case 'service-unavailable':
      return 'El servicio de voz seleccionado no está disponible. Selecciona un servicio STT compatible con Android en los ajustes del sistema. Puedes seguir con solo grabar.';
    case 'not-allowed':
    case 'service-not-allowed':
      return mode === 'on-device'
        ? 'Permite el micrófono en los ajustes de Android para reconocer tu voz, o continúa sin micrófono.'
        : 'Permite el micrófono y el reconocimiento de voz en los ajustes del navegador o del sistema. También puedes practicar solo con una grabación.';
    case 'audio-capture':
      return 'No se pudo abrir el micrófono. Comprueba que esté conectado y que otra aplicación no lo esté usando.';
    case 'no-speech':
    case 'nomatch':
      return 'No reconocimos palabras. Habla un poco más cerca del micrófono y vuelve a intentarlo.';
    case 'network':
      return mode === 'on-device'
        ? onDeviceUnavailable
        : 'El reconocimiento del sistema necesita conexión. Revisa tu red o practica solo con una grabación sin conexión.';
    case 'language-not-supported':
    case 'language-unavailable':
      return mode === 'on-device'
        ? onDeviceLanguageUnavailable
        : 'El reconocimiento de inglés no está disponible. Instala o activa inglés en el servicio de voz del sistema, o practica solo con una grabación.';
    default:
      return mode === 'on-device'
        ? onDeviceUnavailable
        : 'El reconocimiento de voz no está disponible. Activa el servicio de voz del sistema o usa un navegador compatible. Puedes practicar solo con una grabación.';
  }
}

export function useSystemSTT() {
  const [phase, setPhase] = useState<'idle' | 'starting' | 'listening' | 'stopping'>('idle');
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [message, setMessage] = useState('');
  const attempt = useRef<Attempt | null>(null);
  const canTryOnDevice =
    recognition !== null && canCheckOnDeviceRecognition(Platform.OS, Platform.Version);

  useEffect(() => {
    if (!recognition) return;
    const subscriptions = [
      recognition.addListener('start', () => {
        if (attempt.current?.started) setPhase('listening');
      }),
      recognition.addListener('result', (event) => {
        const current = attempt.current;
        if (!current?.started || current.hasFinal || current.failed) return;
        const value = event.results[0]?.transcript.trim() ?? '';
        setTranscript(value);
        if (event.isFinal && value) {
          current.hasFinal = true;
          setFinalTranscript(value);
        }
      }),
      recognition.addListener('error', (event) => {
        const current = attempt.current;
        if (!current?.started) return;
        current.failed = true;
        setMessage(recognitionError(event.error, current.mode));
        setPhase('stopping');
      }),
      recognition.addListener('nomatch', () => {
        const current = attempt.current;
        if (!current?.started) return;
        current.failed = true;
        setMessage(recognitionError('nomatch', current.mode));
      }),
      recognition.addListener('end', () => {
        const current = attempt.current;
        if (!current?.started) return;
        clearTimeout(current.timeout);
        attempt.current = null;
        setPhase('idle');
        if (!current.hasFinal) {
          setTranscript('');
          if (!current.failed) setMessage(recognitionError('no-speech', current.mode));
        }
      }),
    ];
    return () => {
      const current = attempt.current;
      attempt.current = null;
      subscriptions.forEach((subscription) => subscription.remove());
      abortAttempt(current);
    };
  }, []);

  async function start(mode: RecognitionMode, prepareAudio?: () => void) {
    if (attempt.current) return;
    if (!recognition) {
      setMessage(recognitionError('unavailable', mode));
      return;
    }
    const current: Attempt = { mode, started: false, hasFinal: false, failed: false };
    attempt.current = current;
    setTranscript('');
    setFinalTranscript('');
    setMessage('');
    setPhase('starting');
    try {
      let options;
      if (mode === 'on-device') {
        current.timeout = setTimeout(() => fail(current, 'on-device-unavailable'), 5000);
        options = await onDeviceRecognitionOptions(Platform.OS, Platform.Version, recognition);
        clearTimeout(current.timeout);
        if (attempt.current !== current) return;
      } else {
        if (!recognition.isRecognitionAvailable()) throw new Error('unavailable');
        options = {
          lang: recognitionLocale,
          ...(Platform.OS === 'android'
            ? { androidRecognitionServicePackage: selectedRecognitionService(recognition) }
            : {}),
        };
      }
      try {
        prepareAudio?.();
        await stopOfflineSpeech();
      } catch {
        throw new Error('audio-preparation');
      }
      if (attempt.current !== current) return;
      if (Platform.OS !== 'web') {
        const permission = await recognition.requestPermissionsAsync();
        if (attempt.current !== current) return;
        if (!permission.granted) throw new Error('not-allowed');
      }
      current.started = true;
      current.timeout = setTimeout(() => fail(current, 'unavailable'), 25000);
      recognition.start({
        ...options,
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        recordingOptions: { persist: false },
      });
    } catch (error) {
      fail(current, error instanceof Error ? error.message : 'unavailable');
    }
  }

  function fail(current: Attempt, code: string) {
    if (attempt.current !== current) return;
    attempt.current = null;
    abortAttempt(current);
    setPhase('idle');
    if (!current.hasFinal) setTranscript('');
    if (!current.failed) setMessage(recognitionError(code, current.mode));
  }

  function stop() {
    const current = attempt.current;
    if (!recognition || !current?.started) return;
    setPhase('stopping');
    clearTimeout(current.timeout);
    current.timeout = setTimeout(() => fail(current, 'unavailable'), 5000);
    try {
      recognition.stop();
    } catch {
      fail(current, 'unavailable');
    }
  }

  function cancel() {
    const current = attempt.current;
    attempt.current = null;
    abortAttempt(current);
    setPhase('idle');
    setTranscript('');
    setFinalTranscript('');
    setMessage('');
  }

  return { phase, transcript, finalTranscript, message, canTryOnDevice, start, stop, cancel };
}
