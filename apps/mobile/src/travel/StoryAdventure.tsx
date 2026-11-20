import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
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
  Compass,
  MapPin,
  MessageCircle,
  Search,
  Stamp,
  Volume2,
  type LucideIcon,
} from 'lucide-react-native';
import { chapter, type StoryOperation, type StoryView } from '@lingoquest/offline-engine';
import samPortrait from '../../assets/journal/sam.jpg';
import { FlowFrame, InputViewportContext } from '../features/FeatureUI';
import { JournalLeaf, JournalPostcardFrame, PaperGrain } from '../Journal';
import { useTheme } from '../theme';
import { Button } from '../ui';
import { illustrations } from './illustrations';
import { useChapterAudio } from './useChapterAudio';

const sceneArt = { plaza: illustrations.plaza, bus: illustrations.bus, bag: illustrations.bag };
const portraits = { sam: samPortrait, luz: illustrations.luz };
const hotspotIcons = { npc: MessageCircle, object: Search, exit: ArrowRight };
const itemKinds = { story: 'Historia', quest: 'Misión', souvenir: 'Recuerdo' };
const questStatuses = {
  locked: 'Bloqueada',
  available: 'Disponible',
  active: 'En curso',
  completed: 'Completada',
};
const questKinds = { main: 'Historia principal', side: 'Opcional', review: 'Repaso' };
const english = Platform.OS === 'web' ? { lang: 'en-US' } : { accessibilityLanguage: 'en-US' };
const pinHeight = 48;
const pinGap = 6;

type Hotspot = StoryView['hotspots'][number];
type Pin = { hotspot: Hotspot; left: number; top: number; width: number };

function positionPins(hotspots: readonly Hotspot[], width: number, height: number) {
  const pins: Pin[] = [];
  for (const hotspot of hotspots) {
    if (!hotspot.position) return [];
    const pinWidth = Math.min(128, 48 + 8 * hotspot.label.length);
    const left = Math.max(
      4,
      Math.min(width - pinWidth - 4, (width * hotspot.position.x) / 100 - pinWidth / 2),
    );
    const top = (height * hotspot.position.y) / 100 - pinHeight / 2;
    if (
      top < 3 ||
      top + pinHeight > height - 16 ||
      pins.some(
        (pin) =>
          Math.abs(pin.top - top) < pinHeight + pinGap &&
          left < pin.left + pin.width + pinGap &&
          left + pinWidth + pinGap > pin.left,
      )
    )
      return [];
    pins.push({ hotspot, left, top, width: pinWidth });
  }
  return pins;
}

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
  pin = false,
}: {
  label: string;
  icon?: LucideIcon;
  id: string;
  disabled?: boolean;
  onPress: () => void;
  primary?: boolean;
  expanded?: boolean;
  style?: StyleProp<ViewStyle>;
  pin?: boolean;
}) {
  const { colors } = useTheme();
  const textColor = primary ? colors.onPrimary : colors.ink;
  return (
    <Pressable
      testID={id}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, expanded }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        buttonStyles.control,
        {
          backgroundColor: primary ? colors.primary : colors.white,
          borderColor: pin ? colors.teal : primary ? colors.primary : colors.line,
        },
        pin && buttonStyles.pin,
        style,
        pressed && { opacity: 0.8 },
        disabled && { opacity: 0.56 },
      ]}
    >
      {Icon && <Icon size={17} color={textColor} />}
      <Text numberOfLines={pin ? 2 : undefined} style={[buttonStyles.label, { color: textColor }]}>
        {label}
      </Text>
      {expanded !== undefined &&
        (expanded ? (
          <ChevronDown size={16} color={textColor} />
        ) : (
          <ChevronRight size={16} color={textColor} />
        ))}
    </Pressable>
  );
}

