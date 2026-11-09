import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { stopOfflineSpeech, useOfflineSpeech } from './offlineSpeech';
import { AudioLines, ShieldCheck, Volume2 } from 'lucide-react-native';
import { Action, f, FlowFrame, palette } from './FeatureUI';
export function SpeakingPanel({ text, onDone }: { text: string; onDone: () => void }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const player = useAudioPlayer(null);
  const [uri, setUri] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const { playOffline, speechMessage } = useOfflineSpeech();
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState(false);
  const recordingUri = useRef<string | null>(null);
  const recorderRef = useRef(recorder);
  recorderRef.current = recorder;
  const removeRecording = (path: string | null) => {
    if (!path) return;
    try {
      if (Platform.OS === 'web') {
        if (path.startsWith('blob:')) URL.revokeObjectURL(path);
      } else {
        const file = new File(path);
        if (file.exists) file.delete();
      }
    } catch {
      /* The recording may already have been released by the recorder. */
    }
  };
  useEffect(
    () => () => {
      void stopOfflineSpeech();
      const activeRecorder = recorderRef.current;
      void (async () => {
        try {
          if (activeRecorder.isRecording) await activeRecorder.stop();
        } catch {
          /* The native recorder may already be released. */
        }
        removeRecording(recordingUri.current ?? activeRecorder.uri);
      })();
    },
    [],
  );
  async function startRecording() {
    setBusy(true);
    setMessage('');
    try {
      const result = await AudioModule.requestRecordingPermissionsAsync();
      if (!result.granted) {
        setMessage(
          'El micrófono está desactivado. Puedes seguir aprendiendo y volver cuando quieras.',
        );
        setPermission(false);
        return;
      }
      setPermission(true);
      player.pause();
      player.replace(null);
      removeRecording(recordingUri.current);
      recordingUri.current = null;
      setUri(null);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      setMessage(
        'No pudimos abrir el micrófono. Revisa el permiso del navegador o del dispositivo, o continúa sin grabar.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function stopRecording() {
    setBusy(true);
    try {
      await recorder.stop();
      const path = recorder.uri;
      recordingUri.current = path;
      setUri(path);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      setMessage(
        'Escucha tu grabación y compara con la frase escrita. Esta práctica es local y no genera una calificación automática de pronunciación.',
      );
    } catch {
      setMessage(
        'No pudimos guardar la grabación. Puedes intentarlo otra vez o continuar sin grabar.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    try {
      if (recorder.isRecording) await recorder.stop();
      player.pause();
      player.replace(null);
    } catch {
      /* Closing practice should always work. */
    }
    removeRecording(recordingUri.current ?? recorder.uri);
    recordingUri.current = null;
    setUri(null);
    onDone();
  }
  return (
    <View style={{ gap: 22 }}>
      <View style={s.speechIcon}>
        <AudioLines size={40} color={palette.teal} strokeWidth={1.5} />
      </View>
      <Text style={f.title}>Dale voz a lo que aprendiste.</Text>
      <Text style={f.body}>
        Esta parte es opcional. Lee, repite y descubre cómo suena tu inglés. Puedes grabarte sin
        conexión. Tu acento también cuenta tu historia.
      </Text>
      <View style={f.card}>
        <Text style={f.eyebrow}>Tu frase para practicar</Text>
        <Text style={s.reference}>{text}</Text>
        <Pressable
          accessibilityRole="button"
          style={s.listen}
          onPress={() => {
            void playOffline(text);
          }}
        >
          <Volume2 color={palette.teal} size={19} />
          <Text style={s.listenText}>Escuchar ejemplo</Text>
        </Pressable>
      </View>
      {!!speechMessage && (
        <Text accessibilityRole="alert" style={f.quiet}>
          {speechMessage}
        </Text>
      )}
      {recorderState.isRecording ? (
        <Action
          busy={busy}
          onPress={() => {
            void stopRecording();
          }}
        >
          Terminar grabación
        </Action>
      ) : (
        <Action
          busy={busy}
          onPress={() => {
            void startRecording();
          }}
        >
          {uri ? 'Grabar otra vez' : 'Practicar con mi voz'}
        </Action>
      )}
      {uri && (
        <Action
          secondary
          onPress={() => {
            player.replace({ uri });
            player.play();
          }}
        >
          Escuchar mi grabación
        </Action>
      )}
      {message ? (
        <View accessibilityRole="alert" style={s.neutral}>
          <Text style={f.body}>{message}</Text>
        </View>
      ) : null}
      <View style={s.privacy}>
        <ShieldCheck size={19} color={palette.muted} />
        <Text style={[f.quiet, { flex: 1 }]}>
          Tu audio permanece en este dispositivo durante la práctica y se elimina al salir. No se
          envía a terceros. {permission ? '' : 'Tú decides si activas el micrófono.'}
        </Text>
      </View>
      <Action
        secondary
        onPress={() => {
          void finish();
        }}
      >
        {uri ? 'Continuar con mi lección' : 'Ahora no puedo hablar'}
      </Action>
    </View>
  );
}
export default function SpeakingPractice({
  text = 'Hello! I am learning English, one step at a time.',
  onDone,
  onClose,
}: {
  text?: string;
  onDone: () => void;
  onClose?: () => void;
}) {
  return (
    <FlowFrame
      title="Tu voz, tu inglés"
      eyebrow="Práctica de pronunciación"
      onClose={onClose ?? onDone}
    >
      <SpeakingPanel text={text} onDone={onDone} />
    </FlowFrame>
  );
}
const s = StyleSheet.create({
  speechIcon: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: palette.mint,
  },
  reference: { fontFamily: 'Outfit', fontSize: 28, lineHeight: 38, color: palette.ink },
  listen: { flexDirection: 'row', gap: 9, alignItems: 'center', minHeight: 44 },
  listenText: { fontFamily: 'Manrope', fontSize: 14, color: palette.teal, fontWeight: '700' },
  privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  neutral: { padding: 20, backgroundColor: '#EEF5F0', borderRadius: 17 },
});

export { SpeakingPractice };
