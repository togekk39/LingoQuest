import { ThemeButton } from './ThemePicker';
import { useTheme } from './theme';
import React, { useState, useEffect, useCallback } from 'react';
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
  Headphones,
  Volume2,
  Target,
  X,
  ShieldCheck,
  MapPin,
  Briefcase,
  RefreshCw,
  Settings2,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Leaf,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, bootstrap, localSettings, type Unit, type Progress } from './lib/api';
import { Button, Card, Label, Heading, Pill, ProgressBar } from './ui';
import { JourneyArt } from './JourneyArt';
import { ReviewsFlow } from './features/ReviewsFlow';
import { LearningFlow } from './features/LearningFlow';
import { PlacementFlow } from './features/PlacementFlow';
import { MissionsFlow } from './features/MissionsFlow';
import { PronunciationFlow } from './features/PronunciationFlow';
import { ChallengesScreen } from './challenges/ChallengesScreen';
import { OfflineProfile as Profile } from './content-manager/OfflineProfile';
import { speakOffline } from './features/offlineSpeech';
import { getRaw } from './lib/storage';
import { saveTextFile } from './lib/localFiles';
import { OFFLINE_STATE_KEY } from '@lingoquest/offline-engine';
import { SpeechSettings } from './features/SpeechSettings';
import { MotionEntrance, MotionPressable, MotionProvider, useReducedMotion } from './motion';
import { QuestBuddy } from './QuestBuddy';