export function StoryAdventure({
  story,
  error,
  onAction,
  onClose,
  onResumeEncounter,
  onReview,
  onPassport,
  onVoiceSettings,
}: {
  story: StoryView;
  error?: string;
  onAction: (operation: StoryOperation) => Promise<void>;
  onClose: () => void;
  onResumeEncounter: () => Promise<void>;
  onReview: (missionId?: string) => void;
  onPassport: () => void;
  onVoiceSettings: () => void;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const { play, stop, speechMessage } = useChapterAudio();
  const [artSize, setArtSize] = useState({ width: 0, height: 0 });
  const [journal, setJournal] = useState<'quests' | 'inventory' | null>(null);
  const [translatedNode, setTranslatedNode] = useState<string>();
  const [acted, setActed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const inFlight = useRef(false);
  const { scene, dialogue, encounter, hotspots, inventory, quests, turn, origin } = story;
  const mainQuests = quests.filter((quest) => quest.kind === 'main');
  const completed = mainQuests.filter((quest) => quest.status === 'completed').length;
  const currentQuest =
    mainQuests.find((quest) => quest.status === 'active') ??
    mainQuests.find((quest) => quest.status === 'available');
  const currentGoal = currentQuest?.goals.find((goal) => !goal.completed)?.label;
  const illustration = Object.hasOwn(sceneArt, scene.art)
    ? sceneArt[scene.art as keyof typeof sceneArt]
    : illustrations.plaza;
  const npc = dialogue?.npc;
  const portrait =
    npc && Object.hasOwn(portraits, npc.id) ? portraits[npc.id as keyof typeof portraits] : null;
  const pins = fontScale <= 1.15 ? positionPins(hotspots, artSize.width, artSize.height) : [];
  const showTranslation = !!dialogue?.line && translatedNode === dialogue.id;

  async function perform(action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setActionError('');
    setTranslatedNode(undefined);
    stop();
    try {
      await action();
      setActed(true);
    } catch {
      setActionError('No pudimos guardar tu avance. Inténtalo de nuevo.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const act = (operation: StoryOperation) => void perform(() => onAction(operation));
  const leave = (action: () => void) => {
    stop();
    action();
  };

  function hotspotButton(hotspot: Hotspot, pin?: Pin) {
    const { id, kind, label } = hotspot;
    return (
      <StoryButton
        key={id}
        id={`story-hotspot-${id}`}
        icon={hotspotIcons[kind]}
        label={label}
        disabled={busy || !!dialogue || !!encounter}
        onPress={() => act({ action: 'interact', hotspotId: id, turn })}
        pin={!!pin}
        style={pin ? { left: pin.left, top: pin.top, width: pin.width } : s.hotspotTile}
      />
    );
  }

  return (
    <FlowFrame
      title={chapter.title}
      eyebrow="Aventura"
      journal={{}}
      onVoiceSettings={() => leave(onVoiceSettings)}
      onClose={() => leave(onClose)}
    >
      <View testID={`story-scene-${scene.id}`} style={s.group}>
        <JournalPostcardFrame taped>
          <View
            style={[s.art, scene.art !== 'plaza' && s.squareArt]}
            onLayout={({
              nativeEvent: {
                layout: { width, height },
              },
            }) => setArtSize({ width, height })}
          >
            <Image accessible={false} source={illustration} resizeMode="cover" style={s.image} />
            {pins.map((pin) => hotspotButton(pin.hotspot, pin))}
          </View>
        </JournalPostcardFrame>
        <JournalLeaf style={s.sceneNote}>
          <PaperGrain opacity={0.2} />
          <SectionHeading
            style={s.sceneTitle}
            focusKey={acted && !dialogue && !encounter ? `${scene.id}-${turn}` : undefined}
          >
            {scene.title}
          </SectionHeading>
          <Text style={s.body}>{scene.description}</Text>
          {origin && (
            <View testID="story-origin" style={s.origin}>
              <MapPin color={colors.accent} size={16} />
              <Text style={s.originText}>Salida · {origin}</Text>
            </View>
          )}
        </JournalLeaf>
        {!pins.length && (
          <View style={s.wrap}>{hotspots.map((hotspot) => hotspotButton(hotspot))}</View>
        )}
      </View>

      {dialogue && (
        <JournalLeaf kind="notebook" testID={`story-dialogue-${dialogue.id}`} style={s.dialogue}>
          <PaperGrain opacity={0.2} />
          {npc && (
            <View style={s.speakerRow}>
              {portrait && <Image source={portrait} accessible={false} style={s.portrait} />}
              <View style={s.speaker}>
                <SectionHeading focusKey={dialogue.id} style={s.panelTitle}>
                  {npc.name}
                </SectionHeading>
                <Text style={s.small}>{npc.role}</Text>
              </View>
            </View>
          )}
          {npc ? (
            <Text style={s.body}>{dialogue.text}</Text>
          ) : (
            <SectionHeading focusKey={dialogue.id} style={s.body}>
              {dialogue.text}
            </SectionHeading>
          )}
          {dialogue.line && (
            <View style={s.phrase}>
              <Text {...english} style={s.english}>
                {dialogue.line.en}
              </Text>
              {showTranslation && (
                <Text accessibilityLiveRegion="polite" style={s.body}>
                  {dialogue.line.es}
                </Text>
              )}
              <View style={s.wrap}>
                <Button
                  icon={Volume2}
                  variant="secondary"
                  onPress={() => dialogue.line && void play(dialogue.line.en, true)}
                  disabled={busy}
                >
                  Escuchar frase
                </Button>
                <StoryButton
                  id="story-translation"
                  label={showTranslation ? 'Ocultar traducción' : 'Mostrar traducción'}
                  expanded={showTranslation}
                  onPress={() => setTranslatedNode(showTranslation ? undefined : dialogue.id)}
                />
              </View>
              {speechMessage && (
                <Text accessibilityLiveRegion="polite" style={s.small}>
                  {speechMessage}
                </Text>
              )}
            </View>
          )}
          {dialogue.choices.map((choice) => (
            <StoryButton
              key={choice.id}
              id={`story-choice-${choice.id}`}
              label={choice.label}
              icon={ChevronRight}
              disabled={busy}
              onPress={() => act({ action: 'choose', choiceId: choice.id, turn })}
            />
          ))}
          <StoryButton
            id="story-dialogue-close"
            label="Cerrar diálogo"
            disabled={busy}
            onPress={() => act({ action: 'closeDialogue', turn })}
          />
        </JournalLeaf>
      )}

      {encounter && (
        <JournalLeaf testID="story-encounter" style={s.group}>
          <SectionHeading focusKey={encounter.id} style={s.panelTitle}>
            {chapter.missions.find((mission) => mission.id === encounter.missionId)?.title ??
              'Práctica de inglés'}
          </SectionHeading>
          {encounter.ready ? (
            <StoryButton
              id="story-encounter-finish"
              label="Volver a la aventura"
              icon={Compass}
              primary
              disabled={busy}
              onPress={() => act({ action: 'finishEncounter', turn })}
            />
          ) : (
            <StoryButton
              id="story-encounter-resume"
              label="Continuar con el inglés"
              icon={ArrowRight}
              primary
              disabled={busy}
              onPress={() => void perform(onResumeEncounter)}
            />
          )}
        </JournalLeaf>
      )}

      {!!(error || actionError) && (
        <Text accessibilityRole="alert" style={s.error}>
          {actionError || error}
        </Text>
      )}

      <View style={s.journal}>
        <JournalLeaf kind="notebook" style={s.group} testID="story-quests">
          <View style={s.journalTop}>
            <BookOpen color={colors.teal} size={20} />
            <Text style={s.small}>
              {completed} de {mainQuests.length} misiones principales completadas
            </Text>
          </View>
          {!!currentGoal && <Text style={s.body}>{currentGoal}</Text>}
          <StoryButton
            id="story-quests-toggle"
            label="Misiones"
            expanded={journal === 'quests'}
            onPress={() => setJournal(journal === 'quests' ? null : 'quests')}
          />
          {journal === 'quests' &&
            quests.map((quest) => (
              <View key={quest.id} testID={`story-quest-${quest.id}`} style={s.journalEntry}>
                <Text style={s.entryTitle}>{quest.title}</Text>
                <Text style={s.small}>
                  {questKinds[quest.kind]} · {questStatuses[quest.status]}
                </Text>
                {quest.status !== 'locked' && (
                  <>
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
                          quest.status === 'completed' ? 'Practicar de nuevo' : 'Practicar ahora'
                        }
                        onPress={() => leave(() => onReview(quest.reviewMissionId))}
                        disabled={busy}
                      />
                    )}
                  </>
                )}
              </View>
            ))}
        </JournalLeaf>
        <JournalLeaf kind="notebook" testID="story-inventory" style={s.group}>
          <View style={s.wrap}>
            <StoryButton
              id="story-inventory-toggle"
              label="Mochila"
              icon={Backpack}
              expanded={journal === 'inventory'}
              style={s.inventoryToggle}
              onPress={() => setJournal(journal === 'inventory' ? null : 'inventory')}
            />
            <StoryButton
              id="story-passport"
              label="Pasaporte"
              icon={Stamp}
              style={s.inventoryToggle}
              onPress={() => leave(onPassport)}
            />
          </View>
          {journal === 'inventory' &&
            (inventory.length ? (
              inventory.map((item) => (
                <View key={item.id} testID={`story-inventory-${item.id}`} style={s.journalEntry}>
                  <Text style={s.entryTitle}>{item.name}</Text>
                  <View style={s.journalTop}>
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
            ))}
        </JournalLeaf>
      </View>
    </FlowFrame>
  );
}

const buttonStyles = StyleSheet.create({
  control: {
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: 9,
  },
  label: { flexShrink: 1, fontFamily: 'ManropeBold', fontSize: 14 },
  pin: {
    position: 'absolute',
    height: pinHeight,
    minHeight: pinHeight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 2,
  },
});

function useStyles() {
  const { colors: C } = useTheme();
  return StyleSheet.create({
    group: { gap: 10 },
    art: { aspectRatio: 2, overflow: 'hidden', backgroundColor: C.mint, borderRadius: 4 },
    squareArt: { aspectRatio: 1.55 },
    image: { position: 'absolute', width: '100%', height: '100%' },
    sceneNote: { marginHorizontal: 12, marginTop: -21, gap: 7 },
    sceneTitle: { fontFamily: 'LoraBold', fontSize: 25, color: C.ink },
    origin: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 },
    originText: { flexShrink: 1, color: C.accent, fontFamily: 'ManropeBold', fontSize: 13 },
    body: { color: C.ink, fontFamily: 'Manrope', fontSize: 15, lineHeight: 23 },
    small: { flexShrink: 1, color: C.muted, fontFamily: 'Manrope', fontSize: 13, lineHeight: 20 },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    hotspotTile: { flexBasis: 135, flexGrow: 1 },
    dialogue: { gap: 12 },
    speakerRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    portrait: { width: 58, height: 58, borderRadius: 14 },
    speaker: { flex: 1, minWidth: 0 },
    panelTitle: { color: C.ink, fontFamily: 'LoraBold', fontSize: 22 },
    phrase: { padding: 12, gap: 10, backgroundColor: C.mint, borderRadius: 8 },
    english: { color: C.ink, fontFamily: 'LoraBold', fontSize: 20 },
    error: { color: C.red, fontFamily: 'ManropeBold', fontSize: 14 },
    journal: { gap: 12, marginTop: 3 },
    journalTop: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'center' },
    journalEntry: { gap: 5, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 },
    entryTitle: { color: C.ink, fontFamily: 'LoraBold', fontSize: 17 },
    goal: { color: C.teal, fontFamily: 'Manrope', fontSize: 14, lineHeight: 21 },
    inventoryToggle: { flexGrow: 1, flexBasis: 125 },
  });
}
