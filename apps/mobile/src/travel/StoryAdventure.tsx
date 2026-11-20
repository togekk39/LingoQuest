import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {
  ArrowRight,
  Backpack,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  MapPin,
  NotebookTabs,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import {
  chapter,
  type StoryOperation,
  type StoryView,
  type TravelCheckpoint,
  type TravelState,
} from '@lingoquest/offline-engine';
import { FlowFrame, InputViewportContext } from '../features/FeatureUI';
import { JournalLeaf, PaperGrain } from '../Journal';
import { localSettings } from '../lib/api';
import { useTheme } from '../theme';
import { StoryPhrase, StorySpeaker } from './StoryDialogueAppearance';
import { StoryScene } from './StoryScene';
import { TravelFlow, type TravelFlowHandle } from './TravelFlow';
import { useChapterAudio } from './useChapterAudio';

const itemKinds = { story: 'Historia', quest: 'Misión', souvenir: 'Recuerdo' };
const questStatuses = {
  locked: 'Bloqueada',
  available: 'Disponible',
  active: 'En curso',
  completed: 'Completada',
};
const questKinds = { main: 'Historia principal', side: 'Opcional', review: 'Repaso' };
const translationKey = 'storyTranslations';
type JournalPanel = { type: 'quests'; questId?: string } | { type: 'inventory' } | null;

function SectionHeading({
  children,
  focusKey,
  style,
}: {
  children: string;
  focusKey?: string;
  style: StyleProp<TextStyle>;
}) {
  const heading = useRef<View>(null);
  const { revealItem } = useContext(InputViewportContext);

  useEffect(() => {
    if (!focusKey) return;
    const frame = requestAnimationFrame(() => {
      const target = heading.current;
      if (!target) return;
      if (Platform.OS === 'web') target.focus();
      else AccessibilityInfo.sendAccessibilityEvent(target, 'focus');
      revealItem(target, () => heading.current === target);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusKey, revealItem]);

  return (
    <View
      ref={heading}
      accessible
      accessibilityLabel={children}
      accessibilityRole="header"
      tabIndex={-1}
      collapsable={false}
      style={Platform.OS === 'web' ? { outlineWidth: 0 } : undefined}
    >
      <Text accessible={false} style={style}>
        {children}
      </Text>
    </View>
  );
}

function StoryButton({
  label,
  icon: Icon,
  id,
  disabled = false,
  onPress,
  primary = false,
  expanded,
  style,
}: {
  label: string;
  icon?: LucideIcon;
  id: string;
  disabled?: boolean;
  onPress: () => void;
  primary?: boolean;
  expanded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, mode } = useTheme();
  const fill = mode === 'light' ? colors.ink : colors.teal;
  const textColor = primary ? (mode === 'light' ? colors.white : colors.paper) : colors.ink;
  const Chevron = expanded ? ChevronDown : ChevronRight;
  return (
    <Pressable
      testID={id}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, expanded }}
      aria-expanded={expanded}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        buttonStyles.control,
        {
          backgroundColor: primary ? fill : colors.white,
          borderColor: primary ? fill : colors.line,
        },
        style,
        pressed && { opacity: 0.8 },
        disabled && { opacity: 0.56 },
      ]}
    >
      {Icon && <Icon size={19} color={textColor} />}
      <Text style={[buttonStyles.label, { color: textColor }]}>{label}</Text>
      {expanded !== undefined && <Chevron size={18} color={textColor} />}
    </Pressable>
  );
}

