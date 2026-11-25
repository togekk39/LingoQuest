import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, BookOpen, CalendarCheck } from 'lucide-react-native';
import type { UnifiedReviewRow } from '@lingoquest/offline-engine';
import { JournalLeaf, JournalSpread } from '../Journal';
import { useTheme } from '../theme';
import { api } from '../lib/api';
import { QuickReview } from '../travel/QuickReview';
import { illustrations } from '../travel/illustrations';
import { Action, ErrorCard, FlowFrame, useFeatureStyles } from './FeatureUI';

const skillLabels = [
  'Vocabulario',
  'Gramática',
  'Comprensión auditiva',
  'Lectura',
  'Escritura',
  'Práctica oral',
];
const learningStatusLabels: Record<UnifiedReviewRow['state'], string> = {
  not_introduced: 'Aún sin verificar',
  introduced: 'Ya viste esta idea',
  guided_practice: 'En práctica guiada',
  independent_performance: 'Primer acierto sin ayuda',
  demonstrated: 'Ya la demostraste',
};

export default function ReviewsFlow({
  onClose,
  onVoiceSettings,
  showAll = false,
}: {
  onClose: () => void;
  onVoiceSettings?: () => void;
  showAll?: boolean;
}) {
  const { colors: palette } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();
  const [reviews, setReviews] = useState<UnifiedReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [all, setAll] = useState(showAll);
  const [target, setTarget] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api<{ reviews: UnifiedReviewRow[] }>(
        '/v1/reviews/today?source=unified' + (all ? '&all=true' : ''),
      );
      setReviews(response.reviews);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos preparar tu repaso.');
    } finally {
      setLoading(false);
    }
  }, [all]);

  useEffect(() => {
    void load();
  }, [load]);

  if (target)
    return (
      <QuickReview
        target={target}
        onVoiceSettings={onVoiceSettings}
        onClose={() => {
          setTarget(undefined);
          void load();
        }}
      />
    );

  return (
    <FlowFrame journal={{}} title="Mis habilidades" eyebrow="Repaso inteligente" onClose={onClose}>
      <JournalSpread source={illustrations.review} title="Vuelve a lo aprendido" />
      <JournalLeaf compact kind="postcard" style={s.switcher}>
        {[false, true].map((showEverything) => (
          <Pressable
            key={String(showEverything)}
            accessibilityRole="tab"
            accessibilityState={{ selected: all === showEverything }}
            aria-selected={all === showEverything}
            onPress={() => setAll(showEverything)}
            style={[s.tab, all === showEverything && s.activeTab]}
          >
            <Text style={[s.tabText, all === showEverything && s.activeTabText]}>
              {showEverything ? 'Todas mis habilidades' : 'Para hoy'}
            </Text>
          </Pressable>
        ))}
      </JournalLeaf>
      {loading && <ActivityIndicator color={palette.teal} size="large" />}
      {!!error && <ErrorCard message={error} onRetry={() => void load()} />}
      {!loading && !error && !all && !reviews.length && (
        <JournalLeaf
          compact
          kind="postcard"
          style={[f.card, { alignItems: 'center', paddingVertical: 38 }]}
        >
          <CalendarCheck color={palette.teal} size={35} />
          <Text style={[f.cardTitle, { textAlign: 'center' }]}>¡Por hoy, todo al día!</Text>
          <Text style={[f.body, { textAlign: 'center' }]}>
            Puedes continuar tu viaje o consultar tus habilidades para practicar cuando quieras.
          </Text>
          <Action journal secondary onPress={onClose}>
            Volver a mi camino
          </Action>
        </JournalLeaf>
      )}
      {!loading &&
        !error &&
        skillLabels.map((label) => {
          const items = reviews.filter((review) => review.skillLabelEs === label);
          if (!all && !items.length) return null;
          return (
            <View key={label} style={{ gap: 8 }}>
              <Text accessibilityRole="header" style={f.cardTitle}>
                {label}
              </Text>
              {items.length ? (
                items.map((review) => (
                  <ReviewCard key={review.key} review={review} onPractice={setTarget} />
                ))
              ) : (
                <Text style={f.quiet}>Aún sin verificar.</Text>
              )}
            </View>
          );
        })}
      <JournalLeaf compact kind="notebook" tint="mint">
        <Text style={f.body}>
          Si una idea te cuesta, la practicas antes con otra escena. Si la recuerdas sin pistas, el
          próximo repaso se puede espaciar.
        </Text>
      </JournalLeaf>
    </FlowFrame>
  );
}

