import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
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
import { QuestBuddy } from '../QuestBuddy';
import { Button, Card, Heading, Label, ProgressBar } from '../ui';
import { useTheme } from '../theme';
import { TravelMark } from './TravelAppearance';

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
  onContinue,
  onReview,
  onRoute,
  onGuide,
  onPassport,
  onSpeech,
  onFullReview,
}: {
  travel: TravelState;
  progress: Progress;
  onContinue: () => void;
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
  const itinerary = (
    <View style={[s.itinerary, wide && { flex: 1 }]}>
      <View style={s.row}>
        <Flag size={20} color={C.accent} />
        <Heading style={{ flex: 1, fontSize: 24 }}>En esta parada</Heading>
      </View>
      {chapter.missions.map((mission, i) => {
        const Icon = missionIcons[i];
        const completed = !!travel.completed[mission.id];
        return (
          <View key={mission.id} style={s.missionPreview}>
            <View style={s.tileIcon}>
              <Icon size={18} color={C.teal} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={s.rowTitle}>{mission.title}</Text>
              <Text style={s.muted}>
                {completed
                  ? 'Completada'
                  : travel.cleared?.some((id) => id === mission.id)
                    ? 'Validada en la prueba'
                    : mission.place}
              </Text>
            </View>
            {completed ? (
              <Check size={18} color={C.teal} />
            ) : mission.id === next?.id ? (
              <ChevronRight size={18} color={C.accent} />
            ) : null}
          </View>
        );
      })}
      <ProgressBar
        value={count / chapter.missions.length}
        accessibilityLabel="Misiones del capítulo completadas"
        color={C.accent}
      />
      <Button variant="secondary" icon={MapPinned} onPress={onRoute}>
        Ver mapa y misiones
      </Button>
    </View>
  );
  return (
    <View style={{ gap: 19 }}>
      <View
        style={[
          s.row,
          { justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' },
        ]}
      >
        <Text accessibilityRole="header" style={[s.pageTitle, { fontSize: wide ? 42 : 29 }]}>
          Cuaderno de viaje
        </Text>
        <View style={s.row}>
          <MapPin size={16} color={C.accent} />
          <Text style={s.meta}>{homeName(travel)}</Text>
        </View>
      </View>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16 }}>
        <View style={[s.hero, wide && { flex: 1.8 }]}>
          <ImageBackground
            source={hometown}
            resizeMode="cover"
            style={{ height: wide ? 275 : 178, justifyContent: 'flex-end', padding: 12 }}
          >
            <View style={s.imageTag}>
              <MapPin size={15} color="#502A1C" />
              <Text style={s.imageTagText}>{next?.place ?? homeName(travel)}</Text>
            </View>
          </ImageBackground>
          <View style={s.heroRibbon}>
            <TravelMark size={38} />
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={s.ribbonMeta}>CAPÍTULO 1</Text>
              <Text accessibilityRole="header" style={s.ribbonTitle}>
                {chapter.title}
              </Text>
            </View>
          </View>
          <View style={s.heroInside}>
            <Label style={s.copy}>
              {next
                ? `${next.title} · ${next.minutes} min`
                : 'Tu primer sello ya está en el pasaporte.'}
            </Label>
            <Button icon={ArrowRight} onPress={onContinue}>
              {next ? 'Continuar viaje' : 'Ver mi pasaporte'}
            </Button>
          </View>
        </View>
        {wide && itinerary}
      </View>
      <View style={{ gap: 10, flexDirection: wide ? 'row' : 'column' }}>
        <HomeTile
          icon={RotateCcw}
          title="Repaso rápido"
          detail={
            progress.reviewCount
              ? `${progress.reviewCount} por repasar · 1 min`
              : 'Una frase · 1 min'
          }
          action="Repaso rápido"
          onPress={onReview}
        />
        <HomeTile
          icon={BookOpen}
          title="Palabras del viaje"
          detail="Significados, ejemplos y audio"
          action="Palabras del viaje"
          onPress={onGuide}
        />
        <HomeTile
          icon={Stamp}
          title="Pasaporte"
          detail={travel.stamps.home ? '1 sello en tu pasaporte' : 'Sellos, postales y diario'}
          action="Abrir pasaporte"
          onPress={onPassport}
        />
      </View>
      {!wide && itinerary}
      <View style={s.tip}>
        <QuestBuddy size={51} />
        <Label style={{ flex: 1 }}>
          Guardamos tu lugar. Puedes retomar el viaje cuando quieras.
        </Label>
      </View>
      <View style={[s.row, { flexWrap: 'wrap' }]}>
        <Button variant="ghost" icon={RotateCcw} onPress={onFullReview}>
          Repasar un poquito
        </Button>
        <Button variant="ghost" icon={Headphones} onPress={onSpeech}>
          Practicar pronunciación
        </Button>
      </View>
    </View>
  );
}

