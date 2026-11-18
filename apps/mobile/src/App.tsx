import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, House, MapPinned, Settings2, Trophy, UserRound, X } from 'lucide-react-native';
import {
  OFFLINE_STATE_KEY,
  chapter,
  nextTravelMission,
  route,
  type TravelCheckpoint,
  type TravelOperation,
  type TravelState,
} from '@lingoquest/offline-engine';
import { ThemeButton } from './ThemePicker';
import { useTheme } from './theme';
import { api, bootstrap, localSettings, type Progress } from './lib/api';
import { Button, Card, Heading, Label } from './ui';
import { ReviewsFlow } from './features/ReviewsFlow';
import { ChallengesScreen } from './challenges/ChallengesScreen';
import { OfflineProfile as Profile } from './content-manager/OfflineProfile';
import { getRaw } from './lib/storage';
import { saveTextFile } from './lib/localFiles';
import { CountryPicker, Passport, TravelHome, TravelRoute } from './travel/TravelHome';
import { TravelFlow } from './travel/TravelFlow';
import { QuickReview } from './travel/QuickReview';
import { TravelWelcome } from './travel/TravelWelcome';
import { TravelPlacementFlow } from './travel/TravelPlacementFlow';
import { TravelGuide, TravelPronunciation } from './travel/TravelGuide';
import { JournalBrand, PaperGrain } from './Journal';
import { SpeechSettings } from './features/SpeechSettings';
import { MotionProvider, useReducedMotion } from './motion';

const tabs = [
  { id: 'Inicio', icon: House },
  { id: 'Mapa', icon: MapPinned },
  { id: 'Aprender', icon: BookOpen },
  { id: 'Desafíos', icon: Trophy },
  { id: 'Perfil', icon: UserRound },
] as const;
type Tab = (typeof tabs)[number]['id'];
type Flow = 'placement' | 'speech' | 'reviews' | 'quick';

export default function App() {
  const [reducedMotion, setReducedMotion] = useState(true);
  return (
    <MotionProvider reducedMotion={reducedMotion}>
      <AppContent onMotionPreference={setReducedMotion} />
    </MotionProvider>
  );
}