type Tab = 'Inicio' | 'Aprender' | 'Desafíos' | 'Perfil';
const tabs: { id: Tab; icon: typeof House; subtitle: string }[] = [
  { id: 'Inicio', icon: House, subtitle: 'Tu espacio' },
  { id: 'Aprender', icon: BookOpen, subtitle: 'Paso a paso' },
  { id: 'Desafíos', icon: Trophy, subtitle: 'Un reto para ti' },
  { id: 'Perfil', icon: UserRound, subtitle: 'Tu progreso' },
];
const unitNames = [
  '¡Hola! Mucho gusto',
  'Tu día a día',
  'Pregunta sin miedo',
  'Historias de ayer',
  'Aquí y ahora',
  'Lo que viene',
  'Tus experiencias',
  'Inglés en la vida real',
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
  const { colors: C, tone } = useTheme();
  const reducedMotion = useReducedMotion();
  const s = useStyles();

  const { width } = useWindowDimensions();
  const desktop = width >= 1050;
  const wide = width >= 1280;
  const [tab, setTab] = useState<Tab>('Inicio');
  const [units, setUnits] = useState<Unit[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [flow, setFlow] = useState<{
    type: 'lesson' | 'placement' | 'mission' | 'speech' | 'reviews';
    id?: string;
  } | null>(null);
  const [settings, setSettings] = useState(false);
  const [recoveryReset, setRecoveryReset] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState(10);
  const [motivation, setMotivation] = useState('Vida diaria');
  const refresh = useCallback(async () => {
    const [catalog, p] = await Promise.all([
      api<{ units: Unit[] }>('/v1/catalog'),
      api<Progress>('/v1/me/progress'),
    ]);
    setUnits(catalog.units);
    setProgress(p);
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
  const nextUnit = units.find((u) => u.lessons.some((l) => l.id === nextLesson?.id));
  const begin = () => {
    if (nextLesson) setFlow({ type: 'lesson', id: nextLesson.id });
  };
  if (flow?.type === 'lesson')
    return <LearningFlow lessonId={flow.id!} onClose={() => setFlow(null)} onComplete={complete} />;
  if (flow?.type === 'reviews') return <ReviewsFlow onClose={complete} />;
  if (flow?.type === 'placement')
    return <PlacementFlow onClose={() => setFlow(null)} onComplete={complete} />;
  if (flow?.type === 'mission')
    return <MissionsFlow missionId={flow.id as 'airport' | 'job'} onClose={() => setFlow(null)} />;
  if (flow?.type === 'speech') return <PronunciationFlow onClose={() => setFlow(null)} />;
  const go = (t: Tab) => {
    setTab(t);
    setFlow(null);
  };
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.shell}>
        {desktop && (
          <View style={s.sidebar}>
            <Brand />
            <Text style={s.navCaption}>TU VIAJE EN INGLÉS</Text>
            <View style={{ gap: 8 }}>
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
                  {t.id === 'Desafíos' && <View style={s.tinyDot} />}
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
                  <Text style={s.profileSub}>Tu aventura · Nivel A1</Text>
                </View>
                <ChevronRight size={16} color={C.muted} />
              </Pressable>
            </View>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={[s.topbar, !desktop && { paddingHorizontal: 20 }]}>
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
              {desktop && (
                <View style={s.language}>
                  <Text style={{ fontSize: 14 }}>🇺🇸</Text>
                  <Text style={s.languageText}>Inglés · A1</Text>
                </View>
              )}
            </View>
          </View>
          <ScrollView
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
                {tab === 'Inicio' && (
                  <View style={[s.dashboard, { flexDirection: wide ? 'row' : 'column' }]}>
                    <View style={{ flex: 1, minWidth: 0, gap: 25 }}>
                      <View>
                        <View style={[s.row, { gap: 7, marginBottom: 9 }]}>
                          <View style={s.greetingDot} />
                          <Text style={s.eyebrow}>UN NUEVO DÍA PARA DESCUBRIR</Text>
                        </View>
                        <Heading style={{ fontSize: desktop ? 31 : 28 }}>
                          ¡Hola, {progress?.user.name || 'Explorador'}!{' '}
                          <Text style={{ fontSize: 25 }}>☀</Text>
                        </Heading>
                        <Label style={{ marginTop: 5 }}>
                          Tu mundo crece con cada palabra. ¿Damos el siguiente paso?
                        </Label>
                      </View>
                      <MotionEntrance style={s.hero}>
                        <View style={[s.heroWords, { maxWidth: wide ? 340 : 450 }]}>
                          <Pill color="#497B64" bg="#D9EBD8">
                            TU AVENTURA CONTINÚA
                          </Pill>
                          <Text style={[s.heroTitle, { fontSize: desktop ? 36 : 32 }]}>
                            Un poco de inglés.{'\n'}Un mundo de{'\n'}
                            <Text style={{ color: C.teal }}>posibilidades.</Text>
                          </Text>
                          <Label
                            style={{ color: tone('#567869', 'text'), fontSize: 12, maxWidth: 270 }}
                          >
                            Aprende sin prisa, equivócate sin miedo y descubre hasta dónde puedes
                            llegar.
                          </Label>
                          <Button
                            icon={ArrowRight}
                            onPress={begin}
                            style={{ alignSelf: 'flex-start', marginTop: 21 }}
                          >
                            Continuar aprendiendo
                          </Button>
                        </View>
                        {width > 720 && (
                          <View style={s.heroArt}>
                            <JourneyArt width={wide ? 300 : 280} />
                          </View>
                        )}
                        <View style={s.heroFooter}>
                          <View style={s.row}>
                            <BookOpen size={14} color="#668C72" />
                            <Text style={s.heroFootText}>
                              Unidad {nextUnit ? units.indexOf(nextUnit) + 1 : 1} ·{' '}
                              {nextLesson?.title}
                            </Text>
                          </View>
                          <Text style={s.heroFootText}>~ 7 min</Text>
                        </View>
                      </MotionEntrance>
                      <View style={[s.row, { gap: 14, paddingHorizontal: 8 }]}>
                        <QuestBuddy size={68} />
                        <View style={{ flex: 1, gap: 3 }}>
                          <Text style={s.cardTitle}>¡Vamos paso a paso!</Text>
                          <Label style={{ fontSize: 12 }}>Cada palabra cuenta. Tú puedes.</Label>
                        </View>
                      </View>
                      <View>
                        <View style={[s.sectionTitle, { marginBottom: 13 }]}>
                          <Heading style={{ fontSize: 21 }}>Un paso más en tu camino</Heading>
                          <Pressable onPress={() => go('Aprender')} style={s.row}>
                            <Text style={s.link}>Ver mi ruta</Text>
                            <ArrowRight size={15} color={C.teal} />
                          </Pressable>
                        </View>
                        <Card style={{ padding: 20 }}>
                          <View style={s.row}>
                            <View style={s.unitIcon}>
                              <BookOpen size={23} color={C.teal} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={s.eyebrow}>
                                UNIDAD {nextUnit ? units.indexOf(nextUnit) + 1 : 1} ·{' '}
                                {nextUnit?.cefr || 'A1'}
                              </Text>
                              <Text style={s.cardTitle}>{nextUnit?.title || 'Say hello'}</Text>
                              <Label style={{ fontSize: 11 }}>{nextUnit?.description}</Label>
                            </View>
                            <Pressable
                              accessibilityLabel="Abrir siguiente lección"
                              onPress={begin}
                              style={s.circleButton}
                            >
                              <ArrowRight size={20} color={C.teal} />
                            </Pressable>
                          </View>
                          <View style={{ marginTop: 19, marginBottom: 9 }}>
                            <ProgressBar
                              value={
                                (nextUnit?.lessons.filter((l) =>
                                  progress?.completedLessons.includes(l.id),
                                ).length || 0) / 4
                              }
                            />
                          </View>
                          <View style={[s.row, { justifyContent: 'space-between' }]}>
                            <Label style={{ fontSize: 10 }}>
                              {nextUnit?.lessons.filter((l) =>
                                progress?.completedLessons.includes(l.id),
                              ).length || 0}{' '}
                              de 4 lecciones completadas
                            </Label>
                            <Text style={s.nextTag}>El siguiente paso es tuyo</Text>
                          </View>
                        </Card>
                      </View>
                      <View
                        style={[s.quickGrid, { flexDirection: width < 620 ? 'column' : 'row' }]}
                      >
                        <PracticeCard
                          icon={RefreshCw}
                          badge={
                            progress?.reviewCount
                              ? `${progress.reviewCount} pendientes`
                              : 'A tu ritmo'
                          }
                          title="Que no se te olvide"
                          text="Haz espacio para lo que ya aprendiste."
                          action="Repasar un poquito"
                          onPress={() => setFlow({ type: 'reviews' })}
                          color="#E9EFF9"
                          iconColor="#6D86B5"
                        />
                        <PracticeCard
                          icon={Headphones}
                          badge="Sin presión"
                          title="Encuentra tu voz"
                          text="Escucha, prueba y suena más como tú."
                          action="Practicar pronunciación"
                          onPress={() => setFlow({ type: 'speech' })}
                          color="#FBEDDF"
                          iconColor="#C58E53"
                        />
                      </View>
                      <View style={s.challengeNudge}>
                        <View style={s.row}>
                          <Trophy size={18} color="#B89860" />
                          <Text style={s.nudgeTitle}>¿Te gustan los retos?</Text>
                        </View>
                        <Label style={{ flex: 1, fontSize: 11 }}>
                          Cuando tú quieras, hay una aventura extra.
                        </Label>
                        <Pressable onPress={() => go('Desafíos')} style={s.row}>
                          <Text style={s.link}>Explorar</Text>
                          <ArrowUpRight size={15} color={C.teal} />
                        </Pressable>
                      </View>
                    </View>
                    <View style={{ width: wide ? 270 : '100%', gap: 20, marginTop: wide ? 1 : 0 }}>
                      <Card style={{ padding: 22 }}>
                        <View style={s.sectionTitle}>
                          <Text style={s.smallTitle}>Tu pequeño gran hábito</Text>
                          <Target color={C.muted} size={17} />
                        </View>
                        <View style={s.goalCircle}>
                          <SvgGoal
                            value={Math.min(
                              1,
                              progress?.learningDays.includes(new Date().toISOString().slice(0, 10))
                                ? 1
                                : 0,
                            )}
                          />
                          <View style={s.goalCenter}>
                            <Text style={s.goalNumber}>
                              {progress?.learningDays.includes(
                                new Date().toISOString().slice(0, 10),
                              )
                                ? '1'
                                : '0'}
                              <Text style={{ fontSize: 18, color: tone('#A5B6AA', 'text') }}>
                                {' '}
                                / 1
                              </Text>
                            </Text>
                            <Text style={s.goalLabel}>práctica de hoy</Text>
                          </View>
                        </View>
                        <Text style={s.goalSub}>Un ratito para ti. Un paso adelante.</Text>
                        <View style={s.week}>
                          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => {
                            const today = (new Date().getDay() + 6) % 7;
                            const date = new Date();
                            date.setDate(date.getDate() + i - today);
                            const done = progress?.learningDays.includes(
                              date.toISOString().slice(0, 10),
                            );
                            return (
                              <View key={i} style={{ alignItems: 'center', gap: 7 }}>
                                <Text style={s.weekDay}>{d}</Text>
                                <View
                                  style={[
                                    s.weekDot,
                                    done && { backgroundColor: C.primary },
                                    i === today && { borderColor: C.teal, borderWidth: 1.5 },
                                  ]}
                                >
                                  {done ? (
                                    <Check size={12} color="white" />
                                  ) : i === today ? (
                                    <View
                                      style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: 3,
                                        backgroundColor: C.primary,
                                      }}
                                    />
                                  ) : null}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                        <View style={s.goalNote}>
                          <Flame size={14} color="#BF8D54" />
                          <Label style={{ fontSize: 10 }}>La constancia empieza con un día.</Label>
                        </View>
                      </Card>
                      <View style={s.quoteCard}>
                        <View style={s.quoteIcon}>
                          <Sparkles size={20} color="#A48350" />
                        </View>
                        <Text style={s.quoteCaption}>UNA FRASE PARA LLEVAR</Text>
                        <Text style={s.quote}>“Every journey begins{'\n'}with a single step.”</Text>
                        <Label
                          style={{
                            fontSize: 11,
                            color: tone('#8C826A', 'text'),
                            textAlign: 'center',
                          }}
                        >
                          Cada viaje comienza con un solo paso.
                        </Label>
                        <Pressable
                          onPress={() => {
                            void speakOffline(
                              'Every journey begins with a single step.',
                              setNotice,
                            );
                          }}
                          style={s.listen}
                        >
                          <Volume2 size={14} color="#927A55" />
                          <Text style={s.listenText}>Escuchar en inglés</Text>
                        </Pressable>
                      </View>
                      <View style={{ padding: 8 }}>
                        <View style={[s.row, { marginBottom: 9 }]}>
                          <ShieldCheck size={16} color="#8CA195" />
                          <Text style={s.quietTitle}>Aprender se siente mejor así</Text>
                        </View>
                        <Label style={{ fontSize: 11, lineHeight: 19 }}>
                          Sin vidas que perder. Sin prisa por llegar. Solo tú y todo lo que puedes
                          aprender.
                        </Label>
                      </View>
                    </View>
                  </View>
                )}
                {tab === 'Aprender' && (
                  <LearnMap
                    units={units}
                    progress={progress!}
                    onLesson={(id: string) => setFlow({ type: 'lesson', id })}
                    onPlacement={() => setFlow({ type: 'placement' })}
                    onReview={() => setFlow({ type: 'reviews' })}
                    onMission={(id: string) => setFlow({ type: 'mission', id })}
                    onNotice={setNotice}
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
                <View style={s.footer}>
                  <View style={s.row}>
                    <Compass size={13} color="#9DB2A4" />
                    <Text style={s.footerText}>LingoQuest · Tu inglés, a tu ritmo.</Text>
                  </View>
                  <Text style={s.footerText}>Hecho para descubrir.</Text>
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
                    Inglés para tu vida real.
                  </Heading>
                  <Label style={{ marginTop: 10, marginBottom: 24 }}>
                    Pequeños pasos, nuevas posibilidades. Aprende sin presión y descubre tu propio
                    camino.
                  </Label>
                  <Button
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
                Tu audio permanece en tu dispositivo y se elimina al salir de la práctica. El
                servicio de evaluación de pronunciación no está conectado: nunca inventamos una
                calificación.
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
function PracticeCard({ icon: Icon, badge, title, text, action, onPress, color, iconColor }: any) {
  const { colors: C, tone } = useTheme();
  const s = useStyles();

  return (
    <Card style={{ flex: 1, padding: 20 }}>
      <View style={s.sectionTitle}>
        <View style={[s.practiceIcon, { backgroundColor: tone(color, 'background') }]}>
          <Icon color={iconColor} size={21} />
        </View>
        <Text style={s.subtleBadge}>{badge}</Text>
      </View>
      <Text style={[s.cardTitle, { fontSize: 17, marginTop: 15 }]}>{title}</Text>
      <Label style={{ fontSize: 11, marginTop: 4 }}>{text}</Label>
      <Pressable onPress={onPress} accessibilityRole="button" style={[s.row, { marginTop: 17 }]}>
        <Text style={s.link}>{action}</Text>
        <ArrowRight size={14} color={C.teal} />
      </Pressable>
    </Card>
  );
}
function SvgGoal({ value }: { value: number }) {
  const { colors: C, tone } = useTheme();

  return (
    <View
      style={{
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 8,
        borderColor: tone('#EBF1EB', 'border'),
        borderTopColor: C.teal,
        transform: [{ rotate: '-38deg' }],
      }}
    >
      {value > 0 && (
        <View
          style={{
            position: 'absolute',
            inset: -8,
            borderWidth: 8,
            borderRadius: 70,
            borderColor: C.teal,
          }}
        />
      )}
    </View>
  );
}
function LearnMap({ units, progress, onLesson, onPlacement, onReview, onMission }: any) {
  const { colors: C, tone } = useTheme();
  const s = useStyles();

  const [expanded, setExpanded] = useState('u01');

  return (
    <View style={{ gap: 24, maxWidth: 1020 }}>
      <View style={s.sectionTitle}>
        <View>
          <Text style={s.eyebrow}>PASO A PASO, PALABRA A PALABRA</Text>
          <Heading style={{ fontSize: 32, marginTop: 7 }}>Tu ruta de aprendizaje</Heading>
          <Label>{units.length} destinos. Un montón de posibilidades. Sin prisa.</Label>
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
                    ? tone(unitColors[i], 'background')
                    : tone('white', 'background'),
                },
              ]}
            >
              <View
                style={[
                  s.unitNumber,
                  { backgroundColor: open ? C.white : tone(unitColors[i], 'background') },
                ]}
              >
                <Text style={{ fontFamily: 'OutfitSemiBold', fontSize: 23, color: C.teal }}>
                  {String(i + 1).padStart(2, '0')}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.eyebrow}>
                  {unit.cefr} · {unitNames[i]}
                </Text>
                <Heading style={{ fontSize: 23, marginTop: 3 }}>{unit.title}</Heading>
                <Label style={{ fontSize: 11 }}>{unit.description}</Label>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <Text style={s.unitCount}>{done}/4</Text>
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
                    <MotionPressable
                      accessibilityRole="button"
                      key={l.id}
                      onPress={() => onLesson(l.id)}
                      style={s.lessonRow}
                    >
                      <View style={[s.lessonCircle, completed && { backgroundColor: C.primary }]}>
                        {completed ? (
                          <Check size={18} color="white" />
                        ) : (
                          <Text style={{ fontFamily: 'OutfitMedium', color: C.teal, fontSize: 16 }}>
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
      <View style={s.quickGrid}>
        <PracticeCard
          icon={MapPin}
          title="Próxima parada: el aeropuerto"
          text="Resuelve una situación de viaje, paso a paso."
          badge="Misión · Texto"
          action="Preparar mi viaje"
          onPress={() => onMission('airport')}
          color="#E7F2E8"
          iconColor={C.teal}
        />
        <PracticeCard
          icon={Briefcase}
          title="Tu próxima oportunidad"
          text="Prepárate para una entrevista de trabajo."
          badge="Misión · Texto"
          action="Practicar entrevista"
          onPress={() => onMission('job')}
          color="#FBEDDF"
          iconColor="#C58E53"
        />
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
    navCaption: {
      fontFamily: 'ManropeBold',
      fontSize: 9,
      letterSpacing: 1.6,
      color: tone('#9BAEA4', 'text'),
      marginTop: 51,
      marginBottom: 17,
      paddingLeft: 13,
    },
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
    tinyDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: tone('#D9B47B', 'background'),
    },
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
    dashboard: { gap: 27 },
    eyebrow: {
      fontFamily: 'ManropeBold',
      fontSize: 9,
      letterSpacing: 1.1,
      color: tone('#789583', 'text'),
    },
    greetingDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: tone('#C0A974', 'background'),
    },
    hero: {
      backgroundColor: tone('#E9F1DF', 'background'),
      borderRadius: 20,
      borderWidth: 1,
      borderColor: tone('#DBE8D2', 'border'),
      overflow: 'hidden',
      minHeight: 350,
      paddingTop: 28,
      paddingHorizontal: 29,
      paddingBottom: 68,
      position: 'relative',
    },
    heroWords: { zIndex: 2 },
    heroTitle: {
      fontFamily: 'OutfitMedium',
      color: C.ink,
      lineHeight: 43,
      letterSpacing: -0.6,
      marginTop: 17,
      marginBottom: 12,
    },
    heroArt: { position: 'absolute', right: -8, top: 42, zIndex: 1 },
    heroFooter: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderTopWidth: 1,
      borderColor: tone('#D6E5CD', 'border'),
      paddingHorizontal: 24,
      paddingVertical: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: tone('#E3EDD680', 'background'),
    },
    heroFootText: { fontFamily: 'ManropeMedium', fontSize: 10, color: tone('#66806C', 'text') },
    sectionTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    link: { fontFamily: 'ManropeBold', fontSize: 10, color: C.teal },
    unitIcon: {
      width: 53,
      height: 53,
      borderRadius: 14,
      backgroundColor: tone('#EAF2E5', 'background'),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 6,
    },
    cardTitle: { fontFamily: 'OutfitMedium', fontSize: 21, color: C.ink, marginTop: 3 },
    circleButton: {
      width: 38,
      height: 38,
      borderRadius: 13,
      backgroundColor: tone('#EDF5EE', 'background'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextTag: { fontFamily: 'ManropeMedium', fontSize: 9, color: tone('#8AA391', 'text') },
    quickGrid: { flexDirection: 'row', gap: 16 },
    practiceIcon: {
      width: 41,
      height: 41,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subtleBadge: { fontFamily: 'ManropeMedium', fontSize: 9, color: tone('#95A397', 'text') },
    challengeNudge: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: tone('#D8E1D2', 'border'),
      borderRadius: 13,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
    },
    nudgeTitle: { fontFamily: 'ManropeBold', fontSize: 10, color: tone('#7B795F', 'text') },
    smallTitle: { fontFamily: 'OutfitMedium', fontSize: 16, color: C.ink },
    goalCircle: { alignItems: 'center', justifyContent: 'center', marginTop: 27, marginBottom: 16 },
    goalCenter: { position: 'absolute', alignItems: 'center' },
    goalNumber: { fontFamily: 'OutfitMedium', fontSize: 37, color: C.ink },
    goalLabel: { fontFamily: 'ManropeMedium', fontSize: 9, color: C.muted, marginTop: 3 },
    goalSub: { fontFamily: 'Manrope', fontSize: 9, color: C.muted, textAlign: 'center' },
    week: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 23,
      marginBottom: 22,
    },
    weekDay: { fontFamily: 'Manrope', fontSize: 9, color: tone('#91A197', 'text') },
    weekDot: {
      width: 23,
      height: 23,
      borderRadius: 9,
      backgroundColor: tone('#F0F4EF', 'background'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    goalNote: {
      borderTopWidth: 1,
      borderTopColor: C.line,
      paddingTop: 15,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      justifyContent: 'center',
    },
    quoteCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: tone('#EBE8DB', 'border'),
      backgroundColor: tone('#F5F2E9', 'background'),
      padding: 22,
      alignItems: 'center',
    },
    quoteIcon: {
      width: 33,
      height: 33,
      borderRadius: 12,
      backgroundColor: tone('#ECE6D5', 'background'),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    quoteCaption: {
      fontFamily: 'ManropeBold',
      fontSize: 8,
      letterSpacing: 1.3,
      color: tone('#A19175', 'text'),
    },
    quote: {
      fontFamily: 'Outfit',
      fontSize: 23,
      color: tone('#6C6A51', 'text'),
      textAlign: 'center',
      lineHeight: 30,
      marginTop: 14,
      marginBottom: 9,
    },
    listen: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 17, minHeight: 28 },
    listenText: { fontFamily: 'ManropeBold', fontSize: 9, color: tone('#927A55', 'text') },
    quietTitle: { fontFamily: 'ManropeBold', fontSize: 10, color: tone('#819285', 'text') },
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
      height: 74,
      borderTopWidth: 1,
      borderTopColor: C.line,
      backgroundColor: tone('white', 'background'),
      flexDirection: 'row',
      paddingTop: 6,
    },
    bottomTab: { flex: 1, alignItems: 'center', gap: 4 },
    bottomIcon: {
      width: 54,
      height: 32,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bottomText: { fontFamily: 'ManropeBold', fontSize: 9, color: C.muted },
    loading: { minHeight: 350, alignItems: 'center', justifyContent: 'center', gap: 20 },
    offline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      backgroundColor: tone('#E9F2E9', 'background'),
      paddingVertical: 11,
      paddingHorizontal: 24,
    },
    offlineText: { fontFamily: 'Manrope', fontSize: 10, color: C.teal, flex: 1 },
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
    statsGrid: { flexDirection: 'row', gap: 10, marginTop: 25, marginBottom: 18 },
    profileStat: {
      flex: 1,
      backgroundColor: tone('#F5F8F3', 'background'),
      padding: 18,
      borderRadius: 13,
      alignItems: 'center',
      gap: 7,
    },
    statNumber: { fontFamily: 'OutfitSemiBold', fontSize: 28, color: C.ink },
    errorText: { fontFamily: 'Manrope', fontSize: 12, color: C.red, marginTop: 15 },
    exportText: {
      fontFamily: 'monospace',
      fontSize: 10,
      maxHeight: 200,
      marginVertical: 14,
      color: C.ink,
    },
  });
}