function HomeTile({
  icon: Icon,
  title,
  detail,
  action,
  onPress,
}: {
  icon: typeof Compass;
  title: string;
  detail: string;
  action: string;
  onPress: () => void;
}) {
  const { colors: C } = useTheme();
  const s = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action}
      accessibilityHint={detail}
      onPress={onPress}
      style={({ pressed }) => [s.tile, pressed && { borderColor: C.teal }]}
    >
      <View style={s.tileIcon}>
        <Icon color={C.teal} size={21} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={s.rowTitle}>{title}</Text>
        <Label style={s.muted}>{detail}</Label>
      </View>
      <ChevronRight color={C.teal} size={19} />
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
    <View style={{ gap: 18 }}>
      <View style={{ gap: 9 }}>
        <Text accessibilityRole="header" style={s.pageTitle}>
          Mapa del viaje
        </Text>
        <Label style={s.copy}>
          20 paradas, 7 continentes. Explora el mapa o elige un destino en la lista.
        </Label>
        <View style={[s.row, { flexWrap: 'wrap' }]}>
          <Button variant="secondary" icon={Flag} onPress={onCountry}>
            Elegir lugar de origen
          </Button>
          <Button variant="secondary" icon={Stamp} onPress={onPassport}>
            Pasaporte
          </Button>
        </View>
      </View>
      <View style={s.world}>
        <Image
          accessible={false}
          source={world}
          resizeMode="stretch"
          style={StyleSheet.absoluteFill}
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
      <View
        style={{ flexDirection: horizon ? 'column' : 'row', alignItems: 'flex-start', gap: 16 }}
      >
        <Card
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
        </Card>
        <Card
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
              <Text style={s.meta}>{displayNumber(i + 1)}</Text>
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
        </Card>
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
      <View style={{ gap: 5 }}>
        <Text accessibilityRole="header" style={s.pageTitle}>
          Pasaporte
        </Text>
        <Label style={s.copy}>
          {homeName(travel)} · {stamp ? '1 sello' : '0 sellos'}
        </Label>
      </View>
      <Card style={s.routeDetail}>
        <View style={s.row}>
          <View style={s.tileIcon}>
            <Stamp color={C.teal} size={23} />
          </View>
          <Heading style={{ flex: 1 }}>Sellos del viaje</Heading>
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
      </Card>
      {stamp && (
        <>
          <Card style={s.routeDetail}>
            <Heading>{chapter.postcard}</Heading>
            <Image
              source={hometown}
              resizeMode="cover"
              style={{ width: '100%', height: 190, borderRadius: 13 }}
              accessible={false}
            />
            <Text style={s.rowTitle}>{chapter.collectible}</Text>
            <Label style={s.copy}>{chapter.message}</Label>
          </Card>
          <Card style={s.routeDetail}>
            <View style={s.row}>
              <NotebookPen color={C.teal} size={22} />
              <Heading>Diario de viaje</Heading>
            </View>
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
          </Card>
        </>
      )}
    </View>
  );
}

function useStyles() {
  const { colors: C } = useTheme();
  return StyleSheet.create({
    pageTitle: { fontFamily: 'Journal', color: C.ink, fontSize: 41, letterSpacing: -0.6 },
    meta: { fontFamily: 'ManropeBold', color: C.teal, fontSize: 12, letterSpacing: 1.2 },
    copy: { fontFamily: 'Manrope', color: C.ink, fontSize: 15, lineHeight: 23 },
    muted: { fontFamily: 'Manrope', color: C.muted, fontSize: 13, lineHeight: 18 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    hero: {
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 11,
      overflow: 'hidden',
    },
    heroRibbon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: '#293D31',
      padding: 14,
    },
    ribbonMeta: { color: '#E5BD78', fontFamily: 'ManropeBold', fontSize: 10, letterSpacing: 2 },
    ribbonTitle: { color: '#FFF3D8', fontFamily: 'Journal', fontSize: 25 },
    heroInside: { gap: 10, paddingVertical: 13, paddingHorizontal: 14 },
    imageTag: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: '#fff8e8',
      borderRadius: 7,
      paddingHorizontal: 10,
      paddingVertical: 7,
      maxWidth: '100%',
    },
    imageTagText: { fontFamily: 'ManropeBold', fontSize: 12, color: '#173f36', flexShrink: 1 },
    itinerary: {
      backgroundColor: C.white,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: C.line,
      padding: 22,
      gap: 12,
    },
    rowTitle: { fontFamily: 'ManropeBold', color: C.ink, fontSize: 15, lineHeight: 21 },
    missionPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 4,
      minHeight: 48,
    },
    tile: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      minHeight: 76,
      borderWidth: 1,
      borderColor: C.line,
      backgroundColor: C.white,
      borderRadius: 9,
    },
    tileIcon: {
      width: 41,
      height: 41,
      borderRadius: 12,
      backgroundColor: C.mint,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      backgroundColor: C.mint,
      borderRadius: 15,
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