export function StoryAdventure({
  story,
  checkpoint,
  playerName,
  error,
  finishing,
  onAction,
  onClose,
  onLessonUpdate,
  onResumeEncounter,
  onReview,
  onPassport,
  onVoiceSettings,
}: {
  story: StoryView;
  checkpoint?: TravelCheckpoint;
  playerName?: string;
  error?: string;
  finishing: boolean;
  onAction: (operation: StoryOperation) => Promise<void>;
  onClose: () => void;
  onLessonUpdate: (travel: TravelState) => void;
  onResumeEncounter: () => Promise<void>;
  onReview: (missionId?: string) => void;
  onPassport: () => void;
  onVoiceSettings: () => void;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const { play, stop, speechMessage } = useChapterAudio();
  const { scene, dialogue, encounter, hotspots, inventory, quests, turn, origin } = story;
  const lesson = useRef<TravelFlowHandle>(null);
  const [journal, setJournal] = useState<JournalPanel>(null);
  const [translationsVisible, setTranslationsVisible] = useState(true);
  const translationTouched = useRef(false);
  const translationWrites = useRef(Promise.resolve());
  const knownItems = useRef(new Set(inventory.map(({ id }) => id)));
  const [newItem, setNewItem] = useState('');
  const [acted, setActed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const inFlight = useRef(false);

  const mainQuests = quests.filter((quest) => quest.kind === 'main');
  const completed = mainQuests.filter((quest) => quest.status === 'completed').length;
  const currentQuest =
    mainQuests.find((quest) => quest.status === 'active') ??
    mainQuests.find((quest) => quest.status === 'available');
  const missionTitle = currentQuest?.title ?? 'Misiones principales';
  const missionProgress = `${completed} de ${mainQuests.length} misiones principales completadas`;
  const questsOpen = journal?.type === 'quests';
  const inventoryOpen = journal?.type === 'inventory';
  const dialogueAudio = dialogue?.line?.en;
  const activeCheckpoint =
    encounter &&
    !encounter.suspended &&
    !encounter.ready &&
    checkpoint?.missionId === encounter.missionId
      ? checkpoint
      : undefined;
  const encounterTitle = chapter.missions.find(({ id }) => id === encounter?.missionId)?.title;
  const hasPanel = !!(dialogue || activeCheckpoint || finishing || encounter?.ready);
  const wide = hasPanel && width >= 1024 && fontScale < 1.35;
  const locked = busy || finishing;

  useEffect(() => {
    if (dialogueAudio) void play(dialogueAudio, true);
  }, [dialogueAudio, play]);

  useEffect(() => {
    let mounted = true;
    void localSettings.get(translationKey, true).then((visible) => {
      if (mounted && !translationTouched.current) setTranslationsVisible(visible);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const acquired = inventory.filter(({ id }) => !knownItems.current.has(id));
    knownItems.current = new Set(inventory.map(({ id }) => id));
    if (acquired.length) setNewItem(acquired.map(({ name }) => name).join(', '));
  }, [inventory]);

  useEffect(() => {
    if (!newItem) return;
    const timer = setTimeout(() => setNewItem(''), 6000);
    return () => clearTimeout(timer);
  }, [newItem]);

  function toggleTranslation() {
    translationTouched.current = true;
    const next = !translationsVisible;
    setTranslationsVisible(next);
    translationWrites.current = translationWrites.current
      .then(() => localSettings.set(translationKey, next))
      .catch(() => setActionError('No pudimos guardar la preferencia de traducción.'));
  }

  async function perform(action: () => void | Promise<void>) {
    if (finishing || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setActionError('');
    try {
      if (lesson.current && !(await lesson.current.suspend())) return;
      stop();
      await action();
      setActed(true);
    } catch (e) {
      setActionError(
        e instanceof Error && e.message
          ? e.message
          : 'No pudimos guardar tu avance. Inténtalo de nuevo.',
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const act = (operation: StoryOperation) =>
    void perform(async () => {
      await onAction(operation);
      setJournal(null);
    });
  const resume = () =>
    void perform(async () => {
      await onResumeEncounter();
      setJournal(null);
    });
  const closePanel = () => act({ action: dialogue ? 'closeDialogue' : 'suspendEncounter', turn });

  function interact(hotspotId: string) {
    const hotspot = hotspots.find(({ id }) => id === hotspotId);
    if (encounter?.npc && hotspot?.npcId === encounter.npc.id) {
      if (!activeCheckpoint) resume();
      return;
    }
    act({ action: 'interact', hotspotId, turn });
  }

  const closeControl = (
    <Pressable
      testID="story-dialogue-close"
      accessibilityRole="button"
      accessibilityLabel="Cerrar diálogo"
      accessibilityState={{ disabled: locked }}
      disabled={locked}
      onPress={closePanel}
      style={({ pressed }) => [s.closePanel, pressed && { opacity: 0.68 }]}
    >
      <X size={21} color={colors.ink} />
    </Pressable>
  );

  const panel = dialogue ? (
    <JournalLeaf kind="notebook" testID={`story-dialogue-${dialogue.id}`} style={s.dialogue}>
      <PaperGrain opacity={0.23} />
      <View style={s.speakerRow}>
        <View style={s.speaker}>
          {dialogue.npc ? (
            <StorySpeaker
              name={dialogue.npc.name}
              heading={
                <SectionHeading focusKey={dialogue.id} style={s.panelTitle}>
                  {dialogue.npc.name}
                </SectionHeading>
              }
            >
              <Text style={s.body}>{dialogue.text}</Text>
            </StorySpeaker>
          ) : (
            <SectionHeading focusKey={dialogue.id} style={s.panelTitle}>
              {scene.title}
            </SectionHeading>
          )}
        </View>
        {closeControl}
      </View>
      {!dialogue.npc && <Text style={s.body}>{dialogue.text}</Text>}
      {dialogue.line && (
        <StoryPhrase
          line={dialogue.line}
          exampleLabel={dialogue.exampleLabel}
          showTranslation={translationsVisible}
          onToggleTranslation={toggleTranslation}
          onListen={() => dialogue.line && void play(dialogue.line.en, true)}
          disabled={locked}
        />
      )}
      {!!dialogue.tip && (
        <View style={s.tip}>
          <Lightbulb size={20} color={colors.accent} />
          <Text style={s.tipText}>
            <Text style={s.tipLabel}>Consejo </Text>
            {dialogue.tip}
          </Text>
        </View>
      )}
      {!!speechMessage && (
        <Text accessibilityLiveRegion="polite" style={s.small}>
          {speechMessage}
        </Text>
      )}
      {!!dialogue.choices.length ? (
        <View style={s.actions}>
          {dialogue.choices.map((choice, index) => (
            <StoryButton
              key={choice.id}
              id={`story-choice-${choice.id}`}
              label={choice.label}
              icon={index === 0 ? ArrowRight : ChevronRight}
              primary={index === 0}
              disabled={locked}
              onPress={() => act({ action: 'choose', choiceId: choice.id, turn })}
            />
          ))}
        </View>
      ) : (
        <StoryButton
          id="story-dialogue-continue"
          label="Volver a la escena"
          icon={ArrowRight}
          primary
          disabled={locked}
          onPress={closePanel}
        />
      )}
    </JournalLeaf>
  ) : hasPanel && encounter ? (
    <JournalLeaf kind="notebook" testID="story-encounter" style={s.dialogue}>
      <PaperGrain opacity={0.23} />
      <View style={s.lessonTop}>
        <Text style={s.lessonTitle}>{encounterTitle}</Text>
        {!encounter.ready && closeControl}
      </View>
      {activeCheckpoint ? (
        <TravelFlow
          key={encounter.id}
          ref={lesson}
          initial={activeCheckpoint}
          playerName={playerName}
          onUpdate={onLessonUpdate}
          embedded={{
            translationsVisible,
            onToggleTranslation: toggleTranslation,
          }}
          onClose={closePanel}
          onPassport={() => void perform(onPassport)}
          onVoiceSettings={() => void perform(onVoiceSettings)}
          onReview={onReview}
        />
      ) : finishing ? (
        <Text accessibilityLiveRegion="polite" style={s.body}>
          Guardando tu avance…
        </Text>
      ) : (
        <StoryButton
          id="story-encounter-finish"
          label="Volver a la aventura"
          icon={ArrowRight}
          disabled={locked}
          primary
          onPress={() => act({ action: 'finishEncounter', turn })}
        />
      )}
    </JournalLeaf>
  ) : null;

  return (
    <FlowFrame
      title={chapter.title}
      eyebrow="Aventura"
      journal={{ storybook: true, wide }}
      onVoiceSettings={() => void perform(onVoiceSettings)}
      onClose={() => void perform(onClose)}
    >
      <View style={[s.spread, wide && s.wideSpread]}>
        <View style={[s.scenePage, wide && s.wideScenePage]}>
          <StoryScene
            scene={scene}
            hotspots={hotspots}
            activeNpc={dialogue?.npc?.id ?? (activeCheckpoint ? encounter?.npc?.id : undefined)}
            disabled={locked}
            onInteract={interact}
          />
          <View style={s.caption}>
            <MapPin size={14} color={colors.accent} />
            <SectionHeading
              focusKey={acted && !hasPanel ? `${scene.id}-${turn}` : undefined}
              style={s.sceneTitle}
            >
              {scene.title}
            </SectionHeading>
            {!!origin && (
              <Text testID="story-origin" style={s.small}>
                · {origin}
              </Text>
            )}
          </View>
          {!hasPanel && <Text style={s.sceneDescription}>{scene.description}</Text>}
        </View>
        <View style={[s.notesPage, wide && s.wideNotesPage]}>
          {panel}
          {encounter && !encounter.ready && !activeCheckpoint && !finishing && (
            <StoryButton
              id="story-encounter-resume"
              label={
                encounter.npc ? `Continuar con ${encounter.npc.name}` : 'Continuar con el inglés'
              }
              icon={ArrowRight}
              primary
              disabled={locked}
              onPress={resume}
            />
          )}
          {!!(error || actionError) && (
            <Text accessibilityRole="alert" style={s.error}>
              {actionError || error}
            </Text>
          )}
          {!!newItem && (
            <View style={s.itemNotice}>
              <Check size={17} color={colors.teal} />
              <Text accessibilityLiveRegion="polite" style={s.tipText}>
                Guardado en tu mochila · {newItem}
              </Text>
            </View>
          )}
          <View testID="story-quests" style={s.group}>
            <Pressable
              testID="story-quests-toggle"
              accessibilityRole="button"
              accessibilityLabel={`Misiones. ${missionTitle}. ${missionProgress}`}
              accessibilityState={{ expanded: questsOpen }}
              aria-expanded={questsOpen}
              onPress={() => setJournal(questsOpen ? null : { type: 'quests' })}
              style={({ pressed }) => [s.questSummary, pressed && { opacity: 0.82 }]}
            >
              <BookOpen color={colors.teal} size={18} />
              <View style={s.questCopy}>
                <Text style={s.questTitle}>{missionTitle}</Text>
                <Text style={s.small}>{missionProgress}</Text>
              </View>
              {questsOpen ? (
                <ChevronDown size={16} color={colors.teal} />
              ) : (
                <ChevronRight size={16} color={colors.teal} />
              )}
            </Pressable>
            {questsOpen && (
              <View style={s.questList}>
                {quests.map((quest) => {
                  const canExpand = quest.status !== 'locked';
                  const expanded = canExpand && journal.questId === quest.id;
                  const Chevron = expanded ? ChevronDown : ChevronRight;
                  const status = questStatuses[quest.status];
                  const summary = (
                    <View style={s.questCopy}>
                      <Text style={s.questTitle}>{quest.title}</Text>
                      <Text style={s.small}>{status}</Text>
                    </View>
                  );
                  return (
                    <View key={quest.id} testID={`story-quest-${quest.id}`} style={s.questEntry}>
                      {canExpand ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${quest.title}. ${status}`}
                          accessibilityState={{ expanded }}
                          aria-expanded={expanded}
                          onPress={() =>
                            setJournal({ type: 'quests', questId: expanded ? undefined : quest.id })
                          }
                          style={({ pressed }) => [s.questRow, pressed && { opacity: 0.72 }]}
                        >
                          {summary}
                          <Chevron size={16} color={colors.teal} />
                        </Pressable>
                      ) : (
                        <View style={s.questRow}>{summary}</View>
                      )}
                      {expanded && (
                        <View testID={`story-quest-detail-${quest.id}`} style={s.questDetails}>
                          <Text style={s.small}>{questKinds[quest.kind]}</Text>
                          <Text style={s.body}>{quest.description}</Text>
                          {quest.goals.map((goal) => (
                            <Text key={goal.id} style={s.goal}>
                              {goal.completed ? '✓ ' : '○ '}
                              {goal.label}
                            </Text>
                          ))}
                          {quest.kind === 'review' && (
                            <StoryButton
                              id={`story-review-${quest.id}`}
                              label={
                                quest.status === 'completed'
                                  ? 'Practicar de nuevo'
                                  : 'Practicar ahora'
                              }
                              onPress={() => void perform(() => onReview(quest.reviewMissionId))}
                              disabled={locked}
                            />
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
          <View testID="story-inventory" style={s.group}>
            <View style={s.tools}>
              <StoryButton
                id="story-inventory-toggle"
                label="Mochila"
                icon={Backpack}
                expanded={inventoryOpen}
                style={s.toolButton}
                onPress={() => setJournal(inventoryOpen ? null : { type: 'inventory' })}
              />
              <StoryButton
                id="story-passport"
                label="Pasaporte"
                icon={NotebookTabs}
                style={s.toolButton}
                disabled={locked}
                onPress={() => void perform(onPassport)}
              />
            </View>
            {inventoryOpen && (
              <JournalLeaf kind="notebook" style={s.group}>
                {inventory.length ? (
                  inventory.map((item) => (
                    <View
                      key={item.id}
                      testID={`story-inventory-${item.id}`}
                      style={s.journalEntry}
                    >
                      <Text style={s.entryTitle}>{item.name}</Text>
                      <View style={s.caption}>
                        <Text style={s.small}>{itemKinds[item.kind]}</Text>
                        {item.used && (
                          <>
                            <Check color={colors.teal} size={15} />
                            <Text style={s.small}>Usado en la historia</Text>
                          </>
                        )}
                      </View>
                      <Text style={s.body}>{item.description}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={s.body}>Tu mochila está vacía.</Text>
                )}
              </JournalLeaf>
            )}
          </View>
        </View>
      </View>
    </FlowFrame>
  );
}

const buttonStyles = StyleSheet.create({
  control: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 10,
  },
  label: { flexShrink: 1, fontFamily: 'ManropeBold', fontSize: 14 },
});

function useStyles() {
  const { colors: C } = useTheme();
  return StyleSheet.create({
    spread: { gap: 13 },
    wideSpread: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
    scenePage: { gap: 6, minWidth: 0 },
    wideScenePage: { flex: 1.25 },
    notesPage: { gap: 8, minWidth: 0 },
    wideNotesPage: { flex: 1 },
    group: { gap: 9 },
    caption: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
    sceneTitle: { fontFamily: 'ManropeBold', fontSize: 12, color: C.ink },
    sceneDescription: { fontFamily: 'Manrope', fontSize: 12, lineHeight: 18, color: C.muted },
    body: { color: C.ink, fontFamily: 'Manrope', fontSize: 15, lineHeight: 22 },
    small: { flexShrink: 1, color: C.muted, fontFamily: 'Manrope', fontSize: 12, lineHeight: 17 },
    dialogue: { gap: 11, padding: 14 },
    speakerRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
    speaker: { flex: 1, minWidth: 0 },
    panelTitle: { color: C.ink, fontFamily: 'LoraBold', fontSize: 23 },
    lessonTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    lessonTitle: { flexShrink: 1, color: C.muted, fontFamily: 'ManropeBold', fontSize: 12 },
    closePanel: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: C.mint,
      borderRadius: 12,
    },
    tip: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      padding: 9,
      borderRadius: 8,
      backgroundColor: C.paper,
    },
    tipLabel: { fontFamily: 'ManropeBold', color: C.accent },
    tipText: { color: C.ink, fontFamily: 'Manrope', fontSize: 13, flex: 1 },
    actions: { gap: 7 },
    error: { color: C.red, fontFamily: 'ManropeBold', fontSize: 14 },
    itemNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 3 },
    questSummary: {
      minHeight: 46,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderTopWidth: 1,
      borderColor: C.line,
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    questCopy: { flex: 1, minWidth: 0 },
    questTitle: { color: C.ink, fontFamily: 'ManropeBold', fontSize: 13 },
    questList: { paddingHorizontal: 8, backgroundColor: C.white, borderRadius: 8 },
    questEntry: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
    questRow: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    questDetails: { gap: 5, paddingHorizontal: 4, paddingBottom: 10 },
    journalEntry: { gap: 5, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 9 },
    entryTitle: { color: C.ink, fontFamily: 'LoraBold', fontSize: 16 },
    goal: { color: C.teal, fontFamily: 'Manrope', fontSize: 14, lineHeight: 21 },
    tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    toolButton: { flexGrow: 1, flexBasis: 124, justifyContent: 'center' },
  });
}
