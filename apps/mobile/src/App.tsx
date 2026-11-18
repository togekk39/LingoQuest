import { ThemeButton } from './ThemePicker';
import { useTheme } from './theme';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import {
  Compass,
  House,
  BookOpen,
  Trophy,
  UserRound,
  ArrowRight,
  ChevronRight,
  Check,
  Flame,
  Zap,
  X,
  ShieldCheck,
  MapPin,
  MapPinned,
  Briefcase,
  RefreshCw,
  Settings2,
  ArrowUpRight,
  CheckCircle2,
  Leaf,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, bootstrap, localSettings, type Unit, type Progress } from './lib/api';
import { Button, Card, Label, Heading, Pill } from './ui';
import { JourneyArt } from './JourneyArt';
import { LessonReference } from './features/LessonReference';
import { ReviewsFlow } from './features/ReviewsFlow';
import { LearningFlow } from './features/LearningFlow';
import { PlacementFlow } from './features/PlacementFlow';
import { MissionsFlow } from './features/MissionsFlow';
import { PronunciationFlow } from './features/PronunciationFlow';
import { ChallengesScreen } from './challenges/ChallengesScreen';
import { OfflineProfile as Profile } from './content-manager/OfflineProfile';
import { getRaw } from './lib/storage';
import { saveTextFile } from './lib/localFiles';
import {
  OFFLINE_STATE_KEY,
  chapter,
  route,
  type TravelCheckpoint,
  type TravelOperation,
  type TravelState,
} from '@lingoquest/offline-engine';
import { CountryPicker, Passport, TravelHome, TravelRoute } from './travel/TravelHome';
import { TravelFlow } from './travel/TravelFlow';
import { QuickReview } from './travel/QuickReview';
import { SpeechSettings } from './features/SpeechSettings';
import { MotionEntrance, MotionPressable, MotionProvider, useReducedMotion } from './motion';