function ReviewCard({
  review,
  onPractice,
}: {
  review: UnifiedReviewRow;
  onPractice: (target: string) => void;
}) {
  const { colors: palette } = useTheme();
  const f = useFeatureStyles();
  const s = useStyles();
  const due = review.reason !== 'practice';

  return (
    <JournalLeaf compact kind="postcard" testID={`learning-review-${review.key}`} style={f.card}>
      <View style={s.cardTop}>
        <JournalLeaf compact kind="stamp" style={s.skillIcon}>
          <BookOpen color={palette.teal} size={22} />
        </JournalLeaf>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={f.cardTitle}>{review.targetLabelEs}</Text>
          <Text style={f.quiet}>{learningStatusLabels[review.state]}</Text>
          {review.state === 'demonstrated' && (
            <>
              <Text style={f.quiet}>
                {review.retention === 'verified'
                  ? 'La recordaste después de un tiempo'
                  : 'Retención aún sin verificar'}
              </Text>
              <Text style={f.quiet}>
                {review.transfer === 'verified'
                  ? 'La aplicaste en otra situación'
                  : 'Aplicación en otra situación aún sin verificar'}
              </Text>
            </>
          )}
          {review.canPractice && (
            <Text style={f.quiet}>
              {review.reason === 'remediation'
                ? 'Conviene reforzar esta idea'
                : due
                  ? 'Lista para repasar'
                  : review.nextReviewAt
                    ? 'Siguiente repaso: ' +
                      new Date(review.nextReviewAt).toLocaleDateString('es-419', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : 'Disponible para practicar'}
            </Text>
          )}
        </View>
        {due && <View style={s.dueDot} />}
      </View>
      {review.dimension === 'speaking' && (
        <Text style={f.quiet}>
          La pronunciación y la comunicación oral aún están sin verificar.
        </Text>
      )}
      {review.assistedSuccesses > 0 && (
        <Text style={f.quiet}>Aciertos del objetivo con ayuda: {review.assistedSuccesses}</Text>
      )}
      {review.canPractice && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Abrir repaso rápido: ' + review.targetLabelEs}
          style={s.practice}
          onPress={() => onPractice(review.key)}
        >
          <Text style={s.practiceText}>Abrir repaso rápido</Text>
          <ArrowRight color={palette.teal} size={17} />
        </Pressable>
      )}
    </JournalLeaf>
  );
}

function useStyles() {
  const { colors: palette, tone } = useTheme();
  return StyleSheet.create({
    switcher: {
      flexDirection: 'row',
      gap: 4,
      padding: 5,
      backgroundColor: palette.mint,
      borderRadius: 13,
    },
    tab: {
      flex: 1,
      minHeight: 44,
      paddingVertical: 12,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 9,
    },
    activeTab: { backgroundColor: palette.white },
    tabText: { color: palette.muted, fontFamily: 'Manrope', fontSize: 13 },
    activeTabText: { color: palette.teal, fontFamily: 'ManropeBold' },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    skillIcon: {
      width: 45,
      height: 45,
      borderRadius: 13,
      backgroundColor: tone('#EDF5EC', 'background'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    dueDot: { width: 9, height: 9, backgroundColor: palette.orange, borderRadius: 5 },
    practice: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
    practiceText: { fontFamily: 'ManropeBold', fontSize: 13, color: palette.teal },
  });
}

export { ReviewsFlow };
