import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, BookOpen, CalendarCheck } from 'lucide-react-native';
import type { TravelReviewRow } from '@lingoquest/offline-engine';
import { JournalLeaf, JournalSpread } from '../Journal';
import { useTheme } from '../theme';
import { api } from '../lib/api';
import { QuickReview } from '../travel/QuickReview';
import { illustrations } from '../travel/illustrations';
import { Action, ErrorCard, FlowFrame, useFeatureStyles } from './FeatureUI';

const skillLabels: Record<TravelReviewRow['skill'], string> = {
  vocabulary: 'Vocabulario',
  grammar: 'Gramática',
  listening: 'Comprensión auditiva',
  reading: 'Lectura',
  writing: 'Escritura',
  speaking: 'Práctica oral',
};
const evidenceStages = [
  ['recognition', 'Reconocer'],
  ['understanding', 'Comprender'],
  ['recall', 'Recordar sin opciones'],
  ['production', 'Crear una respuesta'],
  ['transfer', 'Aplicar en otra situación'],
] as const;

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
  const [reviews, setReviews] = useState<TravelReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [all, setAll] = useState(showAll);
  const [target, setTarget] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api<{ reviews: TravelReviewRow[] }>(
        '/v1/reviews/today?source=travel' + (all ? '&all=true' : ''),
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
        Object.entries(skillLabels).map(([skill, label]) => {
          const items = reviews.filter((review) => review.skill === skill);
          if (!all && !items.length) return null;
          return (
            <View key={skill} style={{ gap: 8 }}>
              <Text accessibilityRole="header" style={f.cardTitle}>
                {label}
              </Text>
              {items.length ? (
                items.map((review) => (
                  <ReviewCard key={review.key} review={review} onPractice={setTarget} />
                ))
              ) : (
                <Text style={f.quiet}>Todavía no hay práctica registrada.</Text>
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
  review: TravelReviewRow;
  onPractice: (target: string) => void;
}) {
  const { colors: palette } = useTheme();
  const f = useFeatureStyles();
  const s = useStyles();
  const [showDetails, setShowDetails] = useState(false);
  const counts = [
    ['Aciertos sin ayuda', review.independentSuccesses],
    ['Aciertos con ayuda', review.assistedSuccesses],
    ['Recuerdo después de un intervalo', review.delayedSuccesses],
    ['Uso en otra situación', review.transferSuccesses],
  ] as const;
  const speechPracticeCount = Object.values(review.speakingPractice).reduce(
    (total, count = 0) => total + count,
    0,
  );

  return (
    <JournalLeaf compact kind="postcard" style={f.card}>
      <View style={s.cardTop}>
        <JournalLeaf compact kind="stamp" style={s.skillIcon}>
          <BookOpen color={palette.teal} size={22} />
        </JournalLeaf>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={f.cardTitle}>{review.targetLabelEs}</Text>
          {review.canPractice && (
            <Text style={f.quiet}>
              {review.reason === 'remediation'
                ? 'Conviene reforzar esta idea'
                : review.due
                  ? 'Lista para repasar'
                  : review.dueAt
                    ? 'Siguiente repaso: ' +
                      new Date(review.dueAt).toLocaleDateString('es-419', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : 'Disponible para practicar'}
            </Text>
          )}
        </View>
        {review.due && <View style={s.dueDot} />}
      </View>
      {review.skill === 'speaking' ? (
        <Text style={f.quiet}>
          Prácticas de voz: {speechPracticeCount}. La habilidad oral y la pronunciación aún no se
          evalúan.
        </Text>
      ) : (
        <View style={{ gap: 3 }}>
          {counts.map(([label, count]) => (
            <Text key={label} style={f.quiet}>
              {label}: {count}
            </Text>
          ))}
          {Object.keys(review.successes).length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: showDetails }}
              style={s.practice}
              onPress={() => setShowDetails(!showDetails)}
            >
              <Text style={s.practiceText}>
                {showDetails ? 'Ocultar tipos de práctica' : 'Ver tipos de práctica'}
              </Text>
            </Pressable>
          )}
          {showDetails &&
            evidenceStages.map(([stage, label]) => {
              const evidence = review.successes[stage];
              return evidence ? (
                <Text key={stage} style={f.quiet}>
                  {label}: {evidence.independent} sin ayuda · {evidence.assisted} con ayuda
                </Text>
              ) : null;
            })}
        </View>
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
