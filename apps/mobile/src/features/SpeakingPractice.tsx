import { JournalArt, Notebook, JournalLeaf } from '../Journal';
import { illustrations } from '../travel/illustrations';
import { audioClips } from '../travel/audioClips';
import { matchesSpeechTarget } from '../travel/speakingFeedback';
import { useTheme } from '../theme';
import { pausePracticePlayback } from './pausePracticePlayback';
import { playPracticeClip } from './playPracticeClip';
import { useSystemSTT } from './useSystemSTT';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import {
  getSpeechPreferences,
  speakOffline,
  stopOfflineSpeech,
  useOfflineSpeech,
} from './offlineSpeech';
import { ShieldCheck, Volume2 } from 'lucide-react-native';
import { Action, useFeatureStyles, FlowFrame, InputViewportContext } from './FeatureUI';

export type SpeakingPracticeMethod = 'recorded' | 'imitated';

export function SpeakingPanel({
  text,
  onDone,
  onPlay,
  onStopReference,
  story,
  allowSystemRecognition = false,
  feedback,
  acceptedPhrases,
}: {
  text: string;
  onDone: (method?: SpeakingPracticeMethod) => void;
  onPlay?: () => void;
  onStopReference?: () => void;
  story?: { continueLabel: string; saving: boolean };
  acceptedPhrases?: string[];
  allowSystemRecognition?: boolean;
  feedback?: (transcript: string) => { content: string; grammar: string };
}) {
  const { colors: palette } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();

  const stt = useSystemSTT();
  const [systemSelected, setSystemSelected] = useState(false);
  const android = Platform.OS === 'android';
  const showRecognition = android || systemSelected;
  const player = useAudioPlayer(null);
  const [message, setMessage] = useState('');
  const { playOffline, speechMessage } = useOfflineSpeech();
  const [comparing, setComparing] = useState(false);
  const comparison = useRef<AbortController | null>(null);
  const transcriptPanel = useRef<View>(null);
  const { revealItem } = useContext(InputViewportContext);
  const recognizing = stt.phase !== 'idle';
  const audioBusy = comparing || recognizing;
  const textFeedback = stt.finalTranscript && feedback?.(stt.finalTranscript);
  const passed = matchesSpeechTarget(stt.finalTranscript, text, acceptedPhrases);
  const transcript = stt.finalTranscript || stt.liveTranscript;
  const transcriptStatus =
    stt.phase === 'starting'
      ? 'Preparando el micrófono…'
      : stt.phase === 'stopping'
        ? 'Esperando el resultado final…'
        : 'Te escuchamos. Di tu frase en inglés.';

  useEffect(
    () => () => {
      comparison.current?.abort();
      void stopOfflineSpeech();
    },
    [],
  );

  useEffect(() => {
    if (!recognizing) return;
    let active = true;
    const frame = requestAnimationFrame(() => {
      const panel = transcriptPanel.current;
      if (panel) revealItem(panel, () => active && transcriptPanel.current === panel);
    });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [recognizing, revealItem]);

  function stopComparison() {
    comparison.current?.abort();
    comparison.current = null;
    setComparing(false);
    pausePracticePlayback(player, Platform.OS);
    void stopOfflineSpeech();
  }

  function finish(method?: SpeakingPracticeMethod) {
    try {
      stopComparison();
      onStopReference?.();
    } finally {
      stt.cancel();
      onDone(method);
    }
  }

  function playReference() {
    if (onPlay) onPlay();
    else void playOffline(text);
  }

  async function compareRecording(uri: string) {
    const run = new AbortController();
    comparison.current = run;
    setComparing(true);
    setMessage('');
    try {
      onStopReference?.();
      await stopOfflineSpeech();
      if (run.signal.aborted) return;
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (run.signal.aborted) return;
      const clip = audioClips[text];
      const played = clip
        ? await playPracticeClip(player, clip, (await getSpeechPreferences()).rate ?? 1, run.signal)
        : await speakOffline(text);
      if (!played && !run.signal.aborted) throw new Error('Reference audio unavailable');
      if (played && !run.signal.aborted) {
        await playPracticeClip(player, { uri }, 1, run.signal);
      }
    } catch {
      if (!run.signal.aborted) {
        setMessage('No pudimos reproducir la comparación. Vuelve a intentarlo.');
      }
    } finally {
      if (comparison.current === run && !run.signal.aborted) stopComparison();
    }
  }
  return (
    <View testID="speaking-studio" style={{ gap: 12 }}>
      <JournalArt source={illustrations.review} aspectRatio={3.1} taped />
      <Notebook title="Dale voz a lo que aprendiste.">
        <Text style={f.quiet}>Escucha el ejemplo y di la frase para comprobar tu respuesta.</Text>
        <Text style={f.eyebrow}>Tu frase para practicar</Text>
        <Text accessibilityLanguage="en-US" style={s.reference}>
          {text}
        </Text>
        <Pressable
          accessibilityRole="button"
          style={s.listen}
          disabled={audioBusy}
          accessibilityState={{ disabled: audioBusy }}
          onPress={() => {
            if (audioBusy) return;
            playReference();
          }}
        >
          <Volume2 color={palette.teal} size={19} />
          <Text style={s.listenText}>Escuchar ejemplo</Text>
        </Pressable>
      </Notebook>
      {!!speechMessage && (
        <Text accessibilityRole="alert" style={f.quiet}>
          {speechMessage}
        </Text>
      )}
      {showRecognition && stt.hasRecognitionModule ? (
        <>
          <Text style={f.quiet}>
            {android
              ? 'Se usará el servicio de voz elegido en Android. Ese servicio puede procesar tu audio en línea.'
              : 'El servicio de voz del sistema o del navegador puede procesar tu audio en línea.'}
          </Text>
          <Action
            disabled={comparing || story?.saving || stt.phase === 'stopping'}
            busy={stt.phase === 'starting'}
            onPress={() => {
              if (stt.phase === 'listening') stt.stop();
              else {
                setMessage('');
                void stt.start(() => {
                  onStopReference?.();
                  pausePracticePlayback(player, Platform.OS);
                });
              }
            }}
          >
            {stt.phase === 'listening'
              ? 'Terminar reconocimiento'
              : android
                ? 'Practicar hablando'
                : 'Practicar con mi voz'}
          </Action>
        </>
      ) : showRecognition ? (
        <Text style={f.quiet}>
          Esta versión de LingoQuest no incluye el módulo de voz. Instala una versión actualizada.
        </Text>
      ) : story ? (
        <Text style={f.quiet}>
          El reconocimiento de voz de la misión está disponible en Android.
        </Text>
      ) : null}
      {(recognizing || !!stt.finalTranscript) && (
        <View ref={transcriptPanel} collapsable={false} testID="speech-transcript">
          <JournalLeaf compact kind="notebook" style={f.card}>
            <Text style={f.eyebrow}>
              {stt.finalTranscript ? 'Esto entendió el sistema' : 'Transcripción en vivo'}
            </Text>
            <View accessibilityLiveRegion="polite" style={recognizing && s.liveTranscript}>
              {transcript ? (
                <Text accessibilityLanguage="en-US" style={f.body}>
                  {transcript}
                </Text>
              ) : (
                <Text style={f.quiet}>{transcriptStatus}</Text>
              )}
            </View>
            {textFeedback && (
              <>
                <Text style={f.eyebrow}>Contenido de la frase</Text>
                <Text style={f.body}>{textFeedback.content}</Text>
                <Text style={f.eyebrow}>Gramática de la lección</Text>
                <Text style={f.body}>{textFeedback.grammar}</Text>
              </>
            )}
            {!!stt.finalTranscript && (
              <Text style={f.quiet}>
                {passed
                  ? 'La frase reconocida cumple el objetivo.'
                  : 'La frase reconocida aún no coincide. Escucha el ejemplo e inténtalo otra vez.'}
              </Text>
            )}
          </JournalLeaf>
        </View>
      )}
      {!!stt.message && (
        <Text accessibilityRole="alert" style={f.body}>
          {stt.message}
        </Text>
      )}
      {stt.recordingUri && stt.phase === 'idle' && (
        <Action
          secondary
          disabled={story?.saving}
          onPress={() => {
            if (comparison.current) stopComparison();
            else if (stt.recordingUri) void compareRecording(stt.recordingUri);
          }}
        >
          {comparing ? 'Detener comparación' : 'Escuchar ejemplo y mi grabación'}
        </Action>
      )}
      {message ? (
        <JournalLeaf compact kind="notebook" accessibilityRole="alert" style={s.neutral}>
          <Text style={f.body}>{message}</Text>
        </JournalLeaf>
      ) : null}
      <View style={s.privacy}>
        <ShieldCheck size={19} color={palette.muted} />
        <Text style={[f.quiet, { flex: 1 }]}>
          Si el dispositivo permite grabar durante el reconocimiento, la copia local se elimina al
          volver a intentarlo o salir.
        </Text>
      </View>
      <Action
        journal={!!story}
        busy={story?.saving}
        disabled={!passed || stt.phase !== 'idle'}
        onPress={() => {
          if (passed && stt.phase === 'idle') {
            finish(story ? (stt.recordingUri ? 'recorded' : 'imitated') : undefined);
          }
        }}
      >
        {story?.continueLabel ?? 'Continuar con mi lección'}
      </Action>
      <Action secondary disabled={story?.saving} onPress={() => finish()}>
        Ahora no puedo hablar
      </Action>
      {allowSystemRecognition && !android && (
        <Action
          secondary
          disabled={audioBusy}
          onPress={() => {
            stt.cancel();
            setSystemSelected(!systemSelected);
            setMessage('');
          }}
        >
          {systemSelected
            ? 'Ocultar la opción de reconocimiento'
            : 'Ver opción de reconocimiento que puede usar internet'}
        </Action>
      )}
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
      journal={{}}
      title="Tu voz, tu inglés"
      eyebrow="Práctica de pronunciación"
      onClose={onClose ?? onDone}
    >
      <SpeakingPanel text={text} onDone={onDone} allowSystemRecognition />
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
    liveTranscript: { minHeight: 48 },
    listen: { flexDirection: 'row', gap: 9, alignItems: 'center', minHeight: 44 },
    listenText: { fontFamily: 'Manrope', fontSize: 14, color: palette.teal, fontWeight: '700' },
    privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    neutral: { padding: 20, backgroundColor: tone('#EEF5F0', 'background'), borderRadius: 17 },
  });
}

export { SpeakingPractice };
