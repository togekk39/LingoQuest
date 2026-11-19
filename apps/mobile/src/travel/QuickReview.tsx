import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Text, View } from 'react-native';
import type { QuickReviewState } from '@lingoquest/offline-engine';
import { api } from '../lib/api';
import { useTheme } from '../theme';
import { Action, ErrorCard, FlowFrame, useFeatureStyles } from '../features/FeatureUI';
import { ExerciseInput, hasAnswer, type ExerciseAnswer } from '../features/ExerciseInput';
import { JournalArt, Notebook } from '../Journal';
import { illustrations } from './illustrations';
import { AnswerFeedback } from '../features/LessonStages';

const path = '/v1/reviews/quick?source=travel';

export function QuickReview({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const f = useFeatureStyles();
  const [review, setReview] = useState<QuickReviewState | null>(null);
  const [answer, setAnswer] = useState<ExerciseAnswer>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const writes = useRef(Promise.resolve());
  const pending = useRef(false);
  async function load() {
    setError('');
    try {
      const next = await api<QuickReviewState>(path);
      setReview(next);
      setAnswer(next.answer);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function draft(next: ExerciseAnswer) {
    setAnswer(next);
    if (!review) return;
    const token = review.token;
    // Enqueue immediately so the local write can begin before the app is backgrounded.
    // Encola de inmediato para empezar a guardar antes de pasar a segundo plano.
    const write = api(path, { action: 'draft', token, answer: next });
    writes.current = write.then(() => setError('')).catch((e) => setError(e.message));
  }
  async function finish(close = false) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await writes.current;
      if (!review) {
        onClose();
        return;
      }
      if (review.result || close) {
        if (review.result) await api(path, { action: 'dismiss', token: review.token });
        else await api(path, { action: 'draft', token: review.token, answer });
        onClose();
        return;
      }
      Keyboard.dismiss();
      const next = await api<QuickReviewState>(path, {
        action: 'answer',
        token: review.token,
        answer,
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
  return (
    <FlowFrame
      journal={{}}
      title="Repaso rápido"
      eyebrow="Una frase · 1 min"
      onClose={() => void finish(true)}
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
            onPress={() => void finish()}
          >
            {review?.result ? 'Volver al viaje' : 'Comprobar respuesta'}
          </Action>
        ) : undefined
      }
    >
      {!!error && <ErrorCard message={error} onRetry={review ? undefined : () => void load()} />}
      {!exercise && !error && <ActivityIndicator color={colors.teal} />}
      {exercise && (
        <View style={{ gap: 15 }}>
          <JournalArt source={illustrations.review} aspectRatio={2.9} taped />
          <Notebook title="Ponlo en práctica">
            {review.starter && (
              <Text style={f.body}>
                En la plaza, Luz te enseña una palabra para saludar:{' '}
                <Text style={f.cardTitle}>hi</Text> significa «hola».
              </Text>
            )}
            <ExerciseInput
              journal
              exercise={exercise}
              answer={answer}
              setAnswer={draft}
              disabled={busy || !!review.result}
            />
          </Notebook>
        </View>
      )}
    </FlowFrame>
  );
}
