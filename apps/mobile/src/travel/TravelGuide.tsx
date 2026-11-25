import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Bookmark,
  ChevronDown,
  ChevronRight,
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
  onFoundationReview,
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
  onFoundationReview?: (id: string) => void;
}) {
  const { colors: C } = useTheme();
  const { width } = useWindowDimensions();
  const [index, select] = useState(0);
  const [foundationOpen, setFoundationOpen] = useState(false);
  const [workshop, setWorkshop] = useState<'matching' | 'cloze'>();
  const { play, stop, speechMessage } = useChapterAudio();
  const missions = chapter.missions.filter(({ optional }) => !optional);
  const foundation = chapter.missions.filter(({ optional }) => optional);
  const path = travel.foundationPath ?? [];
  const next =
    path.find(({ resume }) => resume) ??
    path.find(({ status }) => status === 'guided' || status === 'review') ??
    path.find(({ status }) => status === 'new' || status === 'taught');
  const suggested = foundation.find(({ id }) => id === next?.id);
  const labels = {
    new: 'Por empezar',
    taught: 'Enseñada · faltan comprobaciones',
    guided: 'En práctica · faltan comprobaciones independientes',
    ready: 'Con evidencia independiente',
    review: 'Por repasar',
  };
  const mission = missions[index];
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
      {!!foundation.length && (
        <JournalLeaf compact kind="notebook" style={{ gap: 8 }}>
          <Pressable
            testID="home-foundation-toggle"
            accessibilityRole="button"
            accessibilityState={{ expanded: foundationOpen }}
            aria-expanded={foundationOpen}
            onPress={() => setFoundationOpen(!foundationOpen)}
            style={({ pressed }) => [styles.foundationRow, pressed && { opacity: 0.72 }]}
          >
            <BookOpen color={C.teal} size={20} />
            <Heading style={{ flex: 1, fontSize: 22 }}>Inglés desde cero</Heading>
            {foundationOpen ? <ChevronDown color={C.teal} /> : <ChevronRight color={C.teal} />}
          </Pressable>
          {suggested && next && (
            <View style={styles.actions} testID="home-foundation-next">
              <Text style={{ color: C.ink }}>
                {suggested.title} · {next.resume ? 'En pausa' : labels[next.status]}
              </Text>
              <Button
                variant="secondary"
                onPress={() => {
                  if (travel.completed[suggested.id] && !next.resume && onFoundationReview)
                    onFoundationReview(suggested.id);
                  else onMission(suggested.id);
                }}
              >
                {next.resume ? 'Continuar práctica' : 'Abrir práctica recomendada'}
              </Button>
            </View>
          )}
          {foundationOpen &&
            foundation.map((activity) => {
              const inProgress =
                (travel.active?.missionId === activity.id && !travel.active.finished) ||
                !!travel.paused?.[activity.id];
              const evidence = path.find(({ id }) => id === activity.id);
              const status = inProgress
                ? ' · En pausa'
                : evidence
                  ? ` · ${labels[evidence.status]}`
                  : travel.completed[activity.id]
                    ? ' · Practicada'
                    : '';
              return (
                <Pressable
                  key={activity.id}
                  testID={`home-study-${activity.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={activity.title}
                  accessibilityHint={activity.objective}
                  onPress={() => {
                    stop();
                    onMission(activity.id);
                  }}
                  style={({ pressed }) => [
                    styles.foundationRow,
                    { borderTopWidth: 1, borderTopColor: C.line, opacity: pressed ? 0.72 : 1 },
                  ]}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.tabText, { color: C.ink }]}>
                      {activity.title}
                      {status}
                    </Text>
                    <Label>{activity.objective}</Label>
                  </View>
                  <ArrowRight color={C.teal} size={17} />
                </Pressable>
              );
            })}
        </JournalLeaf>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
        {missions.map((item, i) => (
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
  const grammarTopics = chapter.missions
    .filter(({ optional }) => !optional)
    .flatMap(({ steps }) => steps.filter((step) => step.type === 'teach'));
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

export function TravelPronunciation({
  onClose,
  onVoiceSettings,
}: {
  onClose: () => void;
  onVoiceSettings: () => void;
}) {
  const { colors: C } = useTheme();
  const drills = chapter.missions
    .filter(({ optional }) => !optional)
    .flatMap((mission) =>
      mission.vocabulary
        .filter(
          (word, index, words) =>
            words.findIndex((item) => item.example.en === word.example.en) === index,
        )
        .map((word) => ({ mission, itemId: word.term, text: word.example.en })),
    );
  const [selected, select] = useState<(typeof drills)[number]>();
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
      <FlowFrame
        journal={{}}
        title={selected.text}
        eyebrow="Práctica de pronunciación"
        onClose={leave}
      >
        <SpeakingPanel
          key={`${selected.mission.id}:${selected.itemId}`}
          text={selected.text}
          chapterId="home"
          onDone={leave}
          onStopReference={stop}
          onPlay={() => void play(selected.text)}
          feedback={(transcript) => drillFeedback(transcript, selected.text)}
          evidenceScope={{
            source: 'travel-guide',
            materialId: selected.mission.id,
            itemId: selected.itemId,
          }}
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
      {drills.map((drill) => (
        <JournalLeaf style={{ gap: 8 }} key={`${drill.mission.id}:${drill.itemId}`}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <MapPin size={15} color={C.accent} />
            <Label>{drill.mission.place}</Label>
          </View>
          <Text accessibilityLanguage="en-US" style={[styles.drill, { color: C.ink }]}>
            {drill.text}
          </Text>
          <View style={{ gap: 8, flexDirection: 'row', flexWrap: 'wrap' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Escuchar: ${drill.text}`}
              onPress={() => void play(drill.text)}
              style={[styles.tab, { backgroundColor: C.mint, borderColor: C.line }]}
            >
              <Volume2 color={C.teal} size={20} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Practicar: ${drill.text}`}
              onPress={() => {
                stop();
                select(drill);
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
  foundationRow: {
    minHeight: 48,
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
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
