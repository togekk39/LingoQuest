import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import {
  canCheckOnDeviceRecognition,
  hasMarmaladeRecognition,
  marmaladeRecognitionOptions,
  onDeviceRecognitionOptions,
  recognitionLocale,
  selectedRecognitionService,
} from './recognitionService';
import { speechRecognition as recognition } from './speechRecognitionModule';
import { stopOfflineSpeech } from './offlineSpeech';

export type RecognitionMode = 'on-device' | 'marmalade' | 'system';

type Attempt = {
  mode: RecognitionMode;
  started: boolean;
  finals: string[];
  failed: boolean;
  audioFile?: File;
  audioEnded?: boolean;
  timeout?: ReturnType<typeof setTimeout>;
};

export const onDeviceUnavailable =
  'El reconocimiento en el dispositivo no está disponible aquí. Puedes escuchar el ejemplo u omitir este paso.';
export const androidOnDeviceUnavailable =
  'El reconocedor integrado de Android no está disponible. Si instalaste Marmalade STT, completa su guía de configuración y vuelve aquí.';
const onDeviceLanguageUnavailable =
  'Instala el modelo de inglés (Estados Unidos) para reconocimiento sin conexión en los ajustes de voz de Android. También puedes omitir este paso.';
const marmaladeUnavailable =
  'No pudimos iniciar Marmalade STT. Actualiza la app y prueba el dictado desde Marmalade con un modelo de inglés instalado.';
const marmaladeLanguageUnavailable =
  'Marmalade STT está disponible. Descarga un modelo compatible con inglés desde su guía de configuración y vuelve a intentarlo.';

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

function recognitionError(code: string, mode: RecognitionMode) {
  const deviceUnavailable =
    Platform.OS === 'android' ? androidOnDeviceUnavailable : onDeviceUnavailable;
  switch (code) {
    case 'audio-preparation':
      return 'No pudimos preparar el audio para la práctica. Vuelve a intentarlo o continúa sin micrófono.';
    case 'on-device-unavailable':
      return deviceUnavailable;
    case 'on-device-language-unavailable':
      return onDeviceLanguageUnavailable;
    case 'marmalade-service-unavailable':
      return 'Android no encuentra el servicio de reconocimiento de Marmalade STT. Abre Marmalade y completa su guía de configuración.';
    case 'marmalade-language-unavailable':
      return marmaladeLanguageUnavailable;
    case 'service-unavailable':
      return 'El servicio de voz seleccionado no está disponible. Selecciona un servicio STT compatible con Android en los ajustes del sistema.';
    case 'not-allowed':
    case 'service-not-allowed':
      return mode === 'system'
        ? 'Permite el micrófono y el reconocimiento de voz en los ajustes del navegador o del sistema. También puedes omitir este paso.'
        : mode === 'marmalade'
          ? 'Permite el micrófono para LingoQuest y Marmalade STT en los ajustes de Android.'
          : 'Permite el micrófono en los ajustes de Android para reconocer tu voz, o continúa sin micrófono.';
    case 'audio-capture':
      return 'No se pudo abrir el micrófono. Comprueba que esté conectado y que otra aplicación no lo esté usando.';
    case 'no-speech':
    case 'nomatch':
      return 'No reconocimos palabras. Habla un poco más cerca del micrófono y vuelve a intentarlo.';
    case 'network':
      if (mode === 'marmalade') return marmaladeUnavailable;
      return mode === 'on-device'
        ? deviceUnavailable
        : 'El reconocimiento del sistema necesita conexión. Revisa tu red o continúa sin usar el micrófono.';
    case 'language-not-supported':
    case 'language-unavailable':
      if (mode === 'marmalade') return marmaladeLanguageUnavailable;
      return mode === 'on-device'
        ? onDeviceLanguageUnavailable
        : 'El reconocimiento de inglés no está disponible. Instala o activa inglés en el servicio de voz del sistema.';
    default:
      if (mode === 'marmalade') return marmaladeUnavailable;
      return mode === 'on-device'
        ? deviceUnavailable
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
  const [canTryOnDevice, setCanTryOnDevice] = useState(false);
  const [canTryMarmalade, setCanTryMarmalade] = useState(false);

  useEffect(() => {
    if (!recognition) return;
    const module = recognition;
    function refreshAndroidServices() {
      setCanTryOnDevice(
        canCheckOnDeviceRecognition(Platform.OS, Platform.Version) &&
          module.supportsOnDeviceRecognition(),
      );
      setCanTryMarmalade(hasMarmaladeRecognition(Platform.OS, Platform.Version, module));
    }
    if (Platform.OS === 'android') refreshAndroidServices();
    const appState =
      Platform.OS === 'android'
        ? AppState.addEventListener('change', (state) => {
            if (state === 'active') refreshAndroidServices();
          })
        : undefined;
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
        const final = current.failed ? '' : current.finals.join(' ');
        setTranscript(final);
        setFinalTranscript(final);
        if (!final && !current.failed) setMessage(recognitionError('no-speech', current.mode));
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
      appState?.remove();
      subscriptions.forEach((subscription) => subscription.remove());
      abortAttempt(current);
      discardRecording(savedRecording.current);
    };
  }, []);

  async function start(mode: RecognitionMode, prepareAudio?: () => void) {
    if (attempt.current) return;
    if (!recognition) {
      setMessage(recognitionError('unavailable', mode));
      return;
    }
    const current: Attempt = { mode, started: false, finals: [], failed: false };
    attempt.current = current;
    discardRecording(savedRecording.current);
    savedRecording.current = undefined;
    setRecordingUri(undefined);
    setTranscript('');
    setFinalTranscript('');
    setMessage('');
    setPhase('starting');
    try {
      let options;
      if (mode !== 'system') {
        current.timeout = setTimeout(() => fail(current, 'unavailable'), 5000);
        const localOptions =
          mode === 'marmalade' ? marmaladeRecognitionOptions : onDeviceRecognitionOptions;
        options = await localOptions(Platform.OS, Platform.Version, recognition);
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
      if (recognition.supportsRecording()) {
        const name = `lingoquest-speech-${Date.now()}-${++recordingNumber}.wav`;
        current.audioFile = new File(Paths.cache, name);
      }
      current.started = true;
      current.timeout = setTimeout(() => fail(current, 'unavailable'), 25000);
      recognition.start({
        ...options,
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
    canTryOnDevice,
    canTryMarmalade,
    hasRecognitionModule: recognition !== null,
    start,
    stop,
    cancel,
  };
}
