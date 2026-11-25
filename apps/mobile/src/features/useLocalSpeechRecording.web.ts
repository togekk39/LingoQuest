import { useCallback, useEffect, useRef, useState } from 'react';
import { newId } from '../lib/api';

type Capture = { id: string; retry: boolean; uri: string; timestamp: number };
type Session = {
  id: string;
  recorder?: MediaRecorder;
  timer?: ReturnType<typeof setTimeout>;
};

export function useLocalSpeechRecording() {
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'recording' | 'stopping'>('idle');
  const [capture, setCapture] = useState<Capture>();
  const [message, setMessage] = useState('');
  const active = useRef<Session | undefined>(undefined);
  const saved = useRef<string | undefined>(undefined);
  const hasRecorded = useRef(false);

  const discard = useCallback(() => {
    const session = active.current;
    active.current = undefined;
    clearTimeout(session?.timer);
    const recorder = session?.recorder;
    if (recorder?.state === 'recording') recorder.stop();
    recorder?.stream.getTracks().forEach((track) => track.stop());
    if (saved.current) URL.revokeObjectURL(saved.current);
    saved.current = undefined;
  }, []);

  useEffect(() => discard, [discard]);

  function stop() {
    const session = active.current;
    if (session?.recorder?.state !== 'recording') return;
    setPhase('stopping');
    clearTimeout(session.timer);
    session.recorder.stop();
  }

  async function start(prepareAudio: () => void) {
    if (active.current) return;
    discard();
    const session: Session = { id: newId() };
    active.current = session;
    setPhase('preparing');
    setMessage('');
    setCapture(undefined);
    let stream: MediaStream | undefined;
    try {
      prepareAudio();
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (active.current !== session) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const recorder = new MediaRecorder(stream);
      session.recorder = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = ({ data }) => {
        if (data.size) chunks.push(data);
      };
      recorder.onerror = () => {
        if (active.current !== session) return;
        discard();
        setMessage('No pudimos guardar tu grabación. Vuelve a intentarlo.');
        setPhase('idle');
      };
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((track) => track.stop());
        if (active.current !== session) return;
        active.current = undefined;
        clearTimeout(session.timer);
        if (chunks.length) {
          const uri = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType }));
          saved.current = uri;
          setCapture({ id: session.id, retry: hasRecorded.current, uri, timestamp: Date.now() });
          hasRecorded.current = true;
        } else setMessage('No pudimos guardar tu grabación. Vuelve a intentarlo.');
        setPhase('idle');
      };
      recorder.start();
      session.timer = setTimeout(stop, 30000);
      setPhase('recording');
    } catch {
      stream?.getTracks().forEach((track) => track.stop());
      if (active.current !== session) return;
      discard();
      setMessage('Permite el micrófono en el navegador para poder grabarte.');
      setPhase('idle');
    }
  }

  function cancel() {
    discard();
    setCapture(undefined);
    setMessage('');
    setPhase('idle');
  }

  return { phase, capture, message, start, stop, cancel };
}
