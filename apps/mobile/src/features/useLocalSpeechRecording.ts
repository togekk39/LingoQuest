import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { newId } from '../lib/api';

type Capture = { id: string; retry: boolean; uri: string; timestamp: number };
type Session = {
  id: string;
  cancelled: boolean;
  stopping?: boolean;
  uri?: string;
  timer?: ReturnType<typeof setTimeout>;
};

function discard(uri: string | null | undefined) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // The device may have already discarded the temporary file.
    // El dispositivo puede haber eliminado el archivo temporal.
  }
}

export function useLocalSpeechRecording() {
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'recording' | 'stopping'>('idle');
  const [capture, setCapture] = useState<Capture>();
  const [message, setMessage] = useState('');
  const saved = useRef<string | undefined>(undefined);
  const active = useRef<Session | undefined>(undefined);
  const hasRecorded = useRef(false);

  async function finish(session: Session) {
    if (active.current !== session || session.cancelled || session.stopping) return;
    session.stopping = true;
    clearTimeout(session.timer);
    setPhase('stopping');
    try {
      await recorder.stop();
      const uri = session.uri;
      if (session.cancelled) {
        discard(uri);
      } else if (uri) {
        saved.current = uri;
        setCapture({ id: session.id, retry: hasRecorded.current, uri, timestamp: Date.now() });
        hasRecorded.current = true;
      } else {
        setMessage('No pudimos guardar tu grabación. Vuelve a intentarlo.');
      }
    } catch {
      discard(session.uri);
      if (!session.cancelled) setMessage('No pudimos guardar tu grabación. Vuelve a intentarlo.');
    } finally {
      if (active.current === session) active.current = undefined;
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      if (!session.cancelled) setPhase('idle');
    }
  }

  async function start(prepareAudio: () => void) {
    if (active.current) return;
    const session: Session = { id: newId(), cancelled: false };
    active.current = session;
    discard(saved.current);
    saved.current = undefined;
    setCapture(undefined);
    setMessage('');
    setPhase('preparing');
    try {
      prepareAudio();
      const { granted } = await requestRecordingPermissionsAsync();
      if (session.cancelled) return;
      if (!granted) {
        setMessage('Permite el micrófono en los ajustes de Android para grabarte.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true });
      if (session.cancelled) return;
      await recorder.prepareToRecordAsync();
      session.uri = recorder.uri ?? undefined;
      if (session.cancelled) {
        discard(session.uri);
        return;
      }
      recorder.record();
      session.timer = setTimeout(() => void finish(session), 30000);
      setPhase('recording');
    } catch {
      discard(session.uri);
      if (!session.cancelled) setMessage('No pudimos abrir el micrófono. Vuelve a intentarlo.');
    } finally {
      if (!session.timer) {
        if (active.current === session) active.current = undefined;
        await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
        if (!session.cancelled) setPhase('idle');
      }
    }
  }

  function stop() {
    if (phase === 'recording' && active.current) void finish(active.current);
  }

  const discardRecording = useCallback(() => {
    const session = active.current;
    if (session && !session.cancelled) {
      session.cancelled = true;
      const started = !!session.timer;
      clearTimeout(session.timer);
      if (started && !session.stopping) {
        void (async () => {
          try {
            await recorder.stop();
          } catch {
            // Unmount may release the recorder before this cleanup runs.
            // Al salir se puede liberar la grabadora antes de esta limpieza.
          } finally {
            discard(session.uri);
            if (active.current === session) active.current = undefined;
            await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
          }
        })();
      }
    }
    discard(saved.current);
    saved.current = undefined;
  }, [recorder]);

  function cancel() {
    discardRecording();
    setCapture(undefined);
    setMessage('');
    setPhase('idle');
  }

  useEffect(() => discardRecording, [discardRecording]);

  return { phase, capture, message, start, stop, cancel };
}
