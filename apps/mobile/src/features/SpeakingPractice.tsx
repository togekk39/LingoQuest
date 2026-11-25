import { JournalArt, Notebook, JournalLeaf } from '../Journal';
import { illustrations } from '../travel/illustrations';
import { audioClips } from '../travel/audioClips';
import { matchesSpeechTarget } from '../travel/speakingFeedback';
import { StoryActivity } from '../travel/StoryDialogueAppearance';
import { useTheme } from '../theme';
import { pausePracticePlayback } from './pausePracticePlayback';
import { playPracticeClip } from './playPracticeClip';
import { useLocalSpeechRecording } from './useLocalSpeechRecording';
import { useSystemSTT } from './useSystemSTT';
import React, { useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import {
  getAvailableChapterAudio,
  getSpeechPreferences,
  speakOffline,
  stopOfflineSpeech,
  useOfflineSpeech,
} from './offlineSpeech';
import { ShieldCheck, Volume2 } from 'lucide-react-native';
import { Action, useFeatureStyles, FlowFrame, InputViewportContext } from './FeatureUI';
import { api } from '../lib/api';

export type SpeakingPracticeMethod = 'recorded' | 'imitated';
export type SpeakingPanelHandle = { stop: () => void };
type SpeechEvidenceScope = {
  source: 'story' | 'study' | 'drill' | 'travel-guide';
  materialId: string;
  itemId: string;
  submissionId?: string;
};

export function SpeakingPanel({
  text,
  chapterId,
  displayText,
  onDone,
  onPlay,
  onStopReference,
  story,
  selfCheck = false,
  allowSystemRecognition = false,
  feedback,
  acceptedPhrases,
  exampleLabel,
  matchesTranscript,
  evidenceScope,
  inline = false,
  ref,
}: {
  text: string;
  chapterId?: string;
  displayText?: string;
  onDone: (method?: SpeakingPracticeMethod) => void;
  onPlay?: () => void;
  onStopReference?: () => void;
  story?: { continueLabel: string; saving: boolean };
  selfCheck?: boolean;
  acceptedPhrases?: string[];
  exampleLabel?: string;
  matchesTranscript?: (transcript: string) => boolean;
  allowSystemRecognition?: boolean;
  feedback?: (transcript: string) => { content: string; grammar: string };
  evidenceScope?: SpeechEvidenceScope;
  inline?: boolean;
  ref?: React.Ref<SpeakingPanelHandle>;
}) {
  const { colors: palette } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();
  const Section = inline ? StoryActivity : Notebook;

  const stt = useSystemSTT();
  const local = useLocalSpeechRecording();
  const [systemSelected, setSystemSelected] = useState(false);
  const android = Platform.OS === 'android';
  const showRecognition = android || systemSelected;
  const player = useAudioPlayer(null);
  const [message, setMessage] = useState('');
  const { playOffline, speechMessage, stop: stopAudio } = useOfflineSpeech(chapterId);
  const [comparing, setComparing] = useState(false);
  const comparison = useRef<AbortController | null>(null);
  const sent = useRef<string | undefined>(undefined);
  const transcriptPanel = useRef<View>(null);
  const { revealItem } = useContext(InputViewportContext);
  const recognizing = stt.phase !== 'idle';
  const localBusy = local.phase !== 'idle';
  const audioBusy = comparing || recognizing || localBusy;
  const recordingUri = local.capture?.uri ?? stt.recordingUri;
  const textFeedback = !selfCheck && stt.finalTranscript && feedback?.(stt.finalTranscript);
  const passed =
    !selfCheck &&
    (matchesTranscript
      ? matchesTranscript(stt.finalTranscript)
      : matchesSpeechTarget(stt.finalTranscript, text, acceptedPhrases));
  const canContinue = selfCheck || passed || !!local.capture;
  const transcript = stt.finalTranscript || stt.liveTranscript;
  const completed = stt.completed ?? local.capture;
  const recording = stt.completed?.recording ?? !!local.capture;
  const [saveError, setSaveError] = useState(false);
  const [saveRetry, setSaveRetry] = useState(0);
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
    if (!evidenceScope || !completed || sent.current === completed.id) return;
    const recognition =
      !selfCheck && stt.completed
        ? stt.completed.transcript
          ? passed
            ? 'matched'
            : 'unmatched'
          : 'empty'
        : undefined;
    if (!recognition && !recording) return;
    sent.current = completed.id;
    const id = evidenceScope.submissionId
      ? `${evidenceScope.submissionId}:${completed.id}`
      : completed.id;
    setSaveError(false);
    const path =
      chapterId && chapterId !== 'home' && evidenceScope.source === 'story'
        ? `/v1/speech/practice?chapter=${encodeURIComponent(chapterId)}`
        : '/v1/speech/practice';
    void api(path, {
      id,
      source: evidenceScope.source,
      materialId: evidenceScope.materialId,
      itemId: evidenceScope.itemId,
      retry: completed.retry,
      timestamp: completed.timestamp,
      ...(recognition ? { recognition } : {}),
      recording,
    }).catch(() => {
      if (sent.current !== completed.id) return;
      setSaveError(true);
    });
  }, [chapterId, completed, evidenceScope, passed, recording, saveRetry, selfCheck, stt.completed]);

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

  function stopPractice() {
    try {
      stopComparison();
      stopAudio();
      onStopReference?.();
    } finally {
      stt.cancel();
      local.cancel();
    }
  }

  useImperativeHandle(ref, () => ({ stop: stopPractice }));

  function finish(method?: SpeakingPracticeMethod) {
    try {
      stopPractice();
    } finally {
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
      stopAudio();
      onStopReference?.();
      await stopOfflineSpeech();
      if (run.signal.aborted) return;
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (run.signal.aborted) return;
      const [downloaded, preferences] = await Promise.all([
        getAvailableChapterAudio(chapterId, text),
        getSpeechPreferences().catch(() => ({ rate: null })),
      ]);
      if (run.signal.aborted) return;
      const rate = preferences.rate ?? 1;
      const downloadedPlayed =
        downloaded &&
        (await playPracticeClip(player, downloaded, rate, run.signal).catch(() => false));
      if (run.signal.aborted) return;
      const bundled = audioClips[text];
      const played =
        downloadedPlayed ||
        (bundled
          ? await playPracticeClip(player, bundled, rate, run.signal).catch(() => false)
          : await speakOffline(text));
      if (!run.signal.aborted) {
        if (!played) setMessage('Por ahora solo podemos reproducir tu grabación.');
        const recordingPlayed = await playPracticeClip(player, { uri }, 1, run.signal);
        if (!recordingPlayed && !run.signal.aborted) throw new Error('Recording unavailable');
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
      {!inline && <JournalArt source={illustrations.review} aspectRatio={3.1} taped />}
      <Section title="Dale voz a lo que aprendiste.">
        <Text style={f.quiet}>
          {selfCheck
            ? 'Escucha el modelo, da tu propia respuesta y revísala con las indicaciones de la misión.'
            : displayText
              ? 'Escucha cómo empezar. Completa el saludo con tu propio nombre.'
              : 'Escucha el ejemplo y di la frase para comprobar tu respuesta.'}
        </Text>
        <Text style={f.eyebrow}>{exampleLabel ?? 'Tu frase para practicar'}</Text>
        <Text
          {...(Platform.OS === 'web' ? { lang: 'en-US' } : { accessibilityLanguage: 'en-US' })}
          style={s.reference}
        >
          {displayText ?? text}
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
      </Section>
      {!!speechMessage && (
        <Text accessibilityRole="alert" style={f.quiet}>
          {speechMessage}
        </Text>
      )}
      {android && (
        <Action
          secondary
          disabled={comparing || recognizing || local.phase === 'stopping' || story?.saving}
          busy={local.phase === 'preparing'}
          onPress={() => {
            if (local.phase === 'recording') local.stop();
            else {
              stt.cancel();
              void local.start(() => {
                stopAudio();
                onStopReference?.();
                pausePracticePlayback(player, Platform.OS);
              });
            }
          }}
        >
          {local.phase === 'recording' ? 'Terminar grabación' : 'Grabar sin conexión'}
        </Action>
      )}
      {showRecognition && stt.hasRecognitionModule ? (
        <>
          <Text style={f.quiet}>
            {android
              ? 'Se usará el servicio de voz elegido en Android. Ese servicio puede procesar tu audio en línea.'
              : 'El servicio de voz del sistema o del navegador puede procesar tu audio en línea.'}
          </Text>
          <Action
            disabled={comparing || localBusy || story?.saving || stt.phase === 'stopping'}
            busy={stt.phase === 'starting'}
            onPress={() => {
              if (stt.phase === 'listening') stt.stop();
              else {
                local.cancel();
                setMessage('');
                void stt.start(() => {
                  stopAudio();
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
      ) : story && !allowSystemRecognition ? (
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
              <>
                <Text style={f.quiet}>
                  {selfCheck
                    ? 'Lee lo que entendió el sistema y revisa tu respuesta con las indicaciones de la misión.'
                    : passed
                      ? 'La frase reconocida cumple el objetivo.'
                      : matchesTranscript
                        ? 'Revisa el saludo, la forma de presentación y el nombre en la transcripción.'
                        : 'La frase reconocida aún no coincide. Escucha el ejemplo e inténtalo otra vez.'}
                </Text>
                <Text style={f.quiet}>
                  Las palabras transcritas dan una pista sobre el contenido. La pronunciación y la
                  conversación espontánea siguen sin verificar.
                </Text>
              </>
            )}
          </JournalLeaf>
        </View>
      )}
      {!!stt.message && (
        <Text accessibilityRole="alert" style={f.body}>
          {stt.message}
        </Text>
      )}
      {!!local.message && (
        <Text accessibilityRole="alert" style={f.body}>
          {local.message}
        </Text>
      )}
      {saveError && completed && (
        <Action
          secondary
          onPress={() => {
            sent.current = undefined;
            setSaveRetry(saveRetry + 1);
          }}
        >
          Reintentar guardar la práctica
        </Action>
      )}
      {recordingUri && stt.phase === 'idle' && !localBusy && (
        <Action
          secondary
          disabled={story?.saving}
          onPress={() => {
            if (comparison.current) stopComparison();
            else void compareRecording(recordingUri);
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
          La grabación local se elimina al volver a intentarlo o salir. Escúchala para comparar los
          sonidos por tu cuenta.
        </Text>
      </View>
      <Action
        journal={!!story}
        busy={story?.saving}
        disabled={!canContinue || localBusy || stt.phase !== 'idle'}
        onPress={() => {
          if (!localBusy && canContinue && stt.phase === 'idle') {
            finish(story ? (recordingUri ? 'recorded' : 'imitated') : undefined);
          }
        }}
      >
        {selfCheck
          ? 'Ya revisé mi respuesta'
          : (story?.continueLabel ?? 'Continuar con mi lección')}
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
  evidenceScope,
}: {
  text?: string;
  onDone: () => void;
  onClose?: () => void;
  evidenceScope?: SpeechEvidenceScope;
}) {
  return (
    <FlowFrame
      journal={{}}
      title="Tu voz, tu inglés"
      eyebrow="Práctica de pronunciación"
      onClose={onClose ?? onDone}
    >
      <SpeakingPanel
        text={text}
        onDone={onDone}
        evidenceScope={evidenceScope}
        allowSystemRecognition
      />
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
