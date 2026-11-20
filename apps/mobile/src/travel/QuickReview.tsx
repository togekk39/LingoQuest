import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Text, View } from 'react-native';
import type { QuickReviewState } from '@lingoquest/offline-engine';
import { api } from '../lib/api';
import { useTheme } from '../theme';
import { Action, ErrorCard, FlowFrame, useFeatureStyles } from '../features/FeatureUI';
import { ExerciseInput, hasAnswer, type ExerciseAnswer } from '../features/ExerciseInput';
import { JournalArt, Notebook } from '../Journal';
import { Volume2 } from 'lucide-react-native';
import { Button } from '../ui';
import { illustrations } from './illustrations';
import { AnswerFeedback } from '../features/LessonStages';
import { useChapterAudio } from './useChapterAudio';

export function QuickReview({
  onClose,
  onVoiceSettings,
  target,
  missionId,
}: {
  onClose: () => void;
  onVoiceSettings?: () => void;
  target?: string;
  missionId?: string;
}) {
  const path =
    '/v1/reviews/quick?source=travel' +
    (target ? `&target=${encodeURIComponent(target)}` : '') +
    (missionId ? `&mission=${encodeURIComponent(missionId)}` : '');
  const { colors } = useTheme();
  const f = useFeatureStyles();
  const { play, stop, speechMessage } = useChapterAudio();
  const [review, setReview] = useState<QuickReviewState | null>(null);
  const [answer, setAnswer] = useState<ExerciseAnswer>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const writes = useRef(Promise.resolve());
  const pending = useRef(false);
  const load = useCallback(async () => {
    setError('');
    try {
      const next = await api<QuickReviewState>(path);
      setReview(next);
      setAnswer(next.answer);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [path]);
  useEffect(() => {
    void load();
  }, [load]);
  function draft(next: ExerciseAnswer) {
    setAnswer(next);
    if (!review) return;
    const token = review.token;
    // Enqueue immediately so the local write can begin before the app is backgrounded.
    // Encola de inmediato para empezar a guardar antes de pasar a segundo plano.
    const write = api(path, { action: 'draft', token, answer: next });
    writes.current = write.then(() => setError('')).catch((e) => setError(e.message));
  }
  async function act(action: 'answer' | 'hint' | 'transcript' | 'close') {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await writes.current;
      if (!review) {
        stop();
        onClose();
        return;
      }
      if (review.result || action === 'close') {
        if (review.result) await api(path, { action: 'dismiss', token: review.token });
        else await api(path, { action: 'draft', token: review.token, answer });
        stop();
        onClose();
        return;
      }
      if (action === 'answer') Keyboard.dismiss();
      const next = await api<QuickReviewState>(path, {
        action,
        token: review.token,
        ...(action === 'answer' ? { answer } : {}),
      });
      setReview(next);
      setAnswer(next.answer);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const exercise = review?.exercise;
  const audio = review?.audio;
  return (
    <FlowFrame
      journal={{}}
      title="Repaso rápido"
      eyebrow={
        review?.reason === 'remediation'
          ? 'Refuerza una idea · 1 min'
          : review?.reason === 'due'
            ? 'Recuerda lo aprendido · 1 min'
            : 'Una situación · 1 min'
      }
      onClose={() => void act('close')}
      onVoiceSettings={
        audio && onVoiceSettings
          ? () => {
              stop();
              onVoiceSettings();
            }
          : undefined
      }
      feedback={
        review?.result && exercise ? (
          <AnswerFeedback result={review.result} exercise={exercise} answer={answer} />
        ) : undefined
      }
      footer={
        exercise ? (
          <Action
            journal
            busy={busy}
            disabled={!review?.result && !hasAnswer(answer, exercise)}
            onPress={() => void act(review?.result ? 'close' : 'answer')}
          >
            {review?.result ? 'Volver al viaje' : 'Comprobar respuesta'}
          </Action>
        ) : undefined
      }
    >
      {!!error && <ErrorCard message={error} onRetry={review ? undefined : () => void load()} />}
      {!exercise && !error && <ActivityIndicator color={colors.teal} />}
      {exercise && review && (
        <View style={{ gap: 15 }}>
          <JournalArt source={illustrations.review} aspectRatio={2.9} taped />
          <Notebook title="Ponlo en práctica">
            {review.situation ? (
              <Text style={f.body}>{review.situation}</Text>
            ) : review.starter ? (
              <Text style={f.body}>
                En la plaza, Luz te enseña una palabra para saludar:{' '}
                <Text style={f.cardTitle}>hi</Text> significa «hola».
              </Text>
            ) : null}
            {audio && (
              <Button variant="secondary" icon={Volume2} onPress={() => void play(audio, true)}>
                Escuchar el mensaje
              </Button>
            )}
            {review.transcriptText &&
              (review.transcript || review.result ? (
                <Text accessibilityLanguage="en-US" style={f.body}>
                  {review.transcriptText}
                </Text>
              ) : (
                <Button variant="ghost" disabled={busy} onPress={() => void act('transcript')}>
                  Leer la transcripción
                </Button>
              ))}
            {!!speechMessage && (
              <Text accessibilityRole="alert" style={f.quiet}>
                {speechMessage}
              </Text>
            )}
            <ExerciseInput
              journal
              exercise={exercise}
              kindLabel={audio ? 'Comprensión auditiva' : undefined}
              answer={answer}
              setAnswer={draft}
              disabled={busy || !!review.result}
            />
            {review.hintText &&
              !review.result &&
              (review.hint ? (
                <Text accessibilityLiveRegion="polite" style={f.body}>
                  {review.hintText}
                </Text>
              ) : (
                <Button variant="ghost" disabled={busy} onPress={() => void act('hint')}>
                  Pedir una pista
                </Button>
              ))}
          </Notebook>
        </View>
      )}
    </FlowFrame>
  );
}
