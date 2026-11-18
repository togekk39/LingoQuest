import { useTheme } from '../theme';
import { pausePracticePlayback } from './pausePracticePlayback';
import { useSystemSTT } from './useSystemSTT';
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
import { Action, useFeatureStyles, FlowFrame } from './FeatureUI';
export function SpeakingPanel({ text, onDone }: { text: string; onDone: () => void }) {
  const { colors: palette } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();

  const stt = useSystemSTT();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const player = useAudioPlayer(null);
  const [uri, setUri] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const { playOffline, speechMessage } = useOfflineSpeech();
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState(false);
  const recordingUri = useRef<string | null>(null);
  const mounted = useRef(true);
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
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void stopOfflineSpeech();
      const activeRecorder = recorderRef.current;
      void (async () => {
        try {
          if (activeRecorder.isRecording) await activeRecorder.stop();
        } catch {
          /* The native recorder may already be released. */
        }
        removeRecording(recordingUri.current ?? activeRecorder.uri);
        try {
          await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        } catch {
          /* Audio resources may already be released. */
        }
      })();
    };
  }, []);
  async function startRecording() {
    setBusy(true);
    setMessage('');
    try {
      stt.cancel();
      await stopOfflineSpeech();
      if (!mounted.current) return;
      const result = await AudioModule.requestRecordingPermissionsAsync();
      if (!mounted.current) return;
      if (!result.granted) {
        setMessage(
          'El micrófono está desactivado. Puedes seguir aprendiendo y volver cuando quieras.',
        );
        setPermission(false);
        return;
      }
      setPermission(true);
      pausePracticePlayback(player, Platform.OS);
      removeRecording(recordingUri.current);
      recordingUri.current = null;
      setUri(null);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      if (!mounted.current) return;
      await recorder.prepareToRecordAsync();
      if (!mounted.current) {
        await recorder.stop();
        removeRecording(recorder.uri);
        return;
      }
      recorder.record();
    } catch {
      if (!mounted.current) return;
      setMessage(
        Platform.OS === 'web'
          ? 'No pudimos iniciar la grabación. Comprueba que el navegador admita grabación de audio, usa HTTPS y revisa si otra aplicación está usando el micrófono.'
          : 'No pudimos iniciar la grabación. Revisa si otra aplicación está usando el micrófono y vuelve a intentarlo.',
      );
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function stopRecording() {
    setBusy(true);
    try {
      await recorder.stop();
      const path = recorder.uri;
      if (!mounted.current) {
        removeRecording(path);
        return;
      }
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
      if (mounted.current) setBusy(false);
    }
  }
  async function finish() {
    stt.cancel();
    try {
      if (recorder.isRecording) await recorder.stop();
      pausePracticePlayback(player, Platform.OS);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
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
          disabled={busy || stt.phase !== 'idle' || recorderState.isRecording}
          accessibilityState={{
            disabled: busy || stt.phase !== 'idle' || recorderState.isRecording,
          }}
          onPress={() => {
            if (stt.phase === 'idle' && !recorderState.isRecording && !busy) void playOffline(text);
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
      <Text style={f.quiet}>
        Al practicar con reconocimiento, el servicio de voz del sistema o del navegador puede
        procesar tu audio en línea. El texto es orientativo y no es una nota de pronunciación. Si
        prefieres practicar sin conexión, elige solo grabar.
      </Text>
      <Action
        disabled={busy || recorderState.isRecording || stt.phase === 'stopping'}
        busy={stt.phase === 'starting'}
        onPress={() => {
          if (stt.phase === 'listening') stt.stop();
          else {
            setMessage('');
            void stt.start(() => pausePracticePlayback(player, Platform.OS));
          }
        }}
      >
        {stt.phase === 'listening' ? 'Terminar reconocimiento' : 'Practicar con mi voz'}
      </Action>
      {stt.phase === 'listening' && (
        <Text accessibilityLiveRegion="polite" style={f.quiet}>
          Te escuchamos. Lee la frase en inglés.
        </Text>
      )}
      {!!stt.transcript && (
        <View accessibilityLiveRegion="polite" style={f.card}>
          <Text style={f.eyebrow}>Esto entendió el sistema</Text>
          <Text style={f.body}>{stt.transcript}</Text>
          <Text style={f.quiet}>
            Compara el texto con la frase y vuelve a practicar cuando quieras.
          </Text>
        </View>
      )}
      {!!stt.message && (
        <Text accessibilityRole="alert" style={f.body}>
          {stt.message}
        </Text>
      )}
      {recorderState.isRecording ? (
        <Action
          secondary
          busy={busy}
          disabled={stt.phase !== 'idle'}
          onPress={() => {
            void stopRecording();
          }}
        >
          Terminar grabación
        </Action>
      ) : (
        <Action
          secondary
          busy={busy}
          disabled={stt.phase !== 'idle'}
          onPress={() => {
            void startRecording();
          }}
        >
          {uri
            ? 'Grabar otra vez sin reconocimiento'
            : 'Solo grabar y escuchar (sin reconocimiento)'}
        </Action>
      )}
      {uri && (
        <Action
          secondary
          disabled={busy || stt.phase !== 'idle' || recorderState.isRecording}
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
          En el modo solo grabar, tu audio permanece en este dispositivo y se elimina al salir. No
          guardamos el audio ni el texto del reconocimiento.{' '}
          {permission ? '' : 'Tú decides si activas el micrófono.'}
        </Text>
      </View>
      <Action
        secondary
        onPress={() => {
          void finish();
        }}
      >
        {uri || stt.transcript ? 'Continuar con mi lección' : 'Ahora no puedo hablar'}
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
export function useStyles() {
  const { colors: palette, tone } = useTheme();
  return StyleSheet.create({
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
    neutral: { padding: 20, backgroundColor: tone('#EEF5F0', 'background'), borderRadius: 17 },
  });
}

export { SpeakingPractice };
