import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  ArrowRight,
  AudioLines,
  Bookmark,
  Headphones,
  MapPin,
  Route,
  Volume2,
} from 'lucide-react-native';
import { canStartTravelMission, chapter, type TravelState } from '@lingoquest/offline-engine';
import { FlowFrame } from '../features/FeatureUI';
import { SpeakingPanel } from '../features/SpeakingPractice';
import { Button, Card, Heading, Label } from '../ui';
import { useTheme } from '../theme';
import { TravelScene, VocabularyCard } from './TravelAppearance';
import { useChapterAudio } from './useChapterAudio';

export function TravelGuide({
  travel,
  onMission,
  onAssessment,
  onSpeech,
}: {
  travel: TravelState;
  onMission: (id: string) => void;
  onAssessment: () => void;
  onSpeech: () => void;
}) {
  const { colors: C } = useTheme();
  const { width } = useWindowDimensions();
  const [index, select] = useState(0);
  const { play, stop, speechMessage } = useChapterAudio();
  const mission = chapter.missions[index];
  const unlocked = canStartTravelMission(travel, mission.id);
  const desktop = width >= 920;
  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 7 }}>
        <Text style={[styles.overline, { color: C.accent }]}>{chapter.title}</Text>
        <Heading style={{ fontSize: desktop ? 38 : 31 }}>Palabras del viaje</Heading>
        <Label style={styles.copy}>Consulta el vocabulario y los ejemplos de cada misión.</Label>
      </View>
      <TravelScene place={mission.place} compact={!desktop} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
        {chapter.missions.map((item, i) => (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: i === index }}
            onPress={() => {
              stop();
              select(i);
            }}
            style={[
              styles.tab,
              { backgroundColor: i === index ? C.primary : C.white, borderColor: C.line },
            ]}
          >
            <Text style={[styles.tabText, { color: i === index ? C.onPrimary : C.ink }]}>
              {item.place}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={{ gap: 9, flexDirection: 'row', alignItems: 'center' }}>
        <Bookmark size={20} color={C.accent} />
        <Heading style={{ flex: 1, fontSize: 25 }}>{mission.title}</Heading>
      </View>
      <View style={{ gap: 12 }}>
        {mission.vocabulary.map((word) => (
          <VocabularyCard key={word.term} word={word} play={(value) => void play(value)} />
        ))}
      </View>
      {!!speechMessage && <Label>{speechMessage}</Label>}
      <Button
        icon={ArrowRight}
        disabled={!unlocked}
        onPress={() => {
          stop();
          onMission(mission.id);
        }}
      >
        {unlocked ? 'Abrir misión' : 'Completa la misión anterior'}
      </Button>
      <View style={{ gap: 10, flexDirection: desktop ? 'row' : 'column' }}>
        <Button variant="secondary" icon={Headphones} onPress={onSpeech}>
          Practicar pronunciación
        </Button>
        <Button variant="ghost" icon={Route} onPress={onAssessment}>
          Encontrar mi punto de partida
        </Button>
      </View>
    </View>
  );
}

const drills = chapter.missions.flatMap((mission) =>
  Array.from(new Set(mission.vocabulary.map((word) => word.example.en))).map((text) => ({
    mission,
    text,
  })),
);
export function TravelPronunciation({ onClose }: { onClose: () => void }) {
  const { colors: C } = useTheme();
  const [selected, select] = useState<string>();
  const { play, stop, speechMessage } = useChapterAudio();
  const leave = () => {
    stop();
    select(undefined);
  };
  if (selected)
    return (
      <FlowFrame title={selected} eyebrow="Práctica de pronunciación" onClose={leave}>
        <SpeakingPanel
          key={selected}
          text={selected}
          onDone={leave}
          onStopReference={stop}
          onPlay={() => void play(selected)}
        />
        {!!speechMessage && <Label>{speechMessage}</Label>}
      </FlowFrame>
    );
  return (
    <FlowFrame title="Pronunciación" eyebrow={chapter.title} onClose={onClose}>
      <TravelScene place="La plaza" compact />
      <Heading>Escucha y repite</Heading>
      <Label style={styles.copy}>Escucha las frases de tu viaje y practica con tu voz.</Label>
      {drills.map(({ mission, text }) => (
        <Card style={{ gap: 8 }} key={text}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <MapPin size={15} color={C.accent} />
            <Label>{mission.place}</Label>
          </View>
          <Text accessibilityLanguage="en-US" style={[styles.drill, { color: C.ink }]}>
            {text}
          </Text>
          <View style={{ gap: 8, flexDirection: 'row', flexWrap: 'wrap' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Escuchar: ${text}`}
              onPress={() => void play(text)}
              style={[styles.tab, { backgroundColor: C.mint, borderColor: C.line }]}
            >
              <Volume2 color={C.teal} size={20} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Practicar: ${text}`}
              onPress={() => {
                stop();
                select(text);
              }}
              style={[styles.tab, { backgroundColor: C.primary, borderColor: C.primary }]}
            >
              <AudioLines color={C.onPrimary} size={20} />
              <Text style={[styles.tabText, { color: C.onPrimary }]}>Practicar</Text>
            </Pressable>
          </View>
        </Card>
      ))}
      {!!speechMessage && <Label>{speechMessage}</Label>}
    </FlowFrame>
  );
}

const styles = StyleSheet.create({
  overline: {
    fontFamily: 'ManropeBold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 11,
  },
  copy: { fontSize: 15, lineHeight: 23 },
  tab: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  tabText: { fontFamily: 'ManropeBold', fontSize: 13 },
  drill: { fontFamily: 'Journal', fontSize: 19 },
});
