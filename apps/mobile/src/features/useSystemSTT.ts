import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { systemRecognitionOptions } from './recognitionService';
import { speechRecognition as recognition } from './speechRecognitionModule';
import { stopOfflineSpeech } from './offlineSpeech';

type Attempt = {
  started: boolean;
  finals: string[];
  failed: boolean;
  audioFile?: File;
  audioEnded?: boolean;
  timeout?: ReturnType<typeof setTimeout>;
};

let recordingNumber = 0;

function discardRecording(file?: File) {
  try {
    if (file?.exists) file.delete();
  } catch {
    // An interrupted capture may have already removed the file.
    // Una captura interrumpida puede haber eliminado el archivo.
  }
}

function abortAttempt(attempt: Attempt | null) {
  clearTimeout(attempt?.timeout);
  if (!attempt?.started) return;
  const file = attempt.audioFile;
  if (file && !attempt.audioEnded && recognition) {
    // Wait for the native writer to close before deleting the file.
    // Espera a que el módulo nativo cierre el archivo antes de eliminarlo.
    const discard = () => {
      clearTimeout(timeout);
      subscription.remove();
      discardRecording(file);
    };
    const subscription = recognition.addListener('audioend', ({ uri }) => {
      if (uri === file.uri) discard();
    });
    const timeout = setTimeout(discard, 10000);
  } else {
    discardRecording(file);
  }
  try {
    recognition?.abort();
  } catch {
    // The system session may already have ended.
    // Es posible que la sesión del sistema ya haya terminado.
  }
}

function recognitionError(code: string) {
  switch (code) {
    case 'audio-preparation':
      return 'No pudimos preparar el audio para la práctica. Vuelve a intentarlo o continúa sin micrófono.';
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Permite el micrófono y el reconocimiento de voz en los ajustes del navegador o del sistema. También puedes omitir este paso.';
    case 'audio-capture':
      return 'No se pudo abrir el micrófono. Comprueba que esté conectado y que otra aplicación no lo esté usando.';
    case 'no-speech':
    case 'nomatch':
      return 'No reconocimos palabras. Habla un poco más cerca del micrófono y vuelve a intentarlo.';
    case 'network':
      return 'El reconocimiento del sistema necesita conexión. Revisa tu red o continúa sin usar el micrófono.';
    case 'language-not-supported':
    case 'language-unavailable':
      return 'El reconocimiento de inglés no está disponible. Instala o activa inglés en el servicio de voz del sistema.';
    default:
      return Platform.OS === 'android'
        ? 'No pudimos iniciar el reconocimiento de voz. Revisa el servicio de reconocimiento elegido en los ajustes de Android.'
        : 'El reconocimiento de voz no está disponible. Activa el servicio de voz del sistema o usa un navegador compatible.';
  }
}

export function useSystemSTT() {
  const [phase, setPhase] = useState<'idle' | 'starting' | 'listening' | 'stopping'>('idle');
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [recordingUri, setRecordingUri] = useState<string>();
  const [message, setMessage] = useState('');
  const attempt = useRef<Attempt | null>(null);
  const savedRecording = useRef<File | undefined>(undefined);

  useEffect(() => {
    if (!recognition) return;
    const subscriptions = [
      recognition.addListener('start', () => {
        if (attempt.current?.started) setPhase('listening');
      }),
      recognition.addListener('result', (event) => {
        const current = attempt.current;
        if (!current?.started || current.failed) return;
        const value = event.results[0]?.transcript.trim() ?? '';
        if (!value) return;
        if (event.isFinal) current.finals.push(value);
        setTranscript((event.isFinal ? current.finals : [...current.finals, value]).join(' '));
      }),
      recognition.addListener('audioend', ({ uri }) => {
        const current = attempt.current;
        if (current?.audioFile && uri === current.audioFile.uri) current.audioEnded = true;
      }),
      recognition.addListener('error', (event) => {
        const current = attempt.current;
        if (!current?.started) return;
        current.failed = true;
        setMessage(recognitionError(event.error));
        setPhase('stopping');
      }),
      recognition.addListener('nomatch', () => {
        const current = attempt.current;
        if (!current?.started) return;
        current.failed = true;
        setMessage(recognitionError('nomatch'));
      }),
      recognition.addListener('end', () => {
        const current = attempt.current;
        if (!current?.started) return;
        clearTimeout(current.timeout);
        attempt.current = null;
        setPhase('idle');
        const final = current.failed ? '' : current.finals.join(' ');
        setTranscript(final);
        setFinalTranscript(final);
        if (!final && !current.failed) setMessage(recognitionError('no-speech'));
        if (current.audioEnded && current.audioFile && current.audioFile.size > 44) {
          savedRecording.current = current.audioFile;
          setRecordingUri(current.audioFile.uri);
        } else {
          discardRecording(current.audioFile);
        }
      }),
    ];
    return () => {
      const current = attempt.current;
      attempt.current = null;
      subscriptions.forEach((subscription) => subscription.remove());
      abortAttempt(current);
      discardRecording(savedRecording.current);
    };
  }, []);

  async function start(prepareAudio?: () => void) {
    if (attempt.current) return;
    if (!recognition) {
      setMessage(recognitionError('unavailable'));
      return;
    }
    const current: Attempt = { started: false, finals: [], failed: false };
    attempt.current = current;
    discardRecording(savedRecording.current);
    savedRecording.current = undefined;
    setRecordingUri(undefined);
    setTranscript('');
    setFinalTranscript('');
    setMessage('');
    setPhase('starting');
    try {
      if (!recognition.isRecognitionAvailable()) throw new Error('unavailable');
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
      if (recognition.supportsRecording()) {
        const name = `lingoquest-speech-${Date.now()}-${++recordingNumber}.wav`;
        current.audioFile = new File(Paths.cache, name);
      }
      current.started = true;
      current.timeout = setTimeout(() => fail(current, 'unavailable'), 25000);
      recognition.start({
        ...systemRecognitionOptions(Platform.OS),
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        recordingOptions: current.audioFile
          ? {
              persist: true,
              outputDirectory: Paths.cache.uri,
              outputFileName: current.audioFile.name,
            }
          : { persist: false },
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
    setTranscript('');
    if (!current.failed) setMessage(recognitionError(code));
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
    discardRecording(savedRecording.current);
    savedRecording.current = undefined;
    setRecordingUri(undefined);
    setPhase('idle');
    setTranscript('');
    setFinalTranscript('');
    setMessage('');
  }

  return {
    phase,
    transcript,
    finalTranscript,
    recordingUri,
    message,
    hasRecognitionModule: recognition !== null,
    start,
    stop,
    cancel,
  };
}
