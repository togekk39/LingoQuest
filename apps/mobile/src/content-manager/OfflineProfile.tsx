import { ThemePicker } from '../ThemePicker';
import { useTheme } from '../theme';
import { useReducedMotion } from '../motion';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Switch, Modal, StyleSheet } from 'react-native';
import {
  BookOpen,
  Zap,
  Flame,
  Check,
  Compass,
  ShieldCheck,
  Download,
  Trash2,
} from 'lucide-react-native';
import { api, type Progress } from '../lib/api';
import { Button, Card, Heading, Label, Pill, ProgressBar } from '../ui';
import { pickTextFile, saveTextFile } from '../lib/localFiles';
import { ContentManager } from './ContentManager';
const dimensionLabels = {
  vocabulary_recognition: 'Reconocer palabras',
  vocabulary_recall: 'Recordar palabras',
  grammar_understanding: 'Entender la estructura',
  grammar_production: 'Usar la estructura',
};
export function OfflineProfile({
  progress,
  onRefresh,
  onNotice,
  onPlacement,
}: {
  progress: Progress;
  onRefresh: () => Promise<void>;
  onNotice: (message: string) => void;
  onPlacement: () => void;
}) {
  const { colors: C } = useTheme();
  const reducedMotion = useReducedMotion();
  const s = useStyles();

  const [name, setName] = useState(progress.user.name);
  const [goal, setGoal] = useState(progress.user.goalMinutes || 10);
  const [reduced, setReduced] = useState(progress.user.reducedMotion || false);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [targetLabels, setTargetLabels] = useState<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    void api<{ reviews: { key: string; targetLabelEs: string }[] }>('/v1/reviews/today?all=true')
      .then(({ reviews }) => {
        if (active)
          setTargetLabels(Object.fromEntries(reviews.map((r) => [r.key, r.targetLabelEs])));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [progress.mastery]);
  useEffect(() => {
    setName(progress.user.name);
    setGoal(progress.user.goalMinutes || 10);
    setReduced(progress.user.reducedMotion || false);
  }, [progress.user.name, progress.user.goalMinutes, progress.user.reducedMotion]);
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar los cambios.');
    } finally {
      setBusy(false);
    }
  }
  const save = () =>
    void run(async () => {
      await api('/v1/me/settings', {
        name: name.trim() || 'Explorador',
        goalMinutes: goal,
        reducedMotion: reduced,
      });
      await onRefresh();
      onNotice('Preferencias guardadas en este dispositivo.');
    });
  return (
    <View style={{ maxWidth: 920, gap: 24 }}>
      <View>
        <Text style={s.eyebrow}>CADA PASO CUENTA</Text>
        <Heading style={{ fontSize: 32, marginTop: 7 }}>Tu historia hasta aquí</Heading>
        <Label>Tu camino vive en este dispositivo. No necesitas una cuenta.</Label>
      </View>
      <Card>
        <ThemePicker />
      </Card>
      <Card>
        <View style={[s.row, { gap: 17 }]}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{progress.user.name?.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Heading>{progress.user.name}</Heading>
            <Label>Perfil local · Inglés A1–A2</Label>
          </View>
          <Pill>SIN CONEXIÓN</Pill>
        </View>
        <View style={s.statsGrid}>
          {[
            {
              value: progress.completedLessons.length,
              label: 'Lecciones completadas',
              icon: BookOpen,
            },
            { value: progress.xp, label: 'XP de aprendizaje', icon: Zap },
            { value: progress.streak, label: 'Días consecutivos', icon: Flame },
          ].map(({ value, label, icon: Icon }) => (
            <View key={label} style={s.profileStat}>
              <Icon size={18} color={C.teal} />
              <Text style={s.statNumber}>{value}</Text>
              <Label style={{ fontSize: 10, textAlign: 'center' }}>{label}</Label>
            </View>
          ))}
        </View>
        <Label style={{ fontSize: 11 }}>
          Las lecciones y los XP muestran tu práctica. La retención se construye con repasos en
          distintos días. Los desafíos guardan sus propios resultados.
        </Label>
      </Card>
      <ContentManager onRefresh={onRefresh} onNotice={onNotice} />
      <Card>
        <Heading style={{ fontSize: 22 }}>A tu manera</Heading>
        <Label style={{ marginTop: 17 }}>Tu nombre</Label>
        <TextInput
          accessibilityLabel="Tu nombre"
          value={name}
          onChangeText={setName}
          maxLength={40}
          style={s.input}
        />
        <Label style={{ marginTop: 20 }}>Tu intención diaria · un recordatorio amable</Label>
        <View style={[s.row, { marginTop: 12, marginBottom: 23 }]}>
          {([5, 10, 15] as const).map((n) => (
            <Pressable
              key={n}
              onPress={() => setGoal(n)}
              style={[s.goalOption, goal === n && s.optionActive]}
            >
              <Text style={s.optionText}>{n} min</Text>
            </Pressable>
          ))}
        </View>
        <View style={[s.row, { justifyContent: 'space-between', marginBottom: 23 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Reducir movimiento</Text>
            <Label style={{ fontSize: 11 }}>Una experiencia más tranquila.</Label>
          </View>
          <Switch
            accessibilityLabel="Reducir movimiento"
            value={reduced}
            onValueChange={setReduced}
            trackColor={{ true: C.teal, false: C.line }}
          />
        </View>
        <Button loading={busy} onPress={save} icon={Check}>
          Guardar preferencias
        </Button>
      </Card>
      <Card>
        <Heading style={{ fontSize: 22 }}>Lo que estás construyendo</Heading>
        {progress.mastery.length ? (
          progress.mastery.map((m) => (
            <View key={`${m.dimension}:${m.targetId}`} style={{ marginTop: 18 }}>
              <View style={[s.row, { justifyContent: 'space-between' }]}>
                <Text style={s.title}>
                  {targetLabels[`${m.dimension}:${m.targetId}`] ?? 'Práctica en contexto'}
                </Text>
                <Label style={{ fontSize: 10 }}>
                  {Math.round(m.value * 100)}% · Evidencia de práctica
                </Label>
              </View>
              <Label style={{ fontSize: 11 }}>
                {m.dimension ? dimensionLabels[m.dimension] : 'Práctica en contexto'}
              </Label>
              <ProgressBar value={m.value} />
            </View>
          ))
        ) : (
          <Label style={{ marginVertical: 16 }}>
            Tu mapa de habilidades aparecerá después de las primeras prácticas.
          </Label>
        )}
        <Button variant="ghost" icon={Compass} onPress={onPlacement}>
          Explorar mi nivel sin presión
        </Button>
      </Card>
      <Card>
        <View style={s.row}>
          <ShieldCheck color={C.teal} size={23} />
          <Heading style={{ fontSize: 22 }}>Tus datos te pertenecen</Heading>
        </View>
        <Label style={{ marginVertical: 15 }}>
          Todo tu aprendizaje se guarda en este dispositivo. No se envían respuestas ni grabaciones
          a servicios externos. El micrófono es opcional y tus grabaciones se eliminan al salir de
          la práctica. Guarda un respaldo para cambiar de teléfono o antes de desinstalar la app.
        </Label>
        <View style={{ gap: 12 }}>
          <Button
            variant="secondary"
            icon={Download}
            loading={busy}
            onPress={() =>
              void run(async () => {
                const backup = await api('/v1/me/export');
                await saveTextFile('lingoquest-respaldo.json', JSON.stringify(backup, null, 2));
                setMessage('Respaldo exportado. Guárdalo en un lugar que puedas recuperar.');
                onNotice('Respaldo listo.');
              })
            }
          >
            Exportar mis datos
          </Button>
          <Button
            variant="secondary"
            loading={busy}
            onPress={() =>
              void run(async () => {
                const text = await pickTextFile('Restaurar respaldo');
                if (text === null) return;
                let backup: any;
                try {
                  backup = JSON.parse(text);
                } catch {
                  throw new Error('El archivo no es un respaldo JSON válido.');
                }
                if (backup?.format !== 'lingoquest-backup' || backup?.formatVersion !== 2)
                  throw new Error(
                    'Selecciona un respaldo del curso integrado (formato 2). Los respaldos del prototipo anterior no son compatibles.',
                  );
                setPendingBackup(backup);
              })
            }
          >
            Restaurar respaldo
          </Button>
          <Button variant="danger" icon={Trash2} onPress={() => setConfirmReset(true)}>
            Borrar progreso local
          </Button>
        </View>
        {!!message && <Label style={{ marginTop: 14, color: C.teal }}>{message}</Label>}
        {!!error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
      </Card>
      <Modal
        visible={confirmReset || pendingBackup !== null}
        transparent
        animationType={reducedMotion ? 'none' : 'fade'}
        onRequestClose={() => {
          setConfirmReset(false);
          setPendingBackup(null);
        }}
      >
        <View style={s.modal}>
          <Card style={{ width: '100%', maxWidth: 480 }}>
            <Heading>
              {confirmReset ? '¿Borrar tu progreso local?' : '¿Restaurar este respaldo?'}
            </Heading>
            <Label style={{ marginVertical: 20 }}>
              {confirmReset
                ? 'Se borrarán de este dispositivo tu perfil, respuestas, XP y resultados de desafíos. Los cursos instalados se conservan. Exporta un respaldo antes de continuar.'
                : 'Se reemplazará tu progreso actual por el del respaldo. Los cursos instalados no cambian. Guarda una copia de tu progreso actual si deseas conservarlo.'}
            </Label>
            {!!pendingBackup && (
              <Pill>
                RESPALDO LOCAL ·{' '}
                {String(pendingBackup.state?.user?.name || 'LingoQuest').slice(0, 40)}
              </Pill>
            )}
            <Button
              variant={confirmReset ? 'danger' : 'primary'}
              loading={busy}
              style={{ marginTop: 16 }}
              onPress={() =>
                void run(async () => {
                  if (confirmReset) await api('/v1/me', undefined, 'DELETE');
                  else await api('/v1/me/import', { backup: pendingBackup });
                  await onRefresh();
                  setConfirmReset(false);
                  setPendingBackup(null);
                  setMessage(
                    confirmReset
                      ? 'Progreso local borrado. El curso sigue instalado.'
                      : 'Respaldo restaurado en este dispositivo.',
                  );
                  onNotice(confirmReset ? 'Progreso local borrado.' : 'Respaldo restaurado.');
                })
              }
            >
              {confirmReset
                ? 'Borrar progreso de este dispositivo'
                : 'Reemplazar con este respaldo'}
            </Button>
            <Button
              variant="ghost"
              onPress={() => {
                setConfirmReset(false);
                setPendingBackup(null);
              }}
            >
              Conservar mi progreso actual
            </Button>
            {!!error && (
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
            )}
          </Card>
        </View>
      </Modal>
    </View>
  );
}
export function useStyles() {
  const { colors: C, tone } = useTheme();
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eyebrow: {
      fontFamily: 'ManropeBold',
      fontSize: 9,
      letterSpacing: 1.1,
      color: tone('#789583', 'text'),
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 22,
      backgroundColor: tone('#E9EEDF', 'background'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontFamily: 'OutfitMedium', fontSize: 26, color: tone('#69805F', 'text') },
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
    title: { fontFamily: 'ManropeBold', fontSize: 12, color: C.ink },
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
    error: { fontFamily: 'Manrope', fontSize: 12, color: C.red, marginTop: 15 },
    modal: {
      flex: 1,
      backgroundColor: '#122D3977',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
  });
}
