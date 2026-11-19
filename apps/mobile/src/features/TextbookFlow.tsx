import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ArrowRight, BookOpen } from 'lucide-react-native';
import { JournalLeaf } from '../Journal';
import { api, type Unit } from '../lib/api';
import { useTheme } from '../theme';
import { Button, Heading, Label } from '../ui';
import { ErrorCard, FlowFrame } from './FeatureUI';
import { LearningFlow } from './LearningFlow';
import { LessonReference } from './LessonReference';

export function TextbookFlow({
  completed,
  onClose,
  onRefresh,
  onVoiceSettings,
}: {
  completed: string[];
  onClose: () => void;
  onRefresh: () => void;
  onVoiceSettings: () => void;
}) {
  const { colors } = useTheme();
  const [catalog, setCatalog] = useState<{ units: Unit[]; draftIds: string[] }>();
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [unitId, setUnitId] = useState<string>();
  const [lesson, setLesson] = useState<{ id: string; mode: 'learn' | 'reference' }>();

  useEffect(() => {
    if (lesson) return;
    let current = true;
    void Promise.all([
      api<{ units: Unit[] }>('/v1/catalog'),
      api<string[]>('/v1/lessons/resume?all=true'),
    ])
      .then(([{ units }, draftIds]) => {
        if (current) setCatalog({ units, draftIds });
      })
      .catch((failure: Error) => {
        if (current) setError(failure.message);
      });
    return () => {
      current = false;
    };
  }, [lesson, reload]);

  const unit = catalog?.units.find((item) => item.id === unitId);
  const resume = catalog?.units
    .flatMap((item) => item.lessons)
    .find((item) => item.id === catalog.draftIds[0]);
  const open = (id: string, mode: 'learn' | 'reference' = 'learn') => setLesson({ id, mode });
  const closeLesson = () => {
    if (lesson?.mode === 'learn') onRefresh();
    setLesson(undefined);
  };
  if (lesson?.mode === 'reference') return <LessonReference id={lesson.id} onClose={closeLesson} />;
  if (lesson)
    return (
      <LearningFlow
        key={lesson.id}
        lessonId={lesson.id}
        onClose={closeLesson}
        onComplete={closeLesson}
        onSettings={onVoiceSettings}
      />
    );

  return (
    <FlowFrame
      title={unit?.titleEs ?? 'Cursos A1–A2'}
      eyebrow={unit ? `${unit.cefr} · Cursos A1–A2` : 'Aprender'}
      onClose={unit ? () => setUnitId(undefined) : onClose}
      journal={{}}
      stepKey={unitId}
    >
      {error ? (
        <ErrorCard
          message={error}
          onRetry={() => {
            setError('');
            setReload((value) => value + 1);
          }}
        />
      ) : !catalog ? (
        <ActivityIndicator color={colors.teal} accessibilityLabel="Cargando cursos" />
      ) : unit ? (
        <View style={{ gap: 16 }}>
          <Label>{unit.description}</Label>
          {unit.lessons.map((item) => (
            <JournalLeaf
              key={item.id}
              testID={`textbook-lesson-${item.id}`}
              kind="notebook"
              style={{ gap: 10 }}
            >
              <Heading style={{ fontSize: 22 }}>{item.title}</Heading>
              <Label>
                {item.estimatedMinutes} min{completed.includes(item.id) ? ' · Completada' : ''}
              </Label>
              <Button icon={ArrowRight} onPress={() => open(item.id)}>
                {catalog.draftIds.includes(item.id)
                  ? 'Continuar lección'
                  : completed.includes(item.id)
                    ? 'Practicar lección'
                    : 'Empezar lección'}
              </Button>
              <Button variant="ghost" icon={BookOpen} onPress={() => open(item.id, 'reference')}>
                Consultar vocabulario y gramática
              </Button>
            </JournalLeaf>
          ))}
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {resume && (
            <JournalLeaf tint="mint" style={{ gap: 8 }}>
              <Heading style={{ fontSize: 22 }}>{resume.title}</Heading>
              <Button icon={ArrowRight} onPress={() => open(resume.id)}>
                Continuar lección
              </Button>
            </JournalLeaf>
          )}
          {catalog.units.map((item) => (
            <JournalLeaf key={item.id} style={{ gap: 8 }}>
              <Label>
                {item.cefr} · {item.lessons.filter((entry) => completed.includes(entry.id)).length}{' '}
                de {item.lessons.length} lecciones completas
              </Label>
              <Button variant="secondary" icon={BookOpen} onPress={() => setUnitId(item.id)}>
                {item.titleEs}
              </Button>
            </JournalLeaf>
          ))}
        </View>
      )}
    </FlowFrame>
  );
}