function AppContent({ onMotionPreference }: { onMotionPreference: (value: boolean) => void }) {
  const { colors: C } = useTheme();
  const reducedMotion = useReducedMotion();
  const s = useStyles();
  const { width, fontScale } = useWindowDimensions();
  const desktop = width >= 1080 && fontScale < 1.4;
  const scroll = useRef<ScrollView>(null);
  const [tab, setTab] = useState<Tab>('Inicio');
  const [travel, setTravel] = useState<TravelState>({ completed: {}, stamps: {} });
  const [mission, setMission] = useState<TravelCheckpoint | null>(null);
  const [destination, setDestination] = useState('home');
  const [countryPicker, setCountryPicker] = useState(false);
  const [passport, setPassport] = useState(false);
  const [starting, setStarting] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [flow, setFlow] = useState<Flow | null>(null);
  const [settings, setSettings] = useState<'general' | 'voice' | null>(null);
  const [recoveryReset, setRecoveryReset] = useState(false);
  const [welcome, setWelcome] = useState(false);

  const refresh = useCallback(async () => {
    const [p, journey, review] = await Promise.all([
      api<Progress>('/v1/me/progress'),
      api<TravelState>('/v1/travel'),
      api<{ total: number }>('/v1/reviews/today?source=travel'),
    ]);
    setProgress({ ...p, reviewCount: review.total });
    setTravel(journey);
    onMotionPreference(!!p.user.reducedMotion);
    setError('');
  }, [onMotionPreference]);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await bootstrap();
        await refresh();
        if (active) setWelcome(!(await localSettings.get('onboarded', false)));
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);
  useEffect(() => {
    if (
      Platform.OS === 'web' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    )
      void navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [tab, passport]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function updateTravel(action: TravelOperation) {
    const value = await api<TravelState>('/v1/travel', action);
    setTravel(value);
    return value;
  }
  async function openMission(id?: string, journey = travel) {
    const target = id ?? nextTravelMission(journey)?.id;
    if (!target) {
      setPassport(true);
      return;
    }
    const value = await updateTravel({ action: 'start', missionId: target });
    if (value.active?.missionId !== target)
      throw new Error('Completa la misión anterior para continuar.');
    setPassport(false);
    setFlow(null);
    setMission(value.active);
  }
  function startMission(id?: string) {
    if (starting) return;
    setStarting(true);
    void openMission(id)
      .catch((e) => setNotice(e.message))
      .finally(() => setStarting(false));
  }
  async function chooseWelcome(choice: 'start' | 'placement' | 'explore') {
    if (starting) return;
    setStarting(true);
    try {
      await localSettings.set('onboarded', true);
      if (choice === 'start') await openMission();
      if (choice === 'placement') setFlow('placement');
      setWelcome(false);
    } catch (e) {
      setNotice((e as Error).message);
      setWelcome(false);
    } finally {
      setStarting(false);
    }
  }
  const finishFlow = () => {
    setFlow(null);
    void refresh().catch((e) => setNotice(e.message));
  };
  const closeMission = () => {
    setMission(null);
    void refresh().catch((e) => setNotice(e.message));
  };
  const openVoiceSettings = () => setSettings('voice');
  const closeSettings = () => setSettings(null);
  const settingsSheet = (
    <Sheet visible={settings !== null} close={closeSettings} reduced={reducedMotion}>
      <View style={s.sheetTitle}>
        <Heading style={{ flex: 1 }}>
          {settings === 'voice' ? 'Configuración de voz' : 'Configuración'}
        </Heading>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar configuración"
          style={s.iconButton}
          onPress={closeSettings}
        >
          <X size={22} color={C.ink} />
        </Pressable>
      </View>
      <SpeechSettings />
      {settings === 'general' && (
        <>
          <Heading style={{ fontSize: 22 }}>Privacidad</Heading>
          <Label>
            La grabación local se elimina al salir. Si eliges reconocimiento en la práctica de
            pronunciación, el servicio del sistema o del navegador puede procesar el audio en línea.
            El reconocimiento no se guarda ni se usa para dar una nota de pronunciación.
          </Label>
          <Button
            variant="secondary"
            onPress={() => {
              closeSettings();
              go('Perfil');
            }}
          >
            Ver mi perfil y mis datos
          </Button>
        </>
      )}
    </Sheet>
  );
  const withSettings = (content: React.ReactNode) => (
    <>
      {content}
      {settingsSheet}
    </>
  );
  if (mission)
    return withSettings(
      <TravelFlow
        key={mission.missionId}
        initial={mission}
        onUpdate={setTravel}
        onClose={closeMission}
        onVoiceSettings={openVoiceSettings}
        onPassport={() => {
          closeMission();
          setPassport(true);
        }}
      />,
    );
  if (flow === 'placement')
    return withSettings(
      <TravelPlacementFlow
        onClose={finishFlow}
        onStart={openMission}
        onVoiceSettings={openVoiceSettings}
      />,
    );
  if (flow === 'speech')
    return withSettings(
      <TravelPronunciation onClose={finishFlow} onVoiceSettings={openVoiceSettings} />,
    );
  if (flow === 'reviews') return <ReviewsFlow onClose={finishFlow} />;
  if (flow === 'quick') return <QuickReview onClose={finishFlow} />;
  if (welcome && !loading && !error)
    return (
      <TravelWelcome
        busy={starting}
        onStart={() => void chooseWelcome('start')}
        onAssessment={() => void chooseWelcome('placement')}
        onClose={() => void chooseWelcome('explore')}
      />
    );

  function go(next: Tab) {
    setTab(next);
    setPassport(false);
  }
  const nav = (
    <View style={desktop ? s.desktopNav : s.mobileNav}>
      {tabs.map(({ id, icon: Icon }) => (
        <Pressable
          key={id}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === id }}
          accessibilityLabel={id}
          onPress={() => go(id)}
          style={({ pressed }) => [
            desktop ? s.desktopTab : s.mobileTab,
            tab === id && s.tabActive,
            pressed && { opacity: 0.65 },
          ]}
        >
          <Icon size={desktop ? 19 : 18} color={tab === id ? C.accent : C.teal} />
          <Text
            style={[
              s.navText,
              !desktop && { fontSize: width < 350 ? 9 : 10 },
              tab === id && { color: C.accent },
            ]}
          >
            {id}
          </Text>
        </Pressable>
      ))}
    </View>
  );
  return (
    <SafeAreaView style={s.safe}>
      <PaperGrain />
      <View style={s.layout}>
        {desktop && (
          <View style={s.sidebar}>
            <View style={s.sidebarBrand}>
              <JournalBrand />
            </View>
            {nav}
            <View style={{ flex: 1 }} />
            <Button variant="ghost" icon={Settings2} onPress={() => setSettings('general')}>
              Configuración
            </Button>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={s.topbar}>
            {desktop ? (
              <Text style={[s.sectionLabel, { color: C.accent }]}>{tab}</Text>
            ) : (
              <View style={s.mobileBrand}>
                <JournalBrand small />
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <ThemeButton />
              {!desktop && (
                <Pressable
                  style={s.iconButton}
                  accessibilityRole="button"
                  accessibilityLabel="Configuración"
                  onPress={() => setSettings('general')}
                >
                  <Settings2 color={C.teal} size={19} />
                </Pressable>
              )}
            </View>
          </View>
          <ScrollView
            ref={scroll}
            contentContainerStyle={[s.content, { padding: desktop ? 31 : 15 }]}
          >
            {loading ? (
              <View style={s.loading}>
                <ActivityIndicator color={C.accent} />
                <Label>Preparando el viaje…</Label>
              </View>
            ) : error ? (
              <Card style={{ gap: 12 }}>
                <Heading>No pudimos abrir tus datos</Heading>
                <Label>{error}</Label>
                <Button
                  variant="secondary"
                  onPress={() => {
                    void getRaw(OFFLINE_STATE_KEY)
                      .then(async (original) => {
                        if (!original) throw new Error('No hay datos guardados para conservar.');
                        await saveTextFile('lingoquest-datos-anteriores.json', original);
                        setNotice('Copia guardada.');
                      })
                      .catch((e) => setNotice(e.message));
                  }}
                >
                  Guardar copia de los datos anteriores
                </Button>
                <Button onPress={() => void refresh().catch((e) => setError(e.message))}>
                  Intentar de nuevo
                </Button>
                <Button variant="ghost" onPress={() => setRecoveryReset(true)}>
                  Restablecer datos locales
                </Button>
              </Card>
            ) : passport ? (
              <View style={{ gap: 12 }}>
                <Button
                  variant="ghost"
                  style={{ alignSelf: 'flex-start' }}
                  onPress={() => setPassport(false)}
                >
                  Volver al viaje
                </Button>
                <Passport
                  travel={travel}
                  onContinue={() => startMission()}
                  onNote={async (text) => {
                    await updateTravel({ action: 'note', text });
                  }}
                />
              </View>
            ) : tab === 'Inicio' && progress ? (
              <TravelHome
                travel={travel}
                progress={progress}
                onContinue={() => startMission()}
                onReview={() => setFlow('quick')}
                onRoute={() => go('Mapa')}
                onGuide={() => go('Aprender')}
                onPassport={() => setPassport(true)}
                onSpeech={() => setFlow('speech')}
                onFullReview={() => setFlow('reviews')}
              />
            ) : tab === 'Mapa' ? (
              <TravelRoute
                travel={travel}
                selected={route.find((item) => item.id === destination) ?? route[0]}
                onSelect={(id) => {
                  setDestination(id);
                  scroll.current?.scrollTo({ y: 0, animated: false });
                }}
                onStart={startMission}
                onCountry={() => setCountryPicker(true)}
                onPassport={() => setPassport(true)}
              />
            ) : tab === 'Aprender' ? (
              <TravelGuide
                travel={travel}
                onMission={startMission}
                onAssessment={() => setFlow('placement')}
                onVoiceSettings={openVoiceSettings}
                onSpeech={() => setFlow('speech')}
              />
            ) : tab === 'Desafíos' ? (
              <ChallengesScreen
                onLearn={() => go('Aprender')}
                onRefresh={() => {
                  void refresh();
                }}
              />
            ) : progress ? (
              <Profile
                key={progress.user.id}
                progress={progress}
                missionsCompleted={
                  chapter.missions.filter((item) => travel.completed[item.id]).length
                }
                onRefresh={refresh}
                onNotice={setNotice}
                onPlacement={() => setFlow('placement')}
              />
            ) : null}
          </ScrollView>
          {!!notice && (
            <Text accessibilityLiveRegion="polite" style={s.notice}>
              {notice}
            </Text>
          )}
          {!desktop && nav}
        </View>
      </View>
      <Sheet visible={countryPicker} close={() => setCountryPicker(false)} reduced={reducedMotion}>
        <CountryPicker
          selected={travel.country}
          onSelect={(country) => {
            if (starting) return;
            setStarting(true);
            void updateTravel({ action: 'country', country })
              .then(() => setCountryPicker(false))
              .catch((e) => setNotice(e.message))
              .finally(() => setStarting(false));
          }}
        />
        <Button variant="ghost" onPress={() => setCountryPicker(false)}>
          Cerrar
        </Button>
      </Sheet>
      <Sheet visible={recoveryReset} close={() => setRecoveryReset(false)} reduced={reducedMotion}>
        <Heading>¿Restablecer los datos locales?</Heading>
        <Label>
          Se borrará el progreso de este dispositivo. Puedes guardar una copia desde la pantalla
          anterior.
        </Label>
        <Button
          variant="danger"
          loading={loading}
          onPress={() => {
            setLoading(true);
            void api('/v1/me', undefined, 'DELETE')
              .then(refresh)
              .then(() => {
                setRecoveryReset(false);
                setWelcome(true);
              })
              .catch((e) => setError(e.message))
              .finally(() => setLoading(false));
          }}
        >
          Borrar progreso de este dispositivo
        </Button>
        <Button variant="ghost" onPress={() => setRecoveryReset(false)}>
          Conservar mis datos
        </Button>
      </Sheet>
      {settingsSheet}
    </SafeAreaView>
  );
}

function Sheet({
  visible,
  close,
  reduced,
  children,
}: {
  visible: boolean;
  close: () => void;
  reduced: boolean;
  children: React.ReactNode;
}) {
  const s = useStyles();
  if (!visible) return null;
  return (
    <Modal visible transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={close}>
      <SafeAreaView style={s.shade}>
        <ScrollView
          style={s.sheet}
          contentContainerStyle={{ padding: 20, gap: 14 }}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function useStyles() {
  const { colors: C } = useTheme();
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.paper },
    layout: { flex: 1, flexDirection: 'row' },
    sidebar: {
      width: 218,
      paddingHorizontal: 16,
      paddingBottom: 18,
      backgroundColor: C.white,
      borderRightWidth: 1,
      borderRightColor: C.line,
    },
    sidebarBrand: {
      gap: 9,
      padding: 13,
      marginHorizontal: -16,
      alignItems: 'center',
      flexDirection: 'row',
    },
    mobileBrand: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
    desktopNav: { gap: 7, paddingTop: 25 },
    desktopTab: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 49,
      gap: 12,
      paddingHorizontal: 12,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    mobileNav: {
      flexDirection: 'row',
      padding: 4,
      gap: 3,
      backgroundColor: C.white,
      borderTopWidth: 1,
      borderTopColor: C.line,
    },
    mobileTab: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      minHeight: 51,
      paddingVertical: 5,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    tabActive: { backgroundColor: C.mint, borderColor: C.line },
    navText: { fontFamily: 'ManropeBold', color: C.ink, fontSize: 14, textAlign: 'center' },
    sectionLabel: {
      fontFamily: 'ManropeBold',
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    topbar: {
      minHeight: 61,
      backgroundColor: C.white,
      borderBottomWidth: 1,
      borderBottomColor: C.line,
      paddingHorizontal: 14,
      paddingVertical: 6,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    content: { flexGrow: 1, width: '100%', maxWidth: 1350, alignSelf: 'center' },
    loading: { gap: 14, minHeight: 170, alignItems: 'center', justifyContent: 'center' },
    notice: { padding: 10, color: C.ink, backgroundColor: C.mint, fontFamily: 'Manrope' },
    shade: {
      flex: 1,
      backgroundColor: '#17291EB8',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 18,
    },
    sheet: {
      flexGrow: 0,
      maxHeight: '93%',
      maxWidth: 510,
      width: '100%',
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 12,
      backgroundColor: C.white,
    },
    sheetTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  });
}