type Tab = 'Inicio' | 'Mapa' | 'Aprender' | 'Desafíos' | 'Perfil';
const tabs: { id: Tab; icon: typeof House }[] = [
  { id: 'Inicio', icon: House },
  { id: 'Mapa', icon: MapPinned },
  { id: 'Aprender', icon: BookOpen },
  { id: 'Desafíos', icon: Trophy },
  { id: 'Perfil', icon: UserRound },
];
const unitColors = [
  '#E7F2E8',
  '#F8EDDC',
  '#E8EEF8',
  '#F8E7E4',
  '#E8F1F4',
  '#EDE9F5',
  '#F3EFDB',
  '#E0EFE9',
];
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

  const { width } = useWindowDimensions();
  const desktop = width >= 1050;
  const scroll = useRef<ScrollView>(null);
  const [tab, setTab] = useState<Tab>('Inicio');
  const [travel, setTravel] = useState<TravelState>({ completed: {}, stamps: {} });
  const [travelFlow, setTravelFlow] = useState<TravelCheckpoint | null>(null);
  const [destination, setDestination] = useState('home');
  const [countryPicker, setCountryPicker] = useState(false);
  const [passport, setPassport] = useState(false);
  const [starting, setStarting] = useState(false);
  const [courseResume, setCourseResume] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [flow, setFlow] = useState<{
    type: 'lesson' | 'placement' | 'mission' | 'speech' | 'reviews' | 'quick' | 'reference';
    id?: string;
  } | null>(null);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [tab, passport]);
  const [settings, setSettings] = useState(false);
  const [recoveryReset, setRecoveryReset] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState(10);
  const [motivation, setMotivation] = useState('Vida diaria');
  const refresh = useCallback(async () => {
    const [catalog, p, journey, recentLesson] = await Promise.all([
      api<{ units: Unit[] }>('/v1/catalog'),
      api<Progress>('/v1/me/progress'),
      api<TravelState>('/v1/travel'),
      api<string | null>('/v1/lessons/resume'),
    ]);
    setUnits(catalog.units);
    setProgress(p);
    setTravel(journey);
    setCourseResume(recentLesson);
    onMotionPreference(!!p.user.reducedMotion);
    setError('');
  }, [onMotionPreference]);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await bootstrap();
        await refresh();
        if (!(await localSettings.get('onboarded', false))) setWelcome(true);
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
    ) {
      void navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  const complete = () => {
    setFlow(null);
    void refresh().catch((e) => setNotice(e.message));
  };
  const nextLesson =
    units.flatMap((u) => u.lessons).find((l) => !progress?.completedLessons.includes(l.id)) ??
    units[0]?.lessons[0];
  async function updateTravel(action: TravelOperation) {
    const value = await api<TravelState>('/v1/travel', action);
    setTravel(value);
    return value;
  }
  async function startTravel(missionId?: string) {
    if (starting) return;
    setStarting(true);
    try {
      const id =
        missionId ??
        travel.active?.missionId ??
        chapter.missions.find((m) => !travel.completed[m.id])?.id;
      if (!id) {
        setPassport(true);
        return;
      }
      setPassport(false);
      const value = await updateTravel({ action: 'start', missionId: id });
      if (value.active) setTravelFlow(value.active);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setStarting(false);
    }
  }
  function closeTravel() {
    setTravelFlow(null);
    void refresh().catch((e) => setNotice(e.message));
  }
  if (travelFlow)
    return (
      <TravelFlow
        initial={travelFlow}
        onUpdate={setTravel}
        onClose={closeTravel}
        onPassport={() => {
          closeTravel();
          setPassport(true);
        }}
      />
    );
  const begin = () => {
    const id = courseResume ?? nextLesson?.id;
    if (id) setFlow({ type: 'lesson', id });
  };
  if (flow?.type === 'lesson')
    return <LearningFlow lessonId={flow.id!} onClose={complete} onComplete={complete} />;
  if (flow?.type === 'reference')
    return <LessonReference id={flow.id!} onClose={() => setFlow(null)} />;
  if (flow?.type === 'reviews') return <ReviewsFlow onClose={complete} />;
  if (flow?.type === 'quick') return <QuickReview onClose={complete} />;
  if (flow?.type === 'placement')
    return <PlacementFlow onClose={() => setFlow(null)} onComplete={complete} />;
  if (flow?.type === 'mission')
    return <MissionsFlow missionId={flow.id as 'airport' | 'job'} onClose={() => setFlow(null)} />;
  if (flow?.type === 'speech') return <PronunciationFlow onClose={() => setFlow(null)} />;
  const go = (t: Tab) => {
    setTab(t);
    setPassport(false);
    setFlow(null);
  };
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.shell}>
        {desktop && (
          <View style={s.sidebar}>
            <Brand />

            <View style={{ gap: 8, marginTop: 42 }}>
              {tabs.map((t) => (
                <Pressable
                  key={t.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === t.id }}
                  onPress={() => go(t.id)}
                  style={[s.navItem, tab === t.id && s.navActive]}
                >
                  <t.icon size={20} color={tab === t.id ? C.teal : C.muted} />
                  <Text
                    style={[
                      s.navLabel,
                      tab === t.id && { color: C.teal, fontFamily: 'ManropeBold' },
                    ]}
                  >
                    {t.id}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={s.sidebarBottom}>
              <View style={s.sidebarTip}>
                <View style={s.leaf}>
                  <Leaf color={C.teal} size={22} />
                </View>
                <Text style={s.tipTitle}>A tu ritmo, siempre.</Text>
                <Label style={{ fontSize: 11, lineHeight: 18 }}>
                  Cada pequeño paso te lleva más lejos.
                </Label>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Configuración"
                onPress={() => setSettings(true)}
                style={s.sideSettings}
              >
                <Settings2 size={17} color={C.muted} />
                <Label style={{ fontSize: 12 }}>Configuración y privacidad</Label>
                <ArrowUpRight size={14} color={C.muted} />
              </Pressable>
              <Pressable onPress={() => go('Perfil')} style={s.sideProfile}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>
                    {(progress?.user.name || 'E').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.profileName}>{progress?.user.name || 'Explorador'}</Text>
                  <Text style={s.profileSub}>Perfil local</Text>
                </View>
                <ChevronRight size={16} color={C.muted} />
              </Pressable>
            </View>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={[
              s.topbar,
              !desktop && {
                paddingHorizontal: width < 360 ? 12 : 20,
                height: undefined,
                minHeight: 70,
                flexWrap: 'wrap',
                paddingVertical: 8,
              },
            ]}
          >
            {!desktop ? (
              <Brand small />
            ) : (
              <View style={s.row}>
                <Text style={s.breadcrumb}>Tu espacio</Text>
                <ChevronRight size={12} color="#A2B2A9" />
                <Text style={s.breadcrumbCurrent}>{tab}</Text>
              </View>
            )}
            <View style={[s.row, { gap: desktop ? 18 : 6 }]}>
              <ThemeButton />
              {!desktop && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Configuración"
                  onPress={() => setSettings(true)}
                  style={s.dismiss}
                >
                  <Settings2 size={20} color={C.teal} />
                </Pressable>
              )}
              {desktop && (
                <>
                  <View style={s.row}>
                    <Flame size={17} color="#DA9460" />
                    <Text style={s.topStat}>
                      {progress?.streak || 0}
                      {desktop && <Text style={s.topStatCaption}> días</Text>}
                    </Text>
                  </View>
                  <View style={s.topDivider} />
                  <View style={s.row}>
                    <Zap size={17} color={C.teal} />
                    <Text style={s.topStat}>
                      {progress?.xp || 0}
                      {desktop && <Text style={s.topStatCaption}> XP</Text>}
                    </Text>
                  </View>
                </>
              )}
              {desktop && (
                <View style={s.language}>
                  <Text style={{ fontSize: 14 }}>🇺🇸</Text>
                  <Text style={s.languageText}>Inglés</Text>
                </View>
              )}
            </View>
          </View>
          <ScrollView
            ref={scroll}
            contentContainerStyle={[s.content, { padding: desktop ? 36 : 20 }]}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={s.loading}>
                <ActivityIndicator size="large" color={C.teal} />
                <Label>Preparando tu aventura…</Label>
              </View>
            ) : error ? (
              <Card>
                <Heading>No pudimos abrir tus datos</Heading>
                <Label>{error}</Label>
                <Button
                  variant="secondary"
                  onPress={() => {
                    void getRaw(OFFLINE_STATE_KEY)
                      .then(async (raw) => {
                        if (!raw) throw new Error('No hay datos guardados para conservar.');
                        await saveTextFile('lingoquest-datos-anteriores.json', raw);
                        setNotice(
                          'Copia guardada. Los datos del prototipo anterior son solo para consulta.',
                        );
                      })
                      .catch((e) => setNotice(e.message));
                  }}
                >
                  Guardar copia de los datos anteriores
                </Button>
                <Button
                  onPress={() => {
                    setLoading(true);
                    void bootstrap()
                      .then(refresh)
                      .catch((e) => setError(e.message))
                      .finally(() => setLoading(false));
                  }}
                  icon={RefreshCw}
                >
                  Intentar de nuevo
                </Button>
                <Button variant="danger" onPress={() => setRecoveryReset(true)}>
                  Restablecer datos locales
                </Button>
              </Card>
            ) : (
              <>
                {passport ? (
                  <>
                    <Button variant="ghost" onPress={() => setPassport(false)}>
                      Volver al viaje
                    </Button>
                    <Passport
                      travel={travel}
                      onContinue={() => void startTravel()}
                      onNote={async (text) => {
                        await updateTravel({ action: 'note', text });
                      }}
                    />
                  </>
                ) : (
                  <>
                    {tab === 'Inicio' && (
                      <TravelHome
                        travel={travel}
                        progress={progress!}
                        lessonCount={units.reduce((count, unit) => count + unit.lessons.length, 0)}
                        onContinue={() => void startTravel()}
                        onReview={() => setFlow({ type: 'quick' })}
                        onRoute={() => go('Mapa')}
                        onLearn={begin}
                        onPassport={() => setPassport(true)}
                        onSpeech={() => setFlow({ type: 'speech' })}
                        onFullReview={() => setFlow({ type: 'reviews' })}
                      />
                    )}
                    {tab === 'Mapa' && (
                      <TravelRoute
                        travel={travel}
                        units={units}
                        selected={route.find((item) => item.id === destination) ?? route[0]}
                        onSelect={(id) => {
                          setDestination(id);
                          scroll.current?.scrollTo({ y: 0, animated: false });
                        }}
                        onStart={(id) => void startTravel(id)}
                        onCountry={() => setCountryPicker(true)}
                        onPassport={() => setPassport(true)}
                        onLesson={(id) => setFlow({ type: 'lesson', id })}
                      />
                    )}
                    {tab === 'Aprender' && (
                      <LearnMap
                        units={units}
                        progress={progress!}
                        onLesson={(id: string) => setFlow({ type: 'lesson', id })}
                        onPlacement={() => setFlow({ type: 'placement' })}
                        onReview={() => setFlow({ type: 'reviews' })}
                        onMission={(id: string) => setFlow({ type: 'mission', id })}
                        onReference={(id) => setFlow({ type: 'reference', id })}
                      />
                    )}
                    {tab === 'Desafíos' && (
                      <ChallengesScreen
                        onLearn={() => go('Aprender')}
                        onRefresh={() => void refresh()}
                      />
                    )}
                    {tab === 'Perfil' && (
                      <Profile
                        key={progress!.user.id}
                        progress={progress!}
                        onRefresh={refresh}
                        onNotice={setNotice}
                        onPlacement={() => setFlow({ type: 'placement' })}
                      />
                    )}
                  </>
                )}
                <View style={s.footer}>
                  <View style={s.row}>
                    <Compass size={13} color="#9DB2A4" />
                    <Text style={s.footerText}>LingoQuest</Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
          {!desktop && (
            <View style={s.bottomNav}>
              {tabs.map((t) => (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === t.id }}
                  key={t.id}
                  style={s.bottomTab}
                  onPress={() => go(t.id)}
                >
                  <View style={[s.bottomIcon, tab === t.id && { backgroundColor: C.mint }]}>
                    <t.icon size={21} color={tab === t.id ? C.teal : C.muted} />
                  </View>
                  <Text style={[s.bottomText, tab === t.id && { color: C.teal }]}>{t.id}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
      {notice !== '' && (
        <Pressable onPress={() => setNotice('')} style={s.toast}>
          <CheckCircle2 size={18} color="#A8DBC2" />
          <Text style={s.toastText}>{notice}</Text>
          <X size={15} color="white" />
        </Pressable>
      )}
      <Modal
        visible={countryPicker}
        transparent
        animationType={reducedMotion ? 'none' : 'fade'}
        onRequestClose={() => setCountryPicker(false)}
      >
        <View style={s.modalShade}>
          <Card style={s.welcomeCard}>
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
          </Card>
        </View>
      </Modal>
      <Modal
        visible={welcome}
        transparent
        animationType={reducedMotion ? 'none' : 'fade'}
        onRequestClose={() => setWelcome(false)}
      >
        <View style={s.modalShade}>
          <ScrollView style={{ flexGrow: 0, maxHeight: '100%', maxWidth: 480, width: '100%' }}>
            <Card style={s.welcomeCard}>
              <View style={s.sectionTitle}>
                <Brand small />
                <Pressable
                  onPress={() => {
                    setWelcome(false);
                    void localSettings.set('onboarded', true);
                  }}
                  accessibilityLabel="Explorar primero"
                  style={s.dismiss}
                >
                  <X size={20} color={C.muted} />
                </Pressable>
              </View>
              {welcomeStep === 0 ? (
                <>
                  <View style={{ alignItems: 'center', marginVertical: 8 }}>
                    <JourneyArt width={230} />
                  </View>
                  <Pill>EL MUNDO TE ESPERA</Pill>
                  <Heading style={{ fontSize: 32, marginTop: 15 }}>
                    Aprende inglés, descubre el mundo.
                  </Heading>
                  <Label style={{ marginTop: 10, marginBottom: 24 }}>
                    Empieza en tu comunidad y usa el inglés para ayudar a una viajera.
                  </Label>
                  <Button
                    icon={Compass}
                    onPress={() => {
                      void localSettings
                        .set('onboarded', true)
                        .then(() => {
                          setWelcome(false);
                          setTab('Mapa');
                          setCountryPicker(true);
                        })
                        .catch((e) => setNotice(e.message));
                    }}
                  >
                    Empezar mi viaje
                  </Button>
                  <Button
                    variant="secondary"
                    onPress={() => {
                      void localSettings
                        .set('onboarded', true)
                        .then(() => {
                          setWelcome(false);
                          const first = units[0]?.lessons[0];
                          if (first) setFlow({ type: 'lesson', id: first.id });
                        })
                        .catch((e) => setNotice(e.message));
                    }}
                    icon={ArrowRight}
                  >
                    Empiezo desde cero
                  </Button>
                  <Button
                    variant="secondary"
                    onPress={() => {
                      void localSettings
                        .set('onboarded', true)
                        .then(() => {
                          setWelcome(false);
                          setFlow({ type: 'placement' });
                        })
                        .catch((e) => setNotice(e.message));
                    }}
                  >
                    Ya sé algo de inglés
                  </Button>
                  <Button variant="ghost" onPress={() => setWelcomeStep(1)}>
                    Personalizar mi camino
                  </Button>
                  <Button
                    variant="ghost"
                    onPress={() => {
                      setWelcome(false);
                      void localSettings.set('onboarded', true);
                    }}
                  >
                    Explorar primero
                  </Button>
                </>
              ) : (
                <>
                  <Heading style={{ marginVertical: 20 }}>Hagámoslo tuyo.</Heading>
                  <Label>¿Cómo te llamas?</Label>
                  <TextInput
                    style={s.input}
                    placeholder="Tu nombre"
                    placeholderTextColor="#95A39C"
                    value={name}
                    onChangeText={setName}
                    maxLength={40}
                  />
                  <Label style={{ marginTop: 15 }}>¿Cuánto tiempo te gustaría dedicar?</Label>
                  <View style={[s.row, { marginVertical: 12 }]}>
                    {[5, 10, 15].map((n) => (
                      <Pressable
                        key={n}
                        style={[s.goalOption, goal === n && s.optionActive]}
                        onPress={() => setGoal(n)}
                      >
                        <Text style={s.optionText}>{n} min</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Label>Tu motivo para aprender</Label>
                  <View style={[s.row, { flexWrap: 'wrap', marginVertical: 12 }]}>
                    {['Vida diaria', 'Viajes', 'Trabajo'].map((m) => (
                      <Pressable
                        key={m}
                        onPress={() => setMotivation(m)}
                        style={[s.goalOption, motivation === m && s.optionActive]}
                      >
                        <Text style={s.optionText}>{m}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Button
                    onPress={() => {
                      void api('/v1/me/settings', {
                        name: name.trim() || 'Explorador',
                        goalMinutes: goal,
                        motivation:
                          motivation === 'Viajes'
                            ? 'travel'
                            : motivation === 'Trabajo'
                              ? 'work'
                              : 'life',
                      })
                        .then(() => refresh())
                        .then(() => {
                          setWelcome(false);
                          void localSettings.set('onboarded', true);
                        })
                        .catch((e) => setNotice(e.message));
                    }}
                    icon={ArrowRight}
                  >
                    Empezar mi aventura
                  </Button>
                  <Button
                    variant="ghost"
                    onPress={() => {
                      setWelcome(false);
                      void localSettings.set('onboarded', true);
                      setFlow({ type: 'placement' });
                    }}
                  >
                    Ya sé algo de inglés
                  </Button>
                </>
              )}
            </Card>
          </ScrollView>
        </View>
      </Modal>
      <Modal visible={recoveryReset} transparent onRequestClose={() => setRecoveryReset(false)}>
        <View style={s.modalShade}>
          <Card style={s.welcomeCard}>
            <Heading>¿Restablecer los datos locales?</Heading>
            <Label style={{ marginVertical: 20 }}>
              Se borrará el progreso de este dispositivo. Los cursos instalados se conservan. Si
              tienes un respaldo de esta versión podrás restaurarlo después. El nuevo curso
              integrado usa un formato de progreso diferente: las copias del prototipo anterior se
              pueden conservar para consulta, pero no restaurar en esta versión.
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
                    setWelcomeStep(0);
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
          </Card>
        </View>
      </Modal>
      <Modal
        visible={settings}
        transparent
        animationType={reducedMotion ? 'none' : 'fade'}
        onRequestClose={() => setSettings(false)}
      >
        <View style={s.modalShade}>
          <Card style={[s.welcomeCard, { maxHeight: '90%', padding: 20 }]}>
            <View style={s.sectionTitle}>
              <Heading>Configuración</Heading>
              <Pressable
                onPress={() => setSettings(false)}
                style={s.dismiss}
                accessibilityRole="button"
                accessibilityLabel="Cerrar configuración"
              >
                <X color={C.muted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ gap: 16, paddingTop: 16 }}>
              {settings && <SpeechSettings />}
              <Heading style={{ fontSize: 22 }}>Tu privacidad, primero</Heading>
              <Label>
                En el modo solo grabar, tu audio permanece en el dispositivo y se elimina al salir.
                Si eliges reconocimiento, el servicio de voz del sistema o del navegador puede
                procesar tu audio en línea. No guardamos el audio ni el texto del reconocimiento y
                no generamos una calificación de pronunciación.
                {'\n\n'}Puedes aprender sin micrófono. Las respuestas, los XP y el progreso se
                guardan y se revisan en este dispositivo, sin cuentas ni servicios en línea.{'\n\n'}
                Esta edición incluye contenido original de demostración pendiente de revisión
                editorial. Los desafíos no cuentan para un ranking.
              </Label>
              <Button
                onPress={() => {
                  setSettings(false);
                  go('Perfil');
                }}
              >
                Ver mi perfil y mis datos
              </Button>
            </ScrollView>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
function Brand({ small = false }: { small?: boolean }) {
  const { colors: C, tone } = useTheme();
  const s = useStyles();

  return (
    <View style={[s.row, { gap: 10 }]}>
      <View style={[s.logo, small && { width: 31, height: 31, borderRadius: 10 }]}>
        <Compass size={small ? 21 : 27} color="white" strokeWidth={1.7} />
      </View>
      <Text style={[s.brand, small && { fontSize: 20 }]}>
        lingo<Text style={{ color: C.teal }}>quest</Text>
        <Text style={{ color: tone('#DAA76D', 'text') }}>.</Text>
      </Text>
    </View>
  );
}
function LearnMap({
  units,
  progress,
  onLesson,
  onPlacement,
  onReview,
  onMission,
  onReference,
}: {
  units: Unit[];
  progress: Progress;
  onLesson: (id: string) => void;
  onPlacement: () => void;
  onReview: () => void;
  onMission: (id: string) => void;
  onReference: (id: string) => void;
}) {
  const { colors: C, tone } = useTheme();
  const s = useStyles();

  const [expanded, setExpanded] = useState('u01');

  return (
    <View style={{ gap: 24, maxWidth: 1020 }}>
      <View style={[s.sectionTitle, { flexWrap: 'wrap' }]}>
        <View style={{ flexShrink: 1 }}>
          <Text style={s.eyebrow}>PASO A PASO, PALABRA A PALABRA</Text>
          <Heading style={{ fontSize: 32, marginTop: 7 }}>Tu ruta de aprendizaje</Heading>
          <Label>{units.length} unidades de inglés para la vida diaria.</Label>
        </View>
        <Pill>A1 → A2</Pill>
      </View>
      <View style={[s.row, { flexWrap: 'wrap', gap: 12 }]}>
        <Button variant="secondary" icon={RefreshCw} onPress={onReview}>
          Repasar · {progress.reviewCount} pendientes
        </Button>
        <Button variant="ghost" icon={Compass} onPress={onPlacement}>
          Explorar mi nivel
        </Button>
      </View>
      {units.map((unit: Unit, i: number) => {
        const done = unit.lessons.filter((l) => progress.completedLessons.includes(l.id)).length;
        const open = expanded === unit.id;
        return (
          <Card key={unit.id} style={{ padding: 0, overflow: 'hidden' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              aria-expanded={open}
              onPress={() => setExpanded(open ? '' : unit.id)}
              style={[
                s.unitHeader,
                {
                  backgroundColor: open
                    ? tone(unitColors[i % unitColors.length], 'background')
                    : tone('white', 'background'),
                },
              ]}
            >
              <View
                style={[
                  s.unitNumber,
                  {
                    backgroundColor: open
                      ? C.white
                      : tone(unitColors[i % unitColors.length], 'background'),
                  },
                ]}
              >
                <Text style={{ fontFamily: 'OutfitSemiBold', fontSize: 23, color: C.teal }}>
                  {String(i + 1).padStart(2, '0')}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.eyebrow}>{unit.cefr}</Text>
                <Heading style={{ fontSize: 23, marginTop: 3 }}>{unit.title}</Heading>
                <Label style={{ fontSize: 11 }}>{unit.description}</Label>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <Text style={s.unitCount}>
                  {done}/{unit.lessons.length}
                </Text>
                <ChevronRight
                  size={18}
                  color={C.teal}
                  style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}
                />
              </View>
            </Pressable>
            {open && (
              <MotionEntrance style={{ padding: 20, gap: 10 }}>
                {unit.lessons.map((l, j) => {
                  const completed = progress.completedLessons.includes(l.id);
                  return (
                    <View key={l.id} style={[s.row, { alignItems: 'stretch', flexWrap: 'wrap' }]}>
                      <MotionPressable
                        accessibilityRole="button"
                        onPress={() => onLesson(l.id)}
                        style={[s.lessonRow, { flex: 1, minWidth: 150 }]}
                      >
                        <View style={[s.lessonCircle, completed && { backgroundColor: C.primary }]}>
                          {completed ? (
                            <Check size={18} color="white" />
                          ) : (
                            <Text
                              style={{ fontFamily: 'OutfitMedium', color: C.teal, fontSize: 16 }}
                            >
                              {j + 1}
                            </Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.lessonTitle}>{l.title}</Text>
                          <Label style={{ fontSize: 10 }}>
                            {completed
                              ? 'Un paso que ya diste · Puedes practicar otra vez'
                              : `${l.estimatedMinutes} min · Aprende y practica`}
                          </Label>
                        </View>
                        <ChevronRight size={17} color={C.muted} />
                      </MotionPressable>
                      <Button variant="ghost" icon={BookOpen} onPress={() => onReference(l.id)}>
                        Ver material
                      </Button>
                    </View>
                  );
                })}
                <View
                  style={[
                    s.row,
                    { justifyContent: 'space-between', paddingTop: 9, flexWrap: 'wrap' },
                  ]}
                >
                  <View style={s.row}>
                    <ShieldCheck size={14} color={C.muted} />
                    <Label style={{ fontSize: 10 }}>
                      Puedes equivocarte. Puedes volver a intentar.
                    </Label>
                  </View>
                  <Pill>DISPONIBLE SIN CONEXIÓN</Pill>
                </View>
              </MotionEntrance>
            )}
          </Card>
        );
      })}
      <Heading style={{ fontSize: 23, marginTop: 10 }}>El inglés sale contigo</Heading>
      <View style={[s.row, { flexWrap: 'wrap' }]}>
        <Button variant="secondary" icon={MapPin} onPress={() => onMission('airport')}>
          Preparar mi viaje
        </Button>
        <Button variant="secondary" icon={Briefcase} onPress={() => onMission('job')}>
          Practicar entrevista
        </Button>
      </View>
    </View>
  );
}
export function useStyles() {
  const { colors: C, tone } = useTheme();
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.paper },
    shell: { flex: 1, flexDirection: 'row' },
    sidebar: {
      width: 228,
      backgroundColor: tone('#FFFFFF', 'background'),
      paddingHorizontal: 20,
      paddingTop: 31,
      borderRightWidth: 1,
      borderRightColor: C.line,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logo: {
      width: 37,
      height: 37,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brand: { fontFamily: 'OutfitSemiBold', fontSize: 25, color: C.ink, letterSpacing: -1 },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 49,
      borderRadius: 11,
      paddingHorizontal: 15,
      gap: 13,
    },
    navActive: { backgroundColor: tone('#EAF3EC', 'background') },
    navLabel: { fontFamily: 'ManropeMedium', fontSize: 12, color: C.muted, flex: 1 },
    sidebarBottom: { flex: 1, justifyContent: 'flex-end', paddingBottom: 22 },
    sidebarTip: {
      backgroundColor: tone('#F6F8F1', 'background'),
      padding: 16,
      borderRadius: 14,
      marginBottom: 22,
    },
    leaf: {
      width: 35,
      height: 35,
      borderRadius: 11,
      backgroundColor: tone('#E6EEE0', 'background'),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 13,
    },
    tipTitle: { fontFamily: 'OutfitMedium', fontSize: 16, color: C.ink, marginBottom: 5 },
    sideSettings: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 15,
      paddingHorizontal: 5,
    },
    sideProfile: {
      borderTopWidth: 1,
      borderColor: C.line,
      paddingTop: 19,
      marginTop: 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: tone('#E9EEDF', 'background'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontFamily: 'OutfitMedium', fontSize: 17, color: tone('#69805F', 'text') },
    profileName: { fontFamily: 'ManropeBold', fontSize: 11, color: C.ink },
    profileSub: { fontFamily: 'Manrope', fontSize: 9, color: C.muted, marginTop: 3 },
    topbar: {
      height: 79,
      borderBottomWidth: 1,
      borderBottomColor: C.line,
      paddingHorizontal: 37,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: tone('#FFFFFF88', 'background'),
    },
    breadcrumb: { fontFamily: 'Manrope', fontSize: 10, color: tone('#99A99F', 'text') },
    breadcrumbCurrent: { fontFamily: 'ManropeSemiBold', fontSize: 10, color: C.ink },
    topStat: { fontFamily: 'ManropeBold', fontSize: 12, color: C.ink },
    topStatCaption: { fontFamily: 'Manrope', fontSize: 10, color: C.muted },
    topDivider: { height: 17, width: 1, backgroundColor: C.line },
    language: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginLeft: 7,
      paddingLeft: 20,
      borderLeftWidth: 1,
      borderLeftColor: C.line,
    },
    languageText: { fontFamily: 'ManropeSemiBold', fontSize: 10, color: C.muted },
    content: { flexGrow: 1, width: '100%', maxWidth: 1500, alignSelf: 'center' },
    eyebrow: {
      fontFamily: 'ManropeBold',
      fontSize: 9,
      letterSpacing: 1.1,
      color: tone('#789583', 'text'),
    },
    sectionTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    footer: {
      marginTop: 31,
      borderTopWidth: 1,
      borderTopColor: C.line,
      paddingTop: 22,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    footerText: { fontFamily: 'Manrope', fontSize: 9, color: tone('#97A89C', 'text') },
    bottomNav: {
      minHeight: 74,
      borderTopWidth: 1,
      borderTopColor: C.line,
      backgroundColor: tone('white', 'background'),
      flexDirection: 'row',
      paddingTop: 6,
    },
    bottomTab: { flex: 1, minWidth: 0, paddingHorizontal: 2, alignItems: 'center', gap: 4 },
    bottomIcon: {
      width: 54,
      height: 32,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bottomText: { fontFamily: 'ManropeBold', fontSize: 9, color: C.muted },
    loading: { minHeight: 350, alignItems: 'center', justifyContent: 'center', gap: 20 },
    toast: {
      position: 'absolute',
      bottom: 90,
      alignSelf: 'center',
      backgroundColor: '#173F43',
      borderRadius: 14,
      padding: 17,
      maxWidth: '90%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    toastText: {
      fontFamily: 'ManropeMedium',
      fontSize: 11,
      color: tone('white', 'text'),
      flexShrink: 1,
    },
    modalShade: {
      flex: 1,
      backgroundColor: '#122D3977',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    welcomeCard: { maxWidth: 480, width: '100%', padding: 26 },
    dismiss: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    input: {
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 11,
      padding: 13,
      fontFamily: 'Manrope',
      fontSize: 13,
      color: C.ink,
      marginTop: 8,
      minHeight: 47,
      backgroundColor: tone('#FBFDFB', 'background'),
    },
    goalOption: {
      paddingHorizontal: 15,
      minHeight: 44,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 10,
      backgroundColor: tone('white', 'background'),
    },
    optionActive: { backgroundColor: C.mint, borderColor: C.teal },
    optionText: { fontFamily: 'ManropeBold', fontSize: 11, color: C.teal },
    unitHeader: { padding: 23, flexDirection: 'row', alignItems: 'center', gap: 18 },
    unitNumber: {
      width: 57,
      height: 57,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unitCount: { fontFamily: 'ManropeBold', color: C.teal, fontSize: 11 },
    lessonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      paddingVertical: 13,
      paddingHorizontal: 13,
      backgroundColor: tone('#F7FAF6', 'background'),
      borderRadius: 12,
      minHeight: 64,
    },
    lessonCircle: {
      width: 35,
      height: 35,
      borderRadius: 12,
      backgroundColor: tone('#E9F1E8', 'background'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    lessonTitle: { fontFamily: 'ManropeBold', fontSize: 12, color: C.ink },
  });
}
