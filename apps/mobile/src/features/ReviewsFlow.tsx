import { useTheme } from '../theme';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, BookOpen, CalendarCheck, Check, Sprout } from 'lucide-react-native';
import { api } from '../lib/api';
import { Action, ErrorCard, useFeatureStyles, FlowFrame } from './FeatureUI';
import LearningFlow from './LearningFlow';
interface Review {
  key: string;
  skillId: string;
  targetId: string;
  targetLabelEs: string;
  dimension:
    'vocabulary_recognition' | 'vocabulary_recall' | 'grammar_understanding' | 'grammar_production';
  mastery: number;
  dueAt: string;
  lessonId?: string;
  due?: boolean;
}
const dimensionNames: Record<Review['dimension'], string> = {
  vocabulary_recognition: 'Reconocer palabras',
  vocabulary_recall: 'Recordar palabras sin opciones',
  grammar_understanding: 'Entender la gramática en contexto',
  grammar_production: 'Usar la gramática al escribir',
};
export default function ReviewsFlow({ onClose }: { onClose: () => void }) {
  const { colors: palette } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [all, setAll] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);
  async function load(includeAll = all) {
    setLoading(true);
    setError('');
    try {
      const response = await api<{ reviews: Review[] }>(
        '/v1/reviews/today' + (includeAll ? '?all=true' : ''),
      );
      setReviews(response.reviews);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos preparar tu repaso.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load(all);
  }, [all]);
  if (lessonId)
    return (
      <LearningFlow
        lessonId={lessonId}
        review
        onClose={() => setLessonId(null)}
        onComplete={() => {
          setLessonId(null);
          void load();
        }}
      />
    );
  return (
    <FlowFrame title="Lo aprendido se queda contigo" eyebrow="Repaso inteligente" onClose={onClose}>
      <View style={s.headerIcon}>
        <Sprout color={palette.teal} size={37} strokeWidth={1.5} />
      </View>
      <Text style={f.title}>Un pequeño repaso hace la diferencia.</Text>
      <Text style={f.body}>
        Volver a una idea después de unos días te ayuda a recordarla. Aquí no hay prisa y siempre
        puedes intentar de nuevo.
      </Text>
      <View style={s.switcher}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: !all }}
          onPress={() => setAll(false)}
          style={[s.tab, !all && s.activeTab]}
        >
          <Text style={[s.tabText, !all && s.activeTabText]}>Para hoy</Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: all }}
          onPress={() => setAll(true)}
          style={[s.tab, all && s.activeTab]}
        >
          <Text style={[s.tabText, all && s.activeTabText]}>Todas mis habilidades</Text>
        </Pressable>
      </View>
      {loading && <ActivityIndicator color={palette.teal} size="large" />}
      {!!error && (
        <ErrorCard
          message={error}
          onRetry={() => {
            void load();
          }}
        />
      )}
      {!loading && !error && !reviews.length && (
        <View style={[f.card, { alignItems: 'center', paddingVertical: 38 }]}>
          <CalendarCheck color={palette.teal} size={35} />
          <Text style={[f.cardTitle, { textAlign: 'center' }]}>
            {all ? 'Tu jardín empieza con una lección.' : '¡Por hoy, todo al día!'}
          </Text>
          <Text style={[f.body, { textAlign: 'center' }]}>
            {all
              ? 'Cuando practiques una habilidad, la encontrarás aquí. Comienza con una lección y construiremos tu plan de repaso.'
              : 'Vuelve mañana para darle otra vuelta a lo aprendido. También puedes seguir tu camino o practicar una habilidad cuando quieras.'}
          </Text>
          <Action secondary onPress={onClose}>
            Volver a mi camino
          </Action>
        </View>
      )}
      {!loading &&
        reviews.map((review) => (
          <View style={f.card} key={review.key}>
            <View style={s.cardTop}>
              <View style={s.skillIcon}>
                <BookOpen color={palette.teal} size={22} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={f.cardTitle}>{review.targetLabelEs}</Text>
                <Text style={f.quiet}>{dimensionNames[review.dimension]}</Text>
                <Text style={f.quiet}>
                  {review.due
                    ? 'Un buen momento para recordar'
                    : `Siguiente repaso: ${new Date(review.dueAt).toLocaleDateString('es-419', { day: 'numeric', month: 'short' })}`}
                </Text>
              </View>
              {review.due ? <View style={s.dueDot} /> : <Check color={palette.muted} size={18} />}
            </View>
            <View
              accessibilityRole="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(Math.min(0.95, Math.max(0, review.mastery)) * 100)}
              accessibilityLabel={`Dominio: ${review.targetLabelEs}`}
              accessibilityValue={{
                min: 0,
                max: 100,
                now: Math.round(Math.min(0.95, Math.max(0, review.mastery)) * 100),
              }}
              style={s.progressTrack}
            >
              <View
                style={[
                  s.progressFill,
                  { width: `${Math.min(0.95, Math.max(0, review.mastery)) * 100}%` },
                ]}
              />
            </View>
            <Text style={f.quiet}>
              La evidencia se construye con práctica y tiempo. Una lección completada no significa
              dominio de la habilidad.
            </Text>
            {review.lessonId && (
              <Pressable
                accessibilityRole="button"
                style={s.practice}
                onPress={() => setLessonId(review.lessonId!)}
              >
                <Text style={s.practiceText}>Practicar esta habilidad</Text>
                <ArrowRight color={palette.teal} size={17} />
              </Pressable>
            )}
          </View>
        ))}
      <View style={s.note}>
        <Text style={f.eyebrow}>Dale tiempo a tu memoria</Text>
        <Text style={f.body}>
          Nuestro punto de partida: volver a practicar en 1, 3, 7 y 14 días. El plan se adapta a tus
          respuestas, sin castigos.
        </Text>
      </View>
    </FlowFrame>
  );
}
export function useStyles() {
  const { colors: palette, tone } = useTheme();
  return StyleSheet.create({
    headerIcon: {
      width: 82,
      height: 82,
      backgroundColor: palette.mint,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    switcher: {
      flexDirection: 'row',
      gap: 4,
      padding: 5,
      backgroundColor: tone('#E9F0E8', 'background'),
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
    activeTab: { backgroundColor: tone('white', 'background') },
    tabText: { color: palette.muted, fontFamily: 'Manrope', fontSize: 12 },
    activeTabText: { color: palette.teal, fontWeight: '700' },
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
    progressTrack: {
      height: 6,
      borderRadius: 5,
      backgroundColor: tone('#EAF0E7', 'background'),
      overflow: 'hidden',
    },
    progressFill: { height: 6, backgroundColor: palette.teal, borderRadius: 5 },
    practice: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
    practiceText: { fontFamily: 'Manrope', fontSize: 13, fontWeight: '700', color: palette.teal },
    note: {
      backgroundColor: tone('#EDF4EB', 'background'),
      borderRadius: 20,
      padding: 23,
      gap: 10,
    },
  });
}

export { ReviewsFlow };
