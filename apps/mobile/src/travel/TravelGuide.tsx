import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Bookmark,
  Headphones,
  MapPin,
  RotateCcw,
  Route,
  Volume2,
} from 'lucide-react-native';
import { canStartTravelMission, chapter, type TravelState } from '@lingoquest/offline-engine';
import { FlowFrame } from '../features/FeatureUI';
import { SpeakingPanel } from '../features/SpeakingPractice';
import { drillFeedback } from './speakingFeedback';
import { Button, Heading, Label } from '../ui';
import { useTheme } from '../theme';
import { JournalLeaf, JournalSpread } from '../Journal';
import { illustrations, placeIllustration } from './illustrations';
import { WordWorkshop } from './WordWorkshop';
import { GrammarWorkbench, VocabularyCard } from './TravelAppearance';
import { useChapterAudio } from './useChapterAudio';

export function TravelGuide({
  travel,
  onLessons,
  onMission,
  onAssessment,
  onSpeech,
  onVoiceSettings,
  onGrammar,
  onLegacy,
  onReview,
}: {
  travel: TravelState;
  onLessons: () => void;
  onMission: (id: string) => void;
  onAssessment: () => void;
  onSpeech: () => void;
  onVoiceSettings: () => void;
  onGrammar: () => void;
  onLegacy: () => void;
  onReview?: () => void;
}) {
  const { colors: C } = useTheme();
  const { width } = useWindowDimensions();
  const [index, select] = useState(0);
  const [workshop, setWorkshop] = useState<'matching' | 'cloze'>();
  const { play, stop, speechMessage } = useChapterAudio();
  const mission = chapter.missions[index];
  const unlocked = canStartTravelMission(travel, mission.id);
  const desktop = width >= 920;
  const configureVoice = () => {
    stop();
    onVoiceSettings();
  };
  return (
    <View style={{ gap: 18 }}>
      <JournalSpread
        source={placeIllustration(mission.place)}
        title="Palabras del viaje"
        detail={chapter.title}
      >
        <View style={styles.actions}>
          <Button variant="secondary" icon={BookOpen} onPress={onLessons}>
            Lecciones
          </Button>
          <Button variant="secondary" icon={BookOpen} onPress={onGrammar}>
            Manual de gramática
          </Button>
          <Button variant="secondary" onPress={onLegacy}>
            Cursos A1–A2
          </Button>
          {!!onReview && (
            <Button variant="ghost" icon={RotateCcw} onPress={onReview}>
              Mis habilidades
            </Button>
          )}
          <Button variant="ghost" icon={Volume2} onPress={configureVoice}>
            Configuración de voz
          </Button>
        </View>
      </JournalSpread>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
        {chapter.missions.map((item, i) => (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: i === index }}
            aria-selected={i === index}
            onPress={() => {
              stop();
              select(i);
              setWorkshop(undefined);
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
      {workshop ? (
        <WordWorkshop
          key={workshop}
          words={mission.vocabulary}
          kind={workshop}
          onClose={() => setWorkshop(undefined)}
        />
      ) : (
        <>
          <JournalLeaf tint="mint" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Button variant="secondary" onPress={() => setWorkshop('matching')}>
              Relacionar palabras
            </Button>
            {mission.id === 'hello' && (
              <Button variant="secondary" onPress={() => setWorkshop('cloze')}>
                Completar una frase
              </Button>
            )}
          </JournalLeaf>
          <View style={{ gap: 18 }}>
            {mission.vocabulary.map((word) => (
              <VocabularyCard key={word.term} word={word} play={(value) => void play(value)} />
            ))}
          </View>
        </>
      )}
      {!!speechMessage && <Label>{speechMessage}</Label>}
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

const grammarTopics = chapter.missions.flatMap((mission) =>
  mission.steps.filter((step) => step.type === 'teach'),
);

export function TravelGrammar({
  onClose,
  onVoiceSettings,
}: {
  onClose: () => void;
  onVoiceSettings: () => void;
}) {
  const { colors: C } = useTheme();
  const [index, select] = useState(0);
  const { play, playSequence, stop, speechMessage } = useChapterAudio();
  const topic = grammarTopics[index];
  return (
    <FlowFrame
      journal={{}}
      title="Manual de gramática"
      eyebrow={chapter.title}
      onClose={onClose}
      onVoiceSettings={() => {
        stop();
        onVoiceSettings();
      }}
    >
      <View style={styles.actions}>
        {grammarTopics.map((step, i) => (
          <Pressable
            key={step.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: i === index }}
            aria-selected={i === index}
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
              {step.title}
            </Text>
          </Pressable>
        ))}
      </View>
      <GrammarWorkbench
        key={topic.id}
        step={topic}
        play={play}
        playSequence={playSequence}
        stop={stop}
      />
      {!!speechMessage && (
        <Text accessibilityRole="alert" style={[styles.copy, { color: C.muted }]}>
          {speechMessage}
        </Text>
      )}
    </FlowFrame>
  );
}

const drills = chapter.missions.flatMap((mission) =>
  Array.from(new Set(mission.vocabulary.map((word) => word.example.en))).map((text) => ({
    mission,
    text,
  })),
);
export function TravelPronunciation({
  onClose,
  onVoiceSettings,
}: {
  onClose: () => void;
  onVoiceSettings: () => void;
}) {
  const { colors: C } = useTheme();
  const [selected, select] = useState<string>();
  const { play, stop, speechMessage } = useChapterAudio();
  const configureVoice = () => {
    stop();
    onVoiceSettings();
  };
  const leave = () => {
    stop();
    select(undefined);
  };
  if (selected)
    return (
      <FlowFrame journal={{}} title={selected} eyebrow="Práctica de pronunciación" onClose={leave}>
        <SpeakingPanel
          key={selected}
          text={selected}
          chapterId="home"
          onDone={leave}
          onStopReference={stop}
          onPlay={() => void play(selected)}
          feedback={(transcript) => drillFeedback(transcript, selected)}
          allowSystemRecognition
        />
        {!!speechMessage && <Label>{speechMessage}</Label>}
      </FlowFrame>
    );
  return (
    <FlowFrame
      journal={{}}
      title="Pronunciación"
      eyebrow={chapter.title}
      onClose={onClose}
      onVoiceSettings={configureVoice}
    >
      <JournalSpread
        source={illustrations.review}
        title="Escucha y repite"
        detail="Elige una frase y practica con tu voz."
      />
      {drills.map(({ mission, text }) => (
        <JournalLeaf style={{ gap: 8 }} key={text}>
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
        </JournalLeaf>
      ))}
      {!!speechMessage && <Label>{speechMessage}</Label>}
    </FlowFrame>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
