import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, ChevronRight, Compass, MapPin, Route, X } from 'lucide-react-native';
import { chapter } from '@lingoquest/offline-engine';
import { Button } from '../ui';
import { JournalArt, JournalBrand, JournalLeaf, PaperEdge, PaperGrain } from '../Journal';
import { useTheme } from '../theme';
import { illustrations } from './illustrations';

export function TravelWelcome({
  busy,
  onStart,
  onAssessment,
  onClose,
}: {
  busy: boolean;
  onStart: () => void;
  onAssessment: () => void;
  onClose: () => void;
}) {
  const { colors: C } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 950 && fontScale <= 1.25;
  const firstMission = chapter.missions[0];
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.paper }]}>
      <PaperGrain />
      <View style={[styles.header, { backgroundColor: C.paper }]}>
        <PaperEdge edge="bottom" tint={C.paper} />
        <JournalBrand small />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Explorar primero"
          disabled={busy}
          onPress={onClose}
          style={styles.close}
        >
          <X size={22} color={C.ink} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.body, wide && styles.columns]}>
          <View style={styles.intro}>
            <Text accessibilityRole="header" style={[styles.title, { color: C.ink }]}>
              Empieza tu viaje en inglés
            </Text>
            <Text style={[styles.copy, { color: C.muted }]}>
              Sigue la historia de Sam y practica el inglés que necesitas en cada parada.
            </Text>
            <JournalArt source={illustrations.welcome} aspectRatio={2.25} taped />
            <View style={styles.location}>
              <MapPin size={16} color={C.accent} />
              <Text style={[styles.locationText, { color: C.accent }]}>{firstMission.place}</Text>
            </View>
          </View>

          <JournalLeaf
            compact
            kind="notebook"
            style={[styles.choices, { backgroundColor: C.white, borderColor: C.line }]}
          >
            <Text accessibilityRole="header" style={[styles.choiceTitle, { color: C.ink }]}>
              ¿Por dónde quieres empezar?
            </Text>
            <JournalLeaf
              compact
              kind="postcard"
              style={[styles.departure, { borderColor: C.line }]}
            >
              <JournalLeaf compact kind="stamp" style={[styles.icon, { backgroundColor: C.mint }]}>
                <Compass size={22} color={C.teal} />
              </JournalLeaf>
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <Text style={[styles.option, { color: C.ink }]}>{firstMission.title}</Text>
                <Text style={[styles.detail, { color: C.muted }]}>
                  Escucha a Sam y ensaya cómo presentarte · {firstMission.minutes} min
                </Text>
              </View>
            </JournalLeaf>
            <Button loading={busy} icon={ArrowRight} onPress={onStart} style={styles.start}>
              Empezar mi viaje
            </Button>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ya sé algo de inglés"
              disabled={busy}
              onPress={onAssessment}
              style={({ pressed }) => [
                styles.placement,
                { borderColor: C.line, backgroundColor: pressed ? C.mint : C.white },
              ]}
            >
              <Route size={20} color={C.teal} />
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <Text style={[styles.option, { color: C.ink }]}>Ya sé algo de inglés</Text>
                <Text style={[styles.detail, { color: C.muted }]}>
                  Seis preguntas para encontrar tu punto de partida.
                </Text>
              </View>
              <ChevronRight size={18} color={C.accent} />
            </Pressable>
          </JournalLeaf>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 17,
    paddingVertical: 5,
  },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 17 },
  body: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: 18 },
  columns: { flexDirection: 'row', alignItems: 'center', maxWidth: 1070, gap: 28 },
  intro: { flex: 1, minWidth: 0, gap: 11 },
  title: { fontFamily: 'LoraBold', fontSize: 30, letterSpacing: -0.5 },
  copy: { fontFamily: 'Manrope', fontSize: 14, lineHeight: 21 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -2 },
  locationText: { fontFamily: 'ManropeBold', fontSize: 12 },
  choices: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 18, gap: 11, padding: 15 },
  choiceTitle: { fontFamily: 'LoraBold', fontSize: 22 },
  departure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  icon: {
    width: 41,
    height: 41,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: { fontFamily: 'ManropeBold', fontSize: 14 },
  detail: { fontFamily: 'Manrope', fontSize: 12, lineHeight: 17 },
  start: { minHeight: 48 },
  placement: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 52,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
});
