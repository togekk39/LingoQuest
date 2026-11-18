import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { api } from '../lib/api';
import { useTheme } from '../theme';
import { Button } from '../ui';
import { ErrorCard, FlowFrame, useFeatureStyles } from './FeatureUI';
import { GrammarStage, DialogueStage, type IntegratedLesson } from './LessonStages';
import { stopOfflineSpeech, useOfflineSpeech } from './offlineSpeech';

export function LessonReference({ id, onClose }: { id: string; onClose: () => void }) {
  const { colors } = useTheme();
  const f = useFeatureStyles();
  const [lesson, setLesson] = useState<IntegratedLesson | null>(null);
  const [error, setError] = useState('');
  const { playOffline, speechMessage } = useOfflineSpeech();
  const load = () => {
    setError('');
    void api<IntegratedLesson>(`/v1/lessons/${id}`)
      .then(setLesson)
      .catch((e) => setError(e.message));
  };
  useEffect(() => {
    load();
    return () => {
      void stopOfflineSpeech();
    };
  }, [id]);

  return (
    <FlowFrame
      title={lesson?.title ?? 'Material de consulta'}
      eyebrow="Vocabulario y gramática"
      onClose={onClose}
    >
      {error ? (
        <ErrorCard message={error} onRetry={load} />
      ) : !lesson ? (
        <ActivityIndicator color={colors.teal} />
      ) : (
        <View style={{ gap: 15 }}>
          <Text style={f.title}>Vocabulario</Text>
          {lesson.vocabulary.map((item) => (
            <View key={item.id} style={f.card}>
              <Text style={f.cardTitle} accessibilityLanguage="en-US">
                {item.en}
              </Text>
              <Text style={f.body}>
                {item.es} · {item.partOfSpeech}
              </Text>
              <Text style={f.body} accessibilityLanguage="en-US">
                {item.example.en}
              </Text>
              <Text style={f.quiet}>{item.example.es}</Text>
              <Button
                variant="secondary"
                icon={Volume2}
                onPress={() => void playOffline(item.example.en)}
              >
                Escuchar ejemplo
              </Button>
            </View>
          ))}
          {!!speechMessage && (
            <Text accessibilityRole="alert" style={f.quiet}>
              {speechMessage}
            </Text>
          )}
          <GrammarStage lesson={lesson} />
          <DialogueStage lesson={lesson} />
        </View>
      )}
    </FlowFrame>
  );
}
