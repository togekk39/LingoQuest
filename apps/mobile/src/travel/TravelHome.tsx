import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  ArrowRight,
  Backpack,
  BookOpen,
  BusFront,
  Check,
  ChevronRight,
  Compass,
  Flag,
  Headphones,
  LockKeyhole,
  MapPin,
  MapPinned,
  NotebookPen,
  RotateCcw,
  Stamp,
} from 'lucide-react-native';
import {
  chapter,
  canStartTravelMission,
  nextTravelMission,
  homeCountries,
  route,
  type Destination,
  type HomeCountry,
  type TravelState,
} from '@lingoquest/offline-engine';
import type { Progress } from '@lingoquest/contracts';
import { JournalArt, JournalLeaf, JournalSpread, Notebook, PaperGrain } from '../Journal';
import { illustrations, placeIllustration } from './illustrations';
import { Button, Heading, Label } from '../ui';
import { useTheme } from '../theme';

import hometown from '../../assets/travel/hometown.jpg';
import world from '../../assets/travel/world.png';
const displayNumber = (n: number) => String(n).padStart(2, '0');
const homeName = (state: TravelState) =>
  state.country ? homeCountries[state.country] : 'Tu lugar de origen';
const completedCount = (state: TravelState) =>
  chapter.missions.filter((m) => state.completed[m.id]).length;
const missionIcons = [MapPin, BusFront, Backpack];

