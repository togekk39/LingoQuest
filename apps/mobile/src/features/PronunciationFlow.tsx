import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { stopOfflineSpeech, useOfflineSpeech } from './offlineSpeech';
import { ArrowRight, AudioLines, Info, Volume2 } from 'lucide-react-native';
import { api } from '../lib/api';
import { ErrorCard, f, FlowFrame, palette } from './FeatureUI';
import SpeakingPractice from './SpeakingPractice';
interface SpeechDrill {
  id: string;
  category: string;
  titleEs: string;
  textEn: string;
  tipEs: string;
}
export default function PronunciationFlow({ onClose }: { onClose: () => void }) {
  const { playOffline, speechMessage } = useOfflineSpeech();
  const [drills, setDrills] = useState<SpeechDrill[]>([]);
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<SpeechDrill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await api<{ drills: SpeechDrill[] }>('/v1/pronunciation/drills');
      setDrills(response.drills);
      setCategory(response.drills[0]?.category ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos preparar tus prácticas.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    return () => {
      void stopOfflineSpeech();
    };
  }, []);
  if (selected)
    return (
      <SpeakingPractice
        text={selected.textEn}
        onDone={() => setSelected(null)}
        onClose={() => setSelected(null)}
      />
    );
  const categories = drills.filter(
    (drill, index, list) => list.findIndex((item) => item.category === drill.category) === index,
  );
  const current = drills.filter((drill) => drill.category === category);
  return (
    <FlowFrame title="Encuentra tu voz" eyebrow="Escuchar · Practicar · Comparar" onClose={onClose}>
      <View style={s.icon}>
        <AudioLines size={37} color={palette.teal} strokeWidth={1.5} />
      </View>
      <Text style={f.title}>Tu inglés tiene algo que decir.</Text>
      <Text style={f.body}>
        {drills.length || 40} pequeñas prácticas para explorar sonidos, ritmo y palabras. Lee cada
        frase y, si quieres, graba tu voz y vuelve a escucharla.
      </Text>
      <View style={s.disclosure}>
        <Info color={palette.teal} size={19} />
        <Text style={[f.quiet, { flex: 1 }]}>
          Esta práctica funciona sin conexión y no genera puntajes automáticos de pronunciación. Los
          ejemplos solo usan una voz local compatible. Tu grabación no sale de este dispositivo.
        </Text>
      </View>
      {!!speechMessage && (
        <Text accessibilityRole="alert" style={f.quiet}>
          {speechMessage}
        </Text>
      )}
      {loading && <ActivityIndicator color={palette.teal} size="large" />}
      {!!error && (
        <ErrorCard
          message={error}
          onRetry={() => {
            void load();
          }}
        />
      )}
      {!loading && !error && (
        <>
          <Text style={f.eyebrow}>Elige qué sonido explorar</Text>
          <View style={s.categories}>
            {categories.map((group) => (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: category === group.category }}
                key={group.category}
                onPress={() => setCategory(group.category)}
                style={[s.category, category === group.category && s.activeCategory]}
              >
                <Text
                  style={[s.categoryText, category === group.category && { color: palette.teal }]}
                >
                  {group.titleEs}
                </Text>
              </Pressable>
            ))}
          </View>
          {current[0] && (
            <View style={s.tip}>
              <Text style={f.cardTitle}>{current[0].titleEs}</Text>
              <Text style={f.body}>{current[0].tipEs}</Text>
            </View>
          )}
          <View style={{ gap: 13 }}>
            {current.map((drill, index) => (
              <View key={drill.id} style={s.drill}>
                <View style={s.index}>
                  <Text style={s.indexText}>{String(index + 1).padStart(2, '0')}</Text>
                </View>
                <View style={{ flex: 1, gap: 5 }}>
                  <Text style={s.drillText}>{drill.textEn}</Text>
                  <Text style={f.quiet}>Lee y prueba a tu ritmo.</Text>
                </View>
                <View style={s.controls}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Escuchar: ${drill.textEn}`}
                    onPress={() => {
                      void playOffline(drill.textEn);
                    }}
                    style={s.control}
                  >
                    <Volume2 size={19} color={palette.teal} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Practicar: ${drill.textEn}`}
                    onPress={() => {
                      void stopOfflineSpeech();
                      setSelected(drill);
                    }}
                    style={[s.control, { backgroundColor: palette.teal }]}
                  >
                    <ArrowRight size={18} color="white" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
          <Text style={[f.quiet, { textAlign: 'center', marginVertical: 8 }]}>
            Tu acento no es un error. La meta es comunicarte con claridad.
          </Text>
        </>
      )}
    </FlowFrame>
  );
}
const s = StyleSheet.create({
  icon: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclosure: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#D5E5D8',
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#EFF6EE',
  },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  category: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#DAE5DB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  activeCategory: { backgroundColor: palette.mint, borderColor: '#86B8A0' },
  categoryText: { fontFamily: 'Manrope', fontSize: 12, color: palette.muted },
  tip: { gap: 11, paddingTop: 10, paddingBottom: 5 },
  drill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 17,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 18,
  },
  index: { width: 32, alignItems: 'center' },
  indexText: { fontFamily: 'Outfit', fontSize: 19, color: '#94AD9A' },
  drillText: { fontFamily: 'Outfit', fontSize: 19, lineHeight: 27, color: palette.ink },
  controls: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', maxWidth: 96 },
  control: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#EDF5EC',
  },
});
export { PronunciationFlow };
