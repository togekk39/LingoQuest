import { useTheme } from '../theme';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Flame,
  Heart,
  LockKeyhole,
  Medal,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react-native';
import type { Answer, RunView } from '@lingoquest/contracts';
import { api } from '../lib/api';

type GameType = 'grammar_rush' | 'cloze_battle' | 'reading_quest';
type Track = {
  id: string;
  titleEs: string;
  descriptionEs: string;
  requiredUnitId: string;
  unlocked: boolean;
  completedLessons: number;
  requiredLessons: number;
  published: boolean;
  rankedAvailable: boolean;
  available?: boolean;
  highestPracticeLevel: number;
};
type Level = {
  level: number;
  nameEs: string;
  hearts: number;
  seconds: number;
  unlocked: boolean;
  bestScore: number;
};
type ViewName = 'hub' | 'track' | 'preflight' | 'run' | 'result';
const gameNames: Record<GameType, { title: string; detail: string; short: string }> = {
  grammar_rush: {
    title: 'Grammar Rush',
    detail: '10 preguntas de gramática en contextos cotidianos.',
    short: 'Gramática',
  },
  cloze_battle: {
    title: 'Cloze Battle',
    detail: 'Lee una historia y completa los espacios en blanco.',
    short: 'Completar',
  },
  reading_quest: {
    title: 'Reading Quest',
    detail: 'Una lectura con preguntas para comprender e inferir.',
    short: 'Lectura',
  },
};
function uid() {
  return `cq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No pudimos abrir la práctica guardada. Inténtalo otra vez.';
}
function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
function Action({
  label,
  onPress,
  secondary = false,
  disabled = false,
  busy = false,
  icon = true,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
  icon?: boolean;
}) {
  const { colors: C } = useTheme();
  const s = useStyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        s.action,
        secondary && s.actionSecondary,
        (disabled || busy) && { opacity: 0.55 },
        pressed && { opacity: 0.82 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? C.teal : C.onPrimary} size="small" />
      ) : (
        <>
          <Text style={[s.actionText, secondary && { color: C.ink }]}>{label}</Text>
          {icon && <ArrowRight size={17} color={secondary ? C.ink : C.onPrimary} />}
        </>
      )}
    </Pressable>
  );
}
function Back({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors: C } = useTheme();
  const s = useStyles();

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={s.back}>
      <ArrowLeft color={C.teal} size={18} />
      <Text style={s.backText}>{label}</Text>
    </Pressable>
  );
}
function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  const { colors: C } = useTheme();
  const s = useStyles();

  return (
    <View accessibilityRole="alert" style={s.errorBox}>
      <Text style={s.errorText}>{message}</Text>
      {retry && (
        <Pressable accessibilityRole="button" onPress={retry} style={s.inlineButton}>
          <RefreshCw size={16} color={C.ink} />
          <Text style={s.link}>Reintentar</Text>
        </Pressable>
      )}
    </View>
  );
}
function SmallLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  const { colors: C } = useTheme();
  const s = useStyles();
  color ??= C.teal;

  return <Text style={[s.label, { color }]}>{children}</Text>;
}

export function ChallengesScreen({
  onLearn,
  onRefresh,
}: {
  onLearn: () => void;
  onRefresh: () => void;
}) {
  const { colors: C, tone } = useTheme();
  const s = useStyles();

  const { width } = useWindowDimensions();
  const narrow = width < 760;
  const [view, setView] = useState<ViewName>('hub');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [track, setTrack] = useState<Track | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [level, setLevel] = useState<Level | null>(null);
  const [type, setType] = useState<GameType>('grammar_rush');
  const [relaxed, setRelaxed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [run, setRun] = useState<RunView | null>(null);
  const [option, setOption] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [exitConfirm, setExitConfirm] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const deadline = useRef<number | null>(null);
  const engineOffset = useRef(0);
  const latestEngineTime = useRef(0);
  const createId = useRef(uid());
  const pending = useRef<{
    clientSubmissionId: string;
    questionPosition: number;
    answer: Answer;
  } | null>(null);
  const expirationChecked = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadTracks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api<{ tracks: Track[] }>('/v1/challenges/tracks');
      if (mounted.current) setTracks(data.tracks);
    } catch (e) {
      if (mounted.current) setError(errorText(e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void loadTracks();
  }, [loadTracks]);
  const loadLevels = useCallback(async (selectedTrack: Track, selectedType: GameType) => {
    setLoading(true);
    setError('');
    try {
      const data = await api<{ levels: Level[] }>(
        `/v1/challenges/tracks/${selectedTrack.id}/levels?type=${selectedType}`,
      );
      if (mounted.current) setLevels(data.levels);
    } catch (e) {
      if (mounted.current) setError(errorText(e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);
  function openTrack(selectedTrack: Track) {
    if (!selectedTrack.unlocked || selectedTrack.available === false) return;
    setTrack(selectedTrack);
    setView('track');
    setType('grammar_rush');
    void loadLevels(selectedTrack, 'grammar_rush');
  }
  function applyRun(next: RunView) {
    setRun(next);
    const reportedTime = Date.parse(next.serverNow);
    // A replay can return an earlier local result. Preserve the latest device
    // clock snapshot so retrying never appears to add practice time.
    if (reportedTime > latestEngineTime.current) {
      latestEngineTime.current = reportedTime;
      engineOffset.current = reportedTime - Date.now();
    }
    deadline.current = next.deadlineAt ? Date.parse(next.deadlineAt) : null;
    setRemaining(
      deadline.current === null
        ? 0
        : Math.max(0, Math.ceil((deadline.current - Date.now() - engineOffset.current) / 1000)),
    );
    if (next.status !== 'active') {
      setView('result');
      onRefresh();
    }
  }
  async function refreshRun() {
    if (!run) return;
    setBusy(true);
    setError('');
    try {
      const next = await api<RunView>(`/v1/challenges/runs/${run.runId}/current`);
      applyRun(next);
      if (next.questionPosition !== pending.current?.questionPosition) {
        pending.current = null;
        setOption(null);
        setText('');
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (view !== 'run' || !run || run.status !== 'active' || deadline.current === null) return;
    const id = setInterval(() => {
      const next = Math.max(
        0,
        Math.ceil(((deadline.current ?? 0) - Date.now() - engineOffset.current) / 1000),
      );
      setRemaining(next);
      if (next === 0 && !expirationChecked.current) {
        expirationChecked.current = true;
        void api<RunView>(`/v1/challenges/runs/${run.runId}/current`)
          .then(applyRun)
          .catch((e) => {
            setError(
              `El tiempo mostrado terminó. ${errorText(e)} Consulta el resultado guardado para continuar.`,
            );
          });
      }
    }, 250);
    return () => clearInterval(id);
  }, [view, run?.runId, run?.status]);
  async function startRun() {
    if (!track || !level) return;
    setBusy(true);
    setError('');
    try {
      const next = await api<RunView>('/v1/challenges/runs', {
        clientRequestId: createId.current,
        trackId: track.id,
        level: level.level,
        mode: 'practice',
        type,
        relaxed,
      });
      expirationChecked.current = false;
      pending.current = null;
      setOption(null);
      setText('');
      setExitConfirm(false);
      setView('run');
      applyRun(next);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function submitAnswer() {
    if (!run || !run.question) return;
    if (!pending.current) {
      const answer: Answer = option !== null ? { optionId: option } : { text: text.trim() };
      pending.current = {
        clientSubmissionId: uid(),
        questionPosition: run.questionPosition,
        answer,
      };
    }
    setBusy(true);
    setError('');
    try {
      const next = await api<RunView>(`/v1/challenges/runs/${run.runId}/answers`, pending.current);
      pending.current = null;
      setOption(null);
      setText('');
      applyRun(next);
    } catch (e) {
      setError(
        `No pudimos guardar tu respuesta en este dispositivo. ${errorText(e)} Tu respuesta sigue en pantalla para volver a intentar sin duplicarla.`,
      );
    } finally {
      setBusy(false);
    }
  }
  async function abandon() {
    if (!run) return;
    setBusy(true);
    setError('');
    try {
      const next = await api<RunView>(`/v1/challenges/runs/${run.runId}/abandon`, {});
      setExitConfirm(false);
      applyRun(next);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  function returnToTrack() {
    setError('');
    setExitConfirm(false);
    setView('track');
    if (track) void loadLevels(track, type);
  }

  if (view === 'hub')
    return (
      <View style={s.page}>
        <View style={s.pageHeading}>
          <SmallLabel>UN RETO, CUANDO TÚ QUIERAS</SmallLabel>
          <Text style={s.title}>Un paso más allá.</Text>
          <Text style={s.subtitle}>Aprende a tu ritmo. Después, pon a prueba lo que sabes.</Text>
        </View>
        <View style={[s.hero, narrow && { flexDirection: 'column' }]}>
          <View style={{ flex: 1, gap: 14 }}>
            <View style={s.badge}>
              <Sparkles size={13} color={C.teal} />
              <Text style={s.badgeText}>SIEMPRE OPCIONAL</Text>
            </View>
            <Text style={s.heroTitle}>Tu única competencia{narrow ? '\n' : ' '}eres tú.</Text>
            <Text style={s.heroCopy}>
              13 niveles para explorar tus habilidades. Sin arriesgar tus lecciones, tu XP ni lo que
              ya aprendiste.
            </Text>
            <View style={s.inline}>
              <ShieldCheck size={17} color={C.teal} />
              <Text style={s.safetyText}>Tu progreso está a salvo.</Text>
            </View>
          </View>
          <View style={s.trophyArt}>
            <View style={s.artCircle}>
              <Trophy size={70} color={C.teal} strokeWidth={1.25} />
            </View>
            <View style={s.artSpark}>
              <Sparkles size={23} color="#B77A32" />
            </View>
            <View style={s.artMedal}>
              <Medal size={27} color={C.teal} />
            </View>
          </View>
        </View>
        <View style={s.sectionHeading}>
          <Text style={s.sectionTitle}>Encuentra tu desafío</Text>
          <Text style={s.sectionNote}>3 caminos · 13 niveles</Text>
        </View>
        <View style={s.notice}>
          <BookOpen color={C.teal} size={19} />
          <Text style={s.noticeText}>
            Explora los 13 niveles sin conexión y sin clasificación. Tus resultados se guardan solo
            en este dispositivo. Las preguntas de demostración siguen pendientes de revisión
            editorial.
          </Text>
        </View>
        {error ? <ErrorBox message={error} retry={() => void loadTracks()} /> : null}
        {loading ? (
          <View style={s.loading}>
            <ActivityIndicator color={C.teal} />
            <Text style={s.muted}>Cargando tus desafíos…</Text>
          </View>
        ) : (
          <View style={[s.trackGrid, narrow && { flexDirection: 'column' }]}>
            {tracks.map((item, i) => (
              <View key={item.id} style={[s.trackCard, !narrow && { flex: 1 }]}>
                <View style={s.trackTop}>
                  <View
                    style={[
                      s.trackIcon,
                      {
                        backgroundColor: [
                          tone('#E1F0E8', 'background'),
                          tone('#FFF0DC', 'background'),
                          tone('#E9EEF7', 'background'),
                        ][i % 3],
                      },
                    ]}
                  >
                    {i === 0 ? (
                      <Flame size={25} color={C.teal} />
                    ) : i === 1 ? (
                      <Clock3 size={25} color="#AC7739" />
                    ) : (
                      <BookOpen size={25} color="#65799B" />
                    )}
                  </View>
                  <View style={s.draftTag}>
                    <Text style={s.draftText}>
                      {(item.available ?? item.id === 'present_simple')
                        ? 'SIN CONEXIÓN'
                        : 'PRÓXIMAMENTE'}
                    </Text>
                  </View>
                </View>
                <Text style={s.trackTitle}>{item.titleEs.replace(/^Desafío:\s*/, '')}</Text>
                <Text style={s.trackDescription}>{item.descriptionEs}</Text>
                <View style={s.requirement}>
                  {item.unlocked ? (
                    <Check size={16} color={C.teal} />
                  ) : (
                    <LockKeyhole size={15} color={C.muted} />
                  )}
                  <Text style={s.requirementText}>
                    {item.unlocked
                      ? 'Material relacionado aprendido'
                      : `${item.completedLessons} de ${item.requiredLessons} lecciones necesarias`}
                  </Text>
                </View>
                <Text style={s.previewCopy}>
                  {!(item.available ?? item.id === 'present_simple')
                    ? 'Este paquete todavía no incluye preguntas para este tema.'
                    : item.unlocked
                      ? 'Ya aprendiste las bases. Practica a tu ritmo, sin conexión.'
                      : 'Completa primero las lecciones relacionadas. Después podrás practicar estos retos.'}
                </Text>
                <Action
                  label={
                    (item.available ?? item.id === 'present_simple')
                      ? item.unlocked
                        ? 'Explorar práctica'
                        : 'Completa las lecciones primero'
                      : 'En preparación'
                  }
                  disabled={!(item.available ?? item.id === 'present_simple') || !item.unlocked}
                  secondary
                  onPress={() => openTrack(item)}
                />
              </View>
            ))}
          </View>
        )}
        <Pressable accessibilityRole="button" style={s.learnLink} onPress={onLearn}>
          <BookOpen color={C.teal} size={19} />
          <Text style={s.link}>Prefiero seguir aprendiendo</Text>
          <ArrowRight size={17} color={C.teal} />
        </Pressable>
      </View>
    );

  if (view === 'track')
    return (
      <View style={s.page}>
        <Back
          label="Todos los desafíos"
          onPress={() => {
            setView('hub');
            void loadTracks();
          }}
        />
        <SmallLabel>PRÁCTICA LOCAL · SIN CLASIFICACIÓN</SmallLabel>
        <Text style={s.title}>{track?.titleEs.replace(/^Desafío:\s*/, '')}</Text>
        <Text style={s.subtitle}>Elige una forma de practicar y encuentra tu siguiente reto.</Text>
        <View style={s.typeSelector}>
          {(Object.keys(gameNames) as GameType[]).map((key) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: type === key }}
              onPress={() => {
                setType(key);
                if (track) void loadLevels(track, key);
              }}
              style={[s.typeTab, type === key && s.typeTabSelected]}
            >
              <Text style={[s.typeText, type === key && { color: C.teal }]}>
                {gameNames[key].title}
              </Text>
              <Text style={s.typeCaption}>{gameNames[key].short}</Text>
            </Pressable>
          ))}
        </View>
        <View style={s.inline}>
          <BookOpen size={17} color={C.teal} />
          <Text style={s.body}>{gameNames[type].detail}</Text>
        </View>
        {!track?.unlocked && (
          <View style={s.notice}>
            <LockKeyhole color={C.teal} size={18} />
            <Text style={s.noticeText}>
              Completa primero las{' '}
              {Math.max(0, (track?.requiredLessons ?? 4) - (track?.completedLessons ?? 0))}{' '}
              lecciones relacionadas para desbloquear estos retos sin conexión.
            </Text>
          </View>
        )}
        {error ? (
          <ErrorBox
            message={error}
            retry={() => {
              if (track) void loadLevels(track, type);
            }}
          />
        ) : null}
        {loading ? (
          <View style={s.loading}>
            <ActivityIndicator color={C.teal} />
          </View>
        ) : (
          <View style={s.levelGrid}>
            {levels.map((item) => (
              <Pressable
                key={item.level}
                accessibilityRole="button"
                disabled={!item.unlocked}
                accessibilityState={{ disabled: !item.unlocked }}
                accessibilityLabel={`Nivel ${item.level}: ${item.nameEs}. ${item.hearts} corazones. ${clock(item.seconds)} minutos.`}
                onPress={() => {
                  setLevel(item);
                  createId.current = uid();
                  setError('');
                  setView('preflight');
                }}
                style={({ pressed }) => [
                  s.levelCard,
                  { width: narrow ? '47%' : '22.8%' },
                  item.level > 10 && s.levelExtreme,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <View style={s.levelTop}>
                  <Text style={s.levelNumber}>{String(item.level).padStart(2, '0')}</Text>
                  {item.bestScore > 0 ? (
                    <Medal size={19} color={C.teal} />
                  ) : item.level > 10 ? (
                    <Flame size={18} color="#B87532" />
                  ) : (
                    <ChevronRight size={18} color={C.muted} />
                  )}
                </View>
                <Text style={s.levelName}>{item.nameEs}</Text>
                <View style={s.inline}>
                  <Heart size={13} color={C.coral} />
                  <Text style={s.levelDetail}>{item.hearts}</Text>
                  <Text style={s.levelDot}>·</Text>
                  <Clock3 size={13} color={C.muted} />
                  <Text style={s.levelDetail}>{clock(item.seconds)}</Text>
                </View>
                {item.bestScore > 0 ? (
                  <Text style={s.bestScore}>Mejor práctica: {item.bestScore} pts</Text>
                ) : (
                  <Text style={s.bestScore}>
                    {item.level > 10 ? 'Reto avanzado' : 'Listo para explorar'}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        )}
        <View style={s.softFooter}>
          <ShieldCheck size={19} color={C.teal} />
          <Text style={s.muted}>
            Puedes practicar cualquier nivel. Los puntos de estos retos se guardan en tu dispositivo
            y son independientes de tus XP de aprendizaje.
          </Text>
        </View>
      </View>
    );

  if (view === 'preflight')
    return (
      <View style={[s.page, s.focused]}>
        <Back
          label="Volver a los niveles"
          onPress={() => {
            if (!busy) returnToTrack();
          }}
        />
        <View style={s.preflightCard}>
          <View style={s.largeIcon}>
            <Trophy size={40} color={C.teal} strokeWidth={1.5} />
          </View>
          <SmallLabel>
            NIVEL {level?.level} · {gameNames[type].title.toUpperCase()}
          </SmallLabel>
          <Text style={s.centerTitle}>{level?.nameEs}</Text>
          <Text style={s.centerBody}>Un reto para ti, sin presión sobre tu aprendizaje.</Text>
          <View style={s.preflightStats}>
            <View style={s.preflightStat}>
              <Heart size={24} color={C.coral} />
              <Text style={s.statValue}>{level?.hearts}</Text>
              <Text style={s.muted}>corazones</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.preflightStat}>
              <Clock3 size={24} color={C.teal} />
              <Text style={s.statValue}>{relaxed ? 'Sin reloj' : clock(level?.seconds ?? 0)}</Text>
              <Text style={s.muted}>{relaxed ? 'a tu ritmo' : 'tiempo total'}</Text>
            </View>
          </View>
          <View style={s.setting}>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={s.settingTitle}>Practicar sin reloj</Text>
              <Text style={s.muted}>Más espacio para leer y pensar. Sin clasificación.</Text>
            </View>
            <Switch
              accessibilityLabel="Practicar sin reloj"
              disabled={busy}
              value={relaxed}
              onValueChange={(value) => {
                setRelaxed(value);
                createId.current = uid();
              }}
              trackColor={{ false: '#CCDAD3', true: C.teal }}
              thumbColor={C.onPrimary}
            />
          </View>
          <View style={s.rules}>
            <Text style={s.rule}>• Cada error usa un corazón de esta práctica.</Text>
            <Text style={s.rule}>
              •{' '}
              {relaxed
                ? 'No hay límite de tiempo en esta práctica.'
                : 'El tiempo empieza solo cuando presionas Empezar.'}
            </Text>
            <Text style={s.rule}>• Puedes salir y volver a intentarlo cuando quieras.</Text>
            <Text style={s.rule}>• Las respuestas se comprueban aquí, sin conexión.</Text>
          </View>
          <View style={s.notice}>
            <ShieldCheck size={18} color={C.teal} />
            <Text style={s.noticeText}>
              Práctica personal guardada en este dispositivo. No da XP de aprendizaje ni participa
              en clasificaciones. Tu progreso de las lecciones no cambia.
            </Text>
          </View>
          {error ? <ErrorBox message={error} /> : null}
          <Action label="Empezar práctica" busy={busy} onPress={() => void startRun()} />
          <Action
            label="Volver a aprender"
            secondary
            disabled={busy}
            onPress={onLearn}
            icon={false}
          />
        </View>
      </View>
    );

  if (view === 'run' && run)
    return (
      <View style={[s.page, s.focused]}>
        <View style={s.runHeader}>
          <View style={{ gap: 5 }}>
            <SmallLabel>PRÁCTICA · NIVEL {run.level}</SmallLabel>
            <Text style={s.runTitle}>{gameNames[type].title}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Salir de la práctica"
            onPress={() => setExitConfirm(true)}
            style={s.close}
          >
            <X color={C.muted} size={21} />
          </Pressable>
        </View>
        <View style={s.runStats}>
          <View
            style={s.heartRow}
            accessibilityLabel={`${run.heartsRemaining} de ${run.heartsInitial} corazones`}
          >
            {Array.from({ length: run.heartsInitial }, (_, i) => (
              <Heart
                key={i}
                size={22}
                fill={i < run.heartsRemaining ? C.coral : 'transparent'}
                color={i < run.heartsRemaining ? C.coral : '#D7DFDA'}
              />
            ))}
          </View>
          <View
            style={[
              s.timer,
              remaining < 20 && !run.relaxed && { backgroundColor: tone('#FCEAE4', 'background') },
            ]}
          >
            <Clock3 size={17} color={C.ink} />
            <Text
              accessibilityLabel={
                run.relaxed ? 'Sin límite de tiempo' : `Tiempo restante: ${remaining} segundos`
              }
              style={s.timerText}
            >
              {run.relaxed ? 'Sin reloj' : clock(remaining)}
            </Text>
          </View>
        </View>
        <View style={s.progressTrack}>
          <View
            style={[
              s.progressFill,
              { width: `${(run.completedQuestions / run.questionsTotal) * 100}%` },
            ]}
          />
        </View>
        <View style={s.questionCount}>
          <Text style={s.muted}>
            Pregunta {run.questionPosition} de {run.questionsTotal}
          </Text>
          <Text style={s.muted}>Sin clasificación</Text>
        </View>
        {exitConfirm && (
          <View style={s.exitBox}>
            <Text style={s.settingTitle}>¿Quieres dejar esta práctica?</Text>
            <Text style={s.body}>
              Tus lecciones y tu XP quedan igual. Siempre puedes volver a intentar.
            </Text>
            <View style={s.inlineWrap}>
              <Action
                label="Seguir practicando"
                secondary
                icon={false}
                onPress={() => setExitConfirm(false)}
              />
              <Action
                label="Salir de la práctica"
                busy={busy}
                icon={false}
                onPress={() => void abandon()}
              />
            </View>
          </View>
        )}
        {run.question ? (
          <View style={s.questionCard}>
            {run.question.passage && (
              <View style={s.passage}>
                <SmallLabel>LEE CON ATENCIÓN</SmallLabel>
                <Text style={s.passageText}>{run.question.passage}</Text>
              </View>
            )}
            <Text style={s.questionPrompt}>{run.question.promptEs}</Text>
            {run.question.sentence && (
              <Text style={s.questionSentence}>{run.question.sentence}</Text>
            )}
            {run.question.options?.length ? (
              <View style={s.answers}>
                {run.question.options.map((item, i) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: option === item.id,
                      disabled: busy || !!pending.current,
                    }}
                    disabled={busy || !!pending.current}
                    onPress={() => setOption(item.id)}
                    style={[s.option, option === item.id && s.optionSelected]}
                  >
                    <View style={[s.optionLetter, option === item.id && s.optionLetterSelected]}>
                      <Text
                        style={[s.optionLetterText, option === item.id && { color: C.onPrimary }]}
                      >
                        {String.fromCharCode(65 + i)}
                      </Text>
                    </View>
                    <Text style={s.optionText}>{item.text}</Text>
                    {option === item.id && <Check size={18} color={C.teal} />}
                  </Pressable>
                ))}
              </View>
            ) : (
              <TextInput
                accessibilityLabel="Tu respuesta"
                style={s.textInput}
                value={text}
                onChangeText={setText}
                editable={!busy && !pending.current}
                autoCapitalize="none"
                placeholder="Escribe tu respuesta en inglés"
                placeholderTextColor={C.muted}
                onSubmitEditing={() => {
                  if (text.trim()) void submitAnswer();
                }}
              />
            )}
            {error ? <ErrorBox message={error} /> : null}
            <Action
              label={pending.current ? 'Reintentar envío' : 'Enviar respuesta'}
              disabled={!pending.current && option === null && !text.trim()}
              busy={busy}
              onPress={() => void submitAnswer()}
            />
            <Text style={s.centerNote}>Verás las explicaciones al terminar la práctica.</Text>
            {error && (
              <Action
                label="Consultar estado"
                secondary
                icon={false}
                busy={busy}
                onPress={() => void refreshRun()}
              />
            )}
          </View>
        ) : (
          <View style={s.loading}>
            <ActivityIndicator color={C.teal} />
            <Action label="Consultar resultado" secondary onPress={() => void refreshRun()} />
          </View>
        )}
      </View>
    );

  if (view === 'result' && run) {
    const passed = run.status === 'passed';
    return (
      <View style={[s.page, s.focused]}>
        <View style={s.preflightCard}>
          <View
            style={[s.largeIcon, !passed && { backgroundColor: tone('#FFF0DC', 'background') }]}
          >
            {passed ? (
              <Trophy size={42} color={C.teal} strokeWidth={1.5} />
            ) : (
              <RefreshCw size={38} color="#B77A32" strokeWidth={1.5} />
            )}
          </View>
          <SmallLabel>PRÁCTICA COMPLETADA · SIN CLASIFICACIÓN</SmallLabel>
          <Text style={s.centerTitle}>
            {passed
              ? '¡Lo lograste!'
              : run.status === 'abandoned'
                ? 'A tu ritmo, siempre.'
                : 'Cada intento cuenta.'}
          </Text>
          <Text style={s.centerBody}>
            {passed
              ? 'Un pequeño reto. Un gran paso en tu confianza.'
              : run.reason === 'timeout'
                ? 'Terminó el tiempo. Puedes volver a intentarlo sin reloj.'
                : run.status === 'abandoned'
                  ? 'Puedes volver cuando tengas ganas de un reto.'
                  : 'No pasa nada. Repasa, respira y vuelve a intentarlo.'}
          </Text>
          <View style={s.resultStats}>
            <View style={s.resultStat}>
              <Text style={s.statValue}>
                {run.correctCount}/{run.questionsTotal}
              </Text>
              <Text style={s.muted}>respuestas correctas</Text>
            </View>
            <View style={s.resultStat}>
              <Text style={s.statValue}>{run.score}</Text>
              <Text style={s.muted}>puntos de práctica</Text>
            </View>
          </View>
          <View style={s.notice}>
            <ShieldCheck size={20} color={C.teal} />
            <Text style={s.noticeText}>
              Tus lecciones, tu XP y tus habilidades siguen intactos. El resultado de esta práctica
              se guarda en este dispositivo.
            </Text>
          </View>
          {run.feedback && run.feedback.length > 0 && (
            <View style={s.feedbackList}>
              <Text style={s.settingTitle}>Lo que puedes llevarte</Text>
              {run.feedback.map((item, i) => (
                <View key={`${item.questionId}-${i}`} style={s.feedbackItem}>
                  <View
                    style={[
                      s.feedbackMarker,
                      { backgroundColor: item.correct ? C.mint : tone('#FFF0DC', 'background') },
                    ]}
                  >
                    {item.correct ? (
                      <Check size={15} color={C.teal} />
                    ) : (
                      <BookOpen size={15} color="#B77A32" />
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={s.feedbackText}>{item.feedbackEs}</Text>
                    {!item.correct && <Text style={s.accepted}>{item.acceptedAnswer}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}
          <Action
            label="Volver a practicar"
            onPress={() => {
              createId.current = uid();
              setError('');
              setView('preflight');
            }}
          />
          <Action label="Explorar otros niveles" secondary onPress={returnToTrack} />
          <Pressable accessibilityRole="button" style={s.learnLink} onPress={onLearn}>
            <BookOpen size={18} color={C.teal} />
            <Text style={s.link}>Seguir aprendiendo</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  return (
    <View style={s.loading}>
      <ActivityIndicator color={C.teal} />
      <Action label="Volver a los desafíos" secondary onPress={() => setView('hub')} />
    </View>
  );
}

export function useStyles() {
  const { colors: C, tone } = useTheme();
  return StyleSheet.create({
    page: { gap: 23, paddingBottom: 30 },
    focused: { width: '100%', maxWidth: 790, alignSelf: 'center' },
    pageHeading: { gap: 10 },
    label: {
      fontFamily: 'ManropeBold',
      fontSize: 10,
      letterSpacing: 1.7,
      textTransform: 'uppercase',
    },
    title: { fontFamily: 'OutfitSemiBold', color: C.ink, fontSize: 37, letterSpacing: -1.1 },
    subtitle: { fontFamily: 'Manrope', fontSize: 14, lineHeight: 23, color: C.muted },
    body: {
      fontFamily: 'Manrope',
      fontSize: 13,
      lineHeight: 22,
      color: C.ink,
      flexShrink: 1,
    },
    muted: {
      fontFamily: 'Manrope',
      fontSize: 12,
      lineHeight: 20,
      color: C.muted,
      flexShrink: 1,
    },
    hero: {
      padding: 30,
      borderRadius: 23,
      backgroundColor: tone('#E8F3EA', 'background'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      overflow: 'hidden',
    },
    badge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      gap: 7,
      alignItems: 'center',
      backgroundColor: tone('#D8ECDC', 'background'),
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    badgeText: { fontFamily: 'ManropeBold', fontSize: 9, letterSpacing: 1.2, color: C.teal },
    heroTitle: {
      fontFamily: 'OutfitMedium',
      color: C.ink,
      fontSize: 31,
      lineHeight: 37,
      letterSpacing: -0.7,
    },
    heroCopy: {
      fontFamily: 'Manrope',
      fontSize: 13,
      lineHeight: 22,
      color: tone('#4E7168', 'text'),
      maxWidth: 480,
    },
    inline: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    inlineWrap: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    safetyText: { fontFamily: 'ManropeSemiBold', fontSize: 11, color: C.teal },
    trophyArt: { width: 185, height: 145, justifyContent: 'center', alignItems: 'center' },
    artCircle: {
      width: 134,
      height: 134,
      borderRadius: 70,
      backgroundColor: tone('#D6E9D8', 'background'),
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ rotate: '-8deg' }],
    },
    artSpark: { position: 'absolute', right: 8, top: 3, transform: [{ rotate: '10deg' }] },
    artMedal: {
      position: 'absolute',
      left: 13,
      bottom: 1,
      padding: 10,
      backgroundColor: tone('#FAF9ED', 'background'),
      borderRadius: 16,
      transform: [{ rotate: '-12deg' }],
    },
    sectionHeading: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    sectionTitle: { fontFamily: 'OutfitSemiBold', fontSize: 22, color: C.ink },
    sectionNote: { fontFamily: 'Manrope', fontSize: 11, color: C.muted },
    notice: {
      flexDirection: 'row',
      gap: 11,
      alignItems: 'flex-start',
      padding: 15,
      borderRadius: 12,
      backgroundColor: tone('#EBF4EE', 'background'),
      width: '100%',
    },
    noticeText: {
      flex: 1,
      color: tone('#4A6F63', 'text'),
      fontFamily: 'Manrope',
      fontSize: 11,
      lineHeight: 19,
    },
    trackGrid: { flexDirection: 'row', gap: 16 },
    trackCard: {
      padding: 21,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: C.line,
      backgroundColor: C.white,
      gap: 13,
    },
    trackTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    trackIcon: {
      width: 49,
      height: 49,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
    },
    draftTag: { backgroundColor: C.paper, borderRadius: 6, padding: 6 },
    draftText: { fontFamily: 'ManropeBold', fontSize: 8, letterSpacing: 0.6, color: C.muted },
    trackTitle: { fontFamily: 'OutfitSemiBold', fontSize: 22, color: C.ink },
    trackDescription: {
      fontFamily: 'Manrope',
      color: C.muted,
      fontSize: 12,
      lineHeight: 20,
      minHeight: 45,
    },
    requirement: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderTopWidth: 1,
      borderTopColor: C.line,
      paddingTop: 14,
    },
    requirementText: { fontFamily: 'ManropeSemiBold', fontSize: 11, color: C.muted },
    previewCopy: {
      fontFamily: 'Manrope',
      fontSize: 10,
      lineHeight: 17,
      color: C.muted,
      minHeight: 35,
    },
    action: {
      backgroundColor: C.primary,
      minHeight: 48,
      borderRadius: 11,
      paddingHorizontal: 18,
      paddingVertical: 13,
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionSecondary: {
      backgroundColor: tone('#F1F6F1', 'background'),
      borderWidth: 1,
      borderColor: tone('#DFE9E1', 'border'),
    },
    actionText: { fontFamily: 'ManropeBold', color: C.onPrimary, fontSize: 12 },
    learnLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      minHeight: 45,
    },
    link: { fontFamily: 'ManropeSemiBold', fontSize: 12, color: C.teal },
    back: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      alignSelf: 'flex-start',
      minHeight: 44,
    },
    backText: { fontFamily: 'ManropeSemiBold', fontSize: 12, color: C.teal },
    errorBox: {
      backgroundColor: tone('#FFF1E9', 'background'),
      borderColor: tone('#F0D8C6', 'border'),
      borderWidth: 1,
      borderRadius: 12,
      padding: 15,
      gap: 10,
      width: '100%',
    },
    errorText: {
      fontFamily: 'Manrope',
      fontSize: 12,
      lineHeight: 20,
      color: tone('#854F37', 'text'),
    },
    inlineButton: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 34 },
    loading: { alignItems: 'center', justifyContent: 'center', padding: 45, gap: 15 },
    typeSelector: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    typeTab: {
      flex: 1,
      minWidth: 130,
      gap: 5,
      borderWidth: 1,
      borderColor: C.line,
      padding: 17,
      borderRadius: 13,
      backgroundColor: C.white,
    },
    typeTabSelected: { borderColor: C.teal, backgroundColor: tone('#EEF7F0', 'background') },
    typeText: { fontFamily: 'ManropeBold', fontSize: 12, color: C.ink },
    typeCaption: { fontFamily: 'Manrope', fontSize: 10, color: C.muted },
    levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
    levelCard: {
      padding: 18,
      gap: 13,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: C.line,
      backgroundColor: C.white,
      minWidth: 115,
    },
    levelExtreme: {
      backgroundColor: tone('#FFF8ED', 'background'),
      borderColor: tone('#EEDDC3', 'border'),
    },
    levelTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    levelNumber: { fontFamily: 'OutfitMedium', fontSize: 27, color: C.teal },
    levelName: { fontFamily: 'ManropeBold', fontSize: 11, lineHeight: 18, color: C.ink },
    levelDetail: { fontFamily: 'ManropeMedium', fontSize: 10, color: C.muted },
    levelDot: { color: tone('#B1BEB5', 'text'), fontSize: 12 },
    bestScore: { fontFamily: 'Manrope', fontSize: 9, color: C.muted },
    softFooter: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingTop: 6 },
    preflightCard: {
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 22,
      padding: 28,
      gap: 20,
      alignItems: 'stretch',
    },
    largeIcon: {
      alignSelf: 'center',
      width: 86,
      height: 86,
      borderRadius: 27,
      backgroundColor: C.mint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerTitle: {
      fontFamily: 'OutfitMedium',
      fontSize: 34,
      lineHeight: 39,
      letterSpacing: -0.8,
      textAlign: 'center',
      color: C.ink,
    },
    centerBody: {
      fontFamily: 'Manrope',
      fontSize: 13,
      lineHeight: 22,
      textAlign: 'center',
      color: C.muted,
    },
    preflightStats: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 9, gap: 22 },
    preflightStat: { alignItems: 'center', gap: 7, minWidth: 80 },
    statValue: { fontFamily: 'OutfitSemiBold', fontSize: 28, color: C.ink },
    statDivider: { width: 1, backgroundColor: C.line },
    setting: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
      padding: 16,
      borderRadius: 12,
      backgroundColor: C.paper,
    },
    settingTitle: { fontFamily: 'ManropeBold', fontSize: 13, color: C.ink },
    rules: { gap: 10 },
    rule: { fontFamily: 'Manrope', color: C.muted, fontSize: 12, lineHeight: 19 },
    runHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    runTitle: { fontFamily: 'OutfitSemiBold', fontSize: 24, color: C.ink },
    close: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: tone('#EDF3EE', 'background'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    runStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    heartRow: { flexDirection: 'row', gap: 6 },
    timer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: tone('#EAF3EB', 'background'),
      borderRadius: 9,
      paddingHorizontal: 11,
      paddingVertical: 8,
    },
    timerText: { fontFamily: 'ManropeBold', fontSize: 15, color: C.ink },
    progressTrack: {
      height: 7,
      backgroundColor: tone('#E4EDE5', 'background'),
      borderRadius: 5,
      overflow: 'hidden',
    },
    progressFill: { height: 7, borderRadius: 5, backgroundColor: C.primary },
    questionCount: { marginTop: -12, flexDirection: 'row', justifyContent: 'space-between' },
    questionCard: {
      padding: 26,
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 20,
      gap: 23,
    },
    passage: {
      backgroundColor: tone('#F3F7F2', 'background'),
      borderRadius: 13,
      padding: 20,
      gap: 12,
    },
    passageText: { fontFamily: 'Manrope', color: C.ink, fontSize: 14, lineHeight: 25 },
    questionPrompt: { fontFamily: 'ManropeSemiBold', fontSize: 15, lineHeight: 24, color: C.ink },
    questionSentence: { fontFamily: 'OutfitMedium', fontSize: 26, lineHeight: 35, color: C.ink },
    answers: { gap: 11 },
    option: {
      borderWidth: 1.3,
      borderColor: C.line,
      borderRadius: 12,
      minHeight: 59,
      paddingHorizontal: 14,
      paddingVertical: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    optionSelected: { borderColor: C.teal, backgroundColor: tone('#F0F8F2', 'background') },
    optionLetter: {
      borderWidth: 1,
      borderColor: tone('#D5E0D8', 'border'),
      borderRadius: 7,
      width: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionLetterSelected: { backgroundColor: C.primary, borderColor: C.teal },
    optionLetterText: { fontFamily: 'ManropeSemiBold', fontSize: 11, color: C.muted },
    optionText: {
      flex: 1,
      fontFamily: 'ManropeMedium',
      fontSize: 14,
      color: C.ink,
      lineHeight: 22,
    },
    textInput: {
      borderWidth: 1,
      borderColor: tone('#C9DBCE', 'border'),
      borderRadius: 11,
      paddingHorizontal: 17,
      paddingVertical: 17,
      minHeight: 56,
      color: C.ink,
      fontFamily: 'Manrope',
      fontSize: 15,
    },
    centerNote: {
      fontFamily: 'Manrope',
      fontSize: 11,
      lineHeight: 18,
      color: C.muted,
      textAlign: 'center',
    },
    exitBox: {
      gap: 16,
      padding: 20,
      backgroundColor: tone('#FFF6E9', 'background'),
      borderRadius: 15,
      borderWidth: 1,
      borderColor: tone('#EBD6B9', 'border'),
    },
    resultStats: { flexDirection: 'row', gap: 15, justifyContent: 'center' },
    resultStat: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
      backgroundColor: C.paper,
      paddingVertical: 20,
      paddingHorizontal: 7,
      borderRadius: 14,
    },
    feedbackList: { gap: 15 },
    feedbackItem: {
      flexDirection: 'row',
      gap: 11,
      borderBottomWidth: 1,
      borderBottomColor: C.line,
      paddingBottom: 14,
    },
    feedbackMarker: {
      width: 29,
      height: 29,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    feedbackText: { fontFamily: 'Manrope', fontSize: 12, lineHeight: 20, color: C.ink },
    accepted: { fontFamily: 'ManropeSemiBold', fontSize: 12, lineHeight: 19, color: C.teal },
  });
}