export function TravelHome({
  travel,
  progress,
  starting,
  onContinue,
  onMission,
  onReview,
  onRoute,
  onGuide,
  onPassport,
  onSpeech,
  onFullReview,
}: {
  travel: TravelState;
  progress: Progress;
  starting: boolean;
  onContinue: () => void;
  onMission: (id: string) => void;
  onReview: () => void;
  onRoute: () => void;
  onGuide: () => void;
  onPassport: () => void;
  onSpeech: () => void;
  onFullReview: () => void;
}) {
  const { colors: C } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const s = useStyles();
  const wide = width >= 1120 && fontScale <= 1.25;
  const count = completedCount(travel);
  const next = nextTravelMission(travel);
  const active = travel.active;
  const activeMission = next && active?.missionId === next.id ? active : undefined;
  const chapterDone = !!travel.stamps[chapter.id];

  return (
    <View style={s.home}>
      <View style={s.homeHeader}>
        <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
          <View style={s.homeLocation}>
            <MapPin size={14} color={C.accent} />
            <Text style={s.homeKicker}>{homeName(travel)}</Text>
          </View>
          <Text accessibilityRole="header" style={[s.pageTitle, wide && { fontSize: 42 }]}>
            Cuaderno de viaje
          </Text>
        </View>
        {!!next && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir pasaporte"
            onPress={onPassport}
            style={({ pressed }) => [s.passportButton, pressed && { opacity: 0.7 }]}
          >
            <Stamp size={21} color={C.accent} />
            <Text style={s.passportLabel}>Pasaporte</Text>
          </Pressable>
        )}
      </View>
      <View style={[s.homeColumns, wide && s.homeColumnsWide]}>
        <View testID="home-mission-postcard" style={[s.missionPostcard, wide && { flex: 1.35 }]}>
          <View style={[s.postcardView, wide && { height: 270 }]}>
            <Image
              source={next ? placeIllustration(next.place) : illustrations.passport}
              accessible={false}
              resizeMode="cover"
              style={s.postcardImage}
            />
            <View style={s.postcardTop}>
              <View style={s.postcardPlace}>
                <MapPin size={16} color="#304835" />
                <Text style={s.postcardPlaceText}>{next?.place ?? homeName(travel)}</Text>
              </View>
              <View pointerEvents="none" style={s.postcardStamp}>
                <Compass size={27} color="#69442C" strokeWidth={1.4} />
              </View>
            </View>
          </View>
          <View style={s.postcardTicket}>
            <PaperGrain opacity={0.26} />
            <View style={s.postcardChapter}>
              <View style={s.chapterLine} />
              <Text style={s.postcardLabel}>
                {activeMission?.finished
                  ? 'Misión completada'
                  : activeMission
                    ? 'Misión en curso'
                    : next
                      ? 'Siguiente misión'
                      : chapterDone
                        ? 'Sello obtenido'
                        : 'Ruta validada'}
              </Text>
            </View>
            <Text accessibilityRole="header" style={[s.missionTitle, wide && { fontSize: 36 }]}>
              {next?.title ?? chapter.title}
            </Text>
            <Text style={s.missionBrief}>
              {activeMission?.finished
                ? next?.success
                : (next?.objective ??
                  (chapterDone
                    ? 'Tu primer sello y la postal de Sam están en el pasaporte.'
                    : 'Puedes volver a cualquiera de estas misiones desde la ruta.'))}
            </Text>
            <View style={s.postcardAction}>
              {!!next && <Text style={s.missionTime}>{next.minutes} min</Text>}
              <Button
                icon={next ? ArrowRight : Stamp}
                style={s.missionAction}
                loading={starting}
                onPress={onContinue}
              >
                {next ? 'Continuar viaje' : 'Ver mi pasaporte'}
              </Button>
            </View>
          </View>
        </View>

        <View style={[s.homeRail, wide && { flex: 1 }]}>
          <View testID="home-route" style={s.homeRoute}>
            <View style={s.routeHeader}>
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <Text accessibilityRole="header" style={s.homeSubheading}>
                  Ruta del capítulo
                </Text>
                <Text style={s.muted}>{chapter.title}</Text>
              </View>
              <View
                accessible
                accessibilityLabel={`${count} de ${chapter.missions.length} misiones completadas`}
                style={s.routeTally}
              >
                <Flag size={15} color={C.accent} />
                <Text style={s.tallyText}>
                  {count} / {chapter.missions.length}
                </Text>
              </View>
            </View>
            <View style={s.routeStops}>
              <View pointerEvents="none" style={s.routeTrack} />
              {chapter.missions.map((mission, index) => {
                const Icon = missionIcons[index];
                const current = mission.id === next?.id;
                const done = !!travel.completed[mission.id];
                const cleared = travel.cleared?.some((id) => id === mission.id);
                const available = canStartTravelMission(travel, mission.id);
                const disabled = !available || starting;
                const status = done
                  ? 'Completada'
                  : current
                    ? activeMission
                      ? 'En curso'
                      : 'Siguiente'
                    : travel.paused?.[mission.id]
                      ? 'En pausa'
                      : cleared
                        ? 'Validada'
                        : available
                          ? 'Disponible'
                          : 'Bloqueada';
                return (
                  <Pressable
                    key={mission.id}
                    testID={`home-stop-${mission.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={mission.title}
                    accessibilityHint={status}
                    accessibilityState={{ disabled, selected: current }}
                    disabled={disabled}
                    onPress={() => onMission(mission.id)}
                    style={({ pressed }) => [s.routeStop, pressed && { opacity: 0.72 }]}
                  >
                    <View style={[s.stopBadge, current && s.stopCurrent, done && s.stopDone]}>
                      {done ? (
                        <Check size={20} color={C.teal} />
                      ) : available ? (
                        <Icon size={19} color={current ? C.onPrimary : C.teal} />
                      ) : (
                        <LockKeyhole size={16} color={C.muted} />
                      )}
                    </View>
                    <Text style={s.stopTitle}>{mission.place}</Text>
                    <Text style={[s.stopStatus, current && { color: C.accent }]}>{status}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Button variant="ghost" icon={MapPinned} style={s.openMap} onPress={onRoute}>
              Ver mapa y misiones
            </Button>
          </View>
          <View testID="home-practice" style={s.practice}>
            <Text accessibilityRole="header" style={s.homeSubheading}>
              Practicar a tu ritmo
            </Text>
            <View style={s.practiceList}>
              <PracticeRow
                icon={RotateCcw}
                title="Repaso rápido"
                detail={
                  progress.reviewCount
                    ? `${progress.reviewCount} por repasar · 1 min`
                    : 'Una frase · 1 min'
                }
                onPress={onReview}
              />
              <PracticeRow
                icon={BookOpen}
                title="Palabras del viaje"
                detail="Significados, ejemplos y audio"
                onPress={onGuide}
              />
              <PracticeRow icon={Headphones} title="Practicar pronunciación" onPress={onSpeech} />
              <PracticeRow icon={NotebookPen} title="Repasar un poquito" onPress={onFullReview} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function PracticeRow({
  icon: Icon,
  title,
  detail,
  onPress,
}: {
  icon: typeof Compass;
  title: string;
  detail?: string;
  onPress: () => void;
}) {
  const { colors: C } = useTheme();
  const s = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={detail}
      onPress={onPress}
      style={({ pressed }) => [s.practiceRow, pressed && { backgroundColor: C.mint }]}
    >
      <Icon color={C.teal} size={19} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={s.rowTitle}>{title}</Text>
        {!!detail && <Text style={s.muted}>{detail}</Text>}
      </View>
      <ChevronRight color={C.accent} size={18} />
    </Pressable>
  );
}

const mapGroups: { name: string; target: string; position: [number, number] }[] = [
  { name: 'América del Norte', target: 'home', position: [-100, 33] },
  { name: 'América del Sur', target: 'colombia', position: [-58, -21] },
  { name: 'Europa', target: 'london', position: [12, 55] },
  { name: 'África', target: 'cairo', position: [21, 3] },
  { name: 'Asia', target: 'singapore', position: [107, 41] },
  { name: 'Oceanía', target: 'australia', position: [145, -27] },
  { name: 'Antártida', target: 'antarctica', position: [-62, -72] },
];

const southAmericanHomes = new Set<HomeCountry>([
  'AR',
  'BO',
  'BR',
  'CL',
  'CO',
  'EC',
  'GY',
  'PY',
  'PE',
  'SR',
  'UY',
  'VE',
]);

export function TravelRoute({
  travel,
  selected,
  onSelect,
  onStart,
  onCountry,
  onPassport,
}: {
  travel: TravelState;
  selected: Destination;
  onSelect: (id: string) => void;
  onStart: (id: string) => void;
  onCountry: () => void;
  onPassport: () => void;
}) {
  const { colors: C } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const s = useStyles();
  const isHome = selected.id === chapter.id;
  const homeIsInSouthAmerica = !!travel.country && southAmericanHomes.has(travel.country);
  const selectedContinent = isHome && homeIsInSouthAmerica ? 'América del Sur' : selected.continent;
  const horizon = width < 800 || fontScale > 1.25;
  const active = travel.active;
  return (
    <View testID="world-atlas" style={{ gap: 15 }}>
      <JournalSpread
        source={illustrations.atlas}
        title="Mapa del viaje"
        detail="20 paradas, 7 continentes. Explora el mapa o elige un destino en la lista."
      >
        <View style={[s.row, { flexWrap: 'wrap' }]}>
          <Button variant="secondary" icon={Flag} onPress={onCountry}>
            Elegir lugar de origen
          </Button>
          <Button variant="secondary" icon={Stamp} onPress={onPassport}>
            Pasaporte
          </Button>
        </View>
      </JournalSpread>
      <JournalLeaf style={{ padding: 6 }}>
        <View style={s.world}>
          <Image
            accessible={false}
            source={world}
            resizeMode="stretch"
            style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}
          />
          {!isHome && (
            <View
              pointerEvents="none"
              style={[
                s.destinationPin,
                {
                  left: `${(selected.position[0] + 180) / 3.6}%`,
                  top: `${(90 - selected.position[1]) / 1.8}%`,
                },
              ]}
            />
          )}
          {mapGroups.map((region, i) => (
            <Pressable
              key={region.target}
              accessibilityRole="button"
              accessibilityLabel={region.name}
              accessibilityState={{ selected: selectedContinent === region.name }}
              onPress={() => {
                const target = homeIsInSouthAmerica
                  ? region.target === 'home'
                    ? 'mexico'
                    : region.target === 'colombia'
                      ? 'home'
                      : region.target
                  : region.target;
                onSelect(target);
              }}
              style={[
                s.mapTarget,
                {
                  left: `${(region.position[0] + 180) / 3.6}%`,
                  top: `${(90 - region.position[1]) / 1.8}%`,
                },
              ]}
            >
              <View style={[s.mapMarker, selectedContinent === region.name && s.mapSelected]}>
                <Text style={s.markerText}>{i + 1}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </JournalLeaf>
      <View
        style={{ flexDirection: horizon ? 'column' : 'row', alignItems: 'flex-start', gap: 16 }}
      >
        <JournalLeaf
          style={[
            s.routeDetail,
            { width: horizon ? '100%' : undefined, flex: horizon ? undefined : 1.4 },
          ]}
        >
          <View style={s.row}>
            <MapPin size={19} color={C.teal} />
            <Text style={s.meta}>{isHome ? homeName(travel) : selected.location}</Text>
          </View>
          <Heading style={{ fontSize: 30 }}>{isHome ? chapter.title : selected.name}</Heading>
          <Label style={s.copy}>{selected.description}</Label>
          <Text style={s.rowTitle}>{selected.goals.join(' · ')}</Text>
          {isHome ? (
            <>
              {chapter.missions.map((mission, i) => {
                const available = canStartTravelMission(travel, mission.id);
                const inProgress =
                  active?.missionId === mission.id || !!travel.paused?.[mission.id];
                const Icon = missionIcons[i];
                return (
                  <Pressable
                    key={mission.id}
                    accessibilityRole="button"
                    accessibilityLabel={mission.title}
                    accessibilityHint={mission.objective}
                    accessibilityState={{ disabled: !available }}
                    disabled={!available}
                    onPress={() => onStart(mission.id)}
                    style={[
                      s.missionPreview,
                      { borderWidth: 1, borderColor: C.line, padding: 10, borderRadius: 13 },
                    ]}
                  >
                    <View style={s.tileIcon}>
                      <Icon size={19} color={C.teal} />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={s.rowTitle}>{mission.title}</Text>
                      <Label style={s.copy}>{mission.objective}</Label>
                      <Text style={s.muted}>
                        {inProgress
                          ? 'Continuar · '
                          : travel.completed[mission.id]
                            ? 'Completada · '
                            : ''}
                        {mission.minutes} min
                      </Text>
                    </View>
                    {available ? (
                      <ArrowRight size={17} color={C.teal} />
                    ) : (
                      <LockKeyhole size={17} color={C.muted} />
                    )}
                  </Pressable>
                );
              })}
            </>
          ) : (
            <Label style={s.status}>
              Historia en preparación · Plan de estudio {selected.band}
            </Label>
          )}
        </JournalLeaf>
        <JournalLeaf
          style={[
            s.routeDetail,
            { width: horizon ? '100%' : undefined, flex: horizon ? undefined : 1 },
          ]}
        >
          <Heading style={{ fontSize: 24 }}>Destinos</Heading>
          {route.map((destination, i) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: selected.id === destination.id }}
              key={destination.id}
              onPress={() => onSelect(destination.id)}
              style={[
                s.routeItem,
                destination.id === selected.id && { backgroundColor: C.mint, borderRadius: 10 },
              ]}
              accessibilityLabel={`${i + 1}. ${destination.name}`}
            >
              <View
                style={[
                  s.routeIndex,
                  { backgroundColor: destination.id === selected.id ? C.primary : C.paper },
                ]}
              >
                <Text
                  style={[s.meta, { color: destination.id === selected.id ? C.onPrimary : C.ink }]}
                >
                  {displayNumber(i + 1)}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.rowTitle}>
                  {destination.id === 'home' ? homeName(travel) : destination.name}
                </Text>
                <Text style={s.muted}>
                  {destination.id === 'home'
                    ? travel.stamps.home
                      ? 'Sello obtenido'
                      : 'Capítulo disponible'
                    : 'En preparación'}
                </Text>
              </View>
              <ChevronRight size={17} color={C.teal} />
            </Pressable>
          ))}
        </JournalLeaf>
      </View>
    </View>
  );
}

export function CountryPicker({
  selected,
  onSelect,
}: {
  selected?: HomeCountry;
  onSelect: (value: HomeCountry) => void;
}) {
  const [filter, setFilter] = useState('');
  const { colors: C } = useTheme();
  const s = useStyles();
  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const choices = (Object.entries(homeCountries) as [HomeCountry, string][])
    .filter(([_, name]) => normalize(name).includes(normalize(filter.trim())))
    .sort(([codeA, a], [codeB, b]) =>
      codeA === 'OTHER' ? 1 : codeB === 'OTHER' ? -1 : a.localeCompare(b, 'es'),
    );
  return (
    <View style={{ gap: 12 }}>
      <Heading style={{ fontSize: 27 }}>¿Desde dónde viajas?</Heading>
      <Label style={s.copy}>La primera historia empieza en tu comunidad.</Label>
      <TextInput
        accessibilityLabel="Buscar lugar de origen"
        placeholder="Buscar país o territorio"
        placeholderTextColor={C.muted}
        style={s.input}
        value={filter}
        onChangeText={setFilter}
      />
      <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
        {choices.map(([code, name]) => (
          <Pressable
            key={code}
            accessibilityRole="button"
            accessibilityState={{ selected: selected === code }}
            style={s.routeItem}
            onPress={() => onSelect(code)}
          >
            <Text style={[s.rowTitle, { flex: 1 }]}>{name}</Text>
            {selected === code && <Check color={C.teal} size={18} />}
          </Pressable>
        ))}
        {!choices.length && <Label style={s.copy}>No encontramos ese lugar.</Label>}
      </ScrollView>
    </View>
  );
}

export function Passport({
  travel,
  onNote,
  onContinue,
}: {
  travel: TravelState;
  onNote: (value: string) => Promise<void>;
  onContinue: () => void;
}) {
  const s = useStyles();
  const { colors: C } = useTheme();
  const [note, setNote] = useState(travel.note ?? '');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const stamp = travel.stamps.home;
  async function save() {
    setSaving(true);
    try {
      await onNote(note.trim());
      setStatus('Recuerdo guardado.');
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <View style={{ gap: 17 }}>
      <JournalSpread
        source={illustrations.passport}
        title="Pasaporte"
        detail={`${homeName(travel)} · ${stamp ? '1 sello' : '0 sellos'}`}
      />
      <Notebook title="Sellos del viaje">
        <View style={[s.passportSeal, { borderColor: C.accent, backgroundColor: C.mint }]}>
          <Stamp size={27} color={C.accent} />
        </View>
        <Label style={s.copy}>
          {stamp
            ? `${chapter.stamp} · ${new Date(stamp).toLocaleDateString('es-419')}`
            : 'Completa La primera postal para recibir tu primer sello.'}
        </Label>
        {!stamp && (
          <Button icon={ArrowRight} onPress={onContinue}>
            Continuar viaje
          </Button>
        )}
      </Notebook>
      {stamp && (
        <>
          <JournalLeaf style={s.routeDetail}>
            <Heading>{chapter.postcard}</Heading>
            <JournalArt source={hometown} taped />
            <Text style={s.rowTitle}>{chapter.collectible}</Text>
            <Label style={s.copy}>{chapter.message}</Label>
          </JournalLeaf>
          <Notebook title="Diario de viaje">
            <Label style={s.copy}>
              ¿Qué frase usarías para ayudar a un visitante en tu comunidad?
            </Label>
            <TextInput
              accessibilityLabel="Mi recuerdo"
              multiline
              maxLength={500}
              value={note}
              onChangeText={(text) => {
                setNote(text);
                setStatus('');
              }}
              placeholder="Escribe un recuerdo"
              placeholderTextColor={C.muted}
              style={[s.input, { minHeight: 90, textAlignVertical: 'top' }]}
            />
            <Button loading={saving} icon={Check} onPress={() => void save()}>
              Guardar recuerdo
            </Button>
            {!!status && (
              <Text accessibilityLiveRegion="polite" style={s.copy}>
                {status}
              </Text>
            )}
          </Notebook>
        </>
      )}
    </View>
  );
}

function useStyles() {
  const { colors: C } = useTheme();
  return StyleSheet.create({
    pageTitle: { fontFamily: 'LoraBold', color: C.ink, fontSize: 29, letterSpacing: -0.7 },
    meta: { fontFamily: 'ManropeBold', color: C.teal, fontSize: 12, letterSpacing: 1.2 },
    copy: { fontFamily: 'Manrope', color: C.ink, fontSize: 15, lineHeight: 23 },
    muted: { fontFamily: 'Manrope', color: C.muted, fontSize: 13 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    home: { gap: 20 },
    homeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    homeLocation: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    homeKicker: { color: C.accent, fontFamily: 'ManropeBold', fontSize: 11, flexShrink: 1 },
    passportButton: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      minHeight: 52,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.line,
      backgroundColor: C.white,
    },
    passportLabel: { fontFamily: 'ManropeBold', fontSize: 10, color: C.accent },
    homeColumns: { gap: 23 },
    homeColumnsWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 23 },
    homeRail: { gap: 23, minWidth: 0 },
    missionPostcard: { minWidth: 0 },
    postcardView: {
      height: 164,
      borderWidth: 6,
      borderColor: C.white,
      borderRadius: 15,
      backgroundColor: C.mint,
      overflow: 'hidden',
    },
    postcardImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    postcardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 11,
      gap: 6,
    },
    postcardPlace: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flexShrink: 1,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 5,
      backgroundColor: '#FFF0D7',
    },
    postcardPlaceText: { fontFamily: 'ManropeBold', color: '#304835', fontSize: 12, flexShrink: 1 },
    postcardStamp: {
      width: 47,
      height: 47,
      borderRadius: 24,
      backgroundColor: '#FFF0D7',
      borderWidth: 3,
      borderColor: '#D1AC81',
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ rotate: '10deg' }],
    },
    postcardTicket: {
      backgroundColor: C.white,
      borderColor: C.line,
      borderWidth: 1,
      borderRadius: 16,
      marginHorizontal: 7,
      marginTop: -20,
      padding: 14,
      gap: 6,
      overflow: 'hidden',
    },
    postcardChapter: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    chapterLine: { backgroundColor: C.accent, width: 15, height: 2, borderRadius: 1 },
    postcardLabel: {
      color: C.accent,
      fontFamily: 'ManropeBold',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 1.1,
      flexShrink: 1,
    },
    missionTitle: { color: C.ink, fontFamily: 'LoraBold', fontSize: 26, letterSpacing: -0.45 },
    missionBrief: { color: C.muted, fontFamily: 'Manrope', fontSize: 13 },
    postcardAction: { flexDirection: 'row', gap: 9, alignItems: 'center', marginTop: 5 },
    missionTime: {
      color: C.teal,
      fontFamily: 'ManropeBold',
      fontSize: 12,
      maxWidth: '31%',
      padding: 7,
      backgroundColor: C.mint,
      borderRadius: 7,
    },
    missionAction: { flex: 1, minHeight: 48, paddingHorizontal: 10 },
    homeRoute: {
      backgroundColor: C.white,
      borderColor: C.line,
      borderWidth: 1,
      borderRadius: 16,
      padding: 13,
      gap: 11,
    },
    routeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    homeSubheading: { color: C.ink, fontFamily: 'LoraBold', fontSize: 21, letterSpacing: -0.3 },
    routeTally: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      padding: 7,
      backgroundColor: C.paper,
      borderRadius: 7,
    },
    tallyText: { fontFamily: 'ManropeBold', color: C.accent, fontSize: 12 },
    routeStops: { flexDirection: 'row', position: 'relative' },
    routeTrack: {
      position: 'absolute',
      top: 22,
      left: '16.67%',
      right: '16.67%',
      height: 2,
      backgroundColor: C.line,
    },
    routeStop: { flex: 1, alignItems: 'center', minWidth: 0, paddingHorizontal: 2, gap: 4 },
    stopBadge: {
      width: 44,
      height: 44,
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 22,
      backgroundColor: C.paper,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stopCurrent: { backgroundColor: C.primary, borderColor: C.primary },
    stopDone: { backgroundColor: C.mint },
    stopTitle: { color: C.ink, fontFamily: 'ManropeBold', fontSize: 12, textAlign: 'center' },
    stopStatus: { color: C.muted, fontFamily: 'Manrope', fontSize: 11, textAlign: 'center' },
    openMap: { minHeight: 44, paddingVertical: 6, paddingHorizontal: 8 },
    practice: { gap: 10 },
    practiceList: {
      backgroundColor: C.white,
      borderColor: C.line,
      borderWidth: 1,
      borderRadius: 14,
      overflow: 'hidden',
    },
    practiceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 52,
      gap: 11,
      paddingHorizontal: 13,
      paddingVertical: 9,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.line,
    },
    rowTitle: { fontFamily: 'ManropeBold', color: C.ink, fontSize: 15, lineHeight: 21 },
    missionPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 4,
      minHeight: 48,
    },
    tileIcon: {
      width: 41,
      height: 41,
      borderRadius: 12,
      backgroundColor: C.mint,
      justifyContent: 'center',
      alignItems: 'center',
    },
    routeIndex: {
      width: 36,
      minHeight: 34,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    passportSeal: {
      width: 58,
      height: 58,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderRadius: 29,
      transform: [{ rotate: '-9deg' }],
    },
    routeDetail: { padding: 18, gap: 13, borderRadius: 19, minWidth: 0 },
    routeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 9,
      minHeight: 49,
      borderBottomWidth: 1,
      borderColor: C.line,
    },
    world: {
      width: '100%',
      aspectRatio: 2,
      overflow: 'hidden',
      borderRadius: 16,
      backgroundColor: '#d9dbbd',
    },
    destinationPin: {
      position: 'absolute',
      width: 12,
      height: 12,
      marginLeft: -6,
      marginTop: -6,
      backgroundColor: '#9b3e23',
      borderColor: '#f4fffb',
      borderWidth: 2,
      borderRadius: 6,
    },
    mapTarget: {
      position: 'absolute',
      marginLeft: -22,
      marginTop: -22,
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapMarker: {
      minWidth: 25,
      minHeight: 25,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
      backgroundColor: '#2a594c',
      borderColor: '#f4fffb',
      borderWidth: 2,
      borderRadius: 20,
    },
    mapSelected: { backgroundColor: '#9b3e23' },
    markerText: { color: '#fff', fontFamily: 'ManropeBold', fontSize: 12 },
    status: { fontFamily: 'ManropeBold', color: C.teal, fontSize: 14, paddingVertical: 7 },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 10,
      padding: 11,
      color: C.ink,
      backgroundColor: C.paper,
      fontFamily: 'Manrope',
      fontSize: 16,
    },
  });
}
