import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BriefcaseBusiness, CheckCheck, MessageCircle, Plane, Volume2 } from 'lucide-react-native';
import { stopOfflineSpeech, useOfflineSpeech } from './offlineSpeech';
import { api } from '../lib/api';
import { Action, ErrorCard, f, FlowFrame, palette } from './FeatureUI';
interface MissionStep {
  id: string;
  speaker: string;
  promptEn: string;
  hintEs: string;
  options: { id: string; text: string; nextStepId?: string }[];
}
interface Mission {
  id: string;
  titleEs: string;
  descriptionEs: string;
  steps: MissionStep[];
}
interface Exchange {
  prompt: string;
  response: string;
  speaker: string;
}
export default function MissionsFlow({
  missionId,
  onClose,
}: {
  missionId?: string;
  onClose: () => void;
}) {
  const { playOffline, speechMessage } = useOfflineSpeech();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selected, setSelected] = useState<Mission | null>(null);
  const [step, setStep] = useState<MissionStep | null>(null);
  const [history, setHistory] = useState<Exchange[]>([]);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await api<{ missions: Mission[] }>('/v1/missions');
      setMissions(response.missions);
      if (missionId)
        setSelected(
          response.missions.find(
            (m) => m.id === missionId || (missionId === 'job' && m.id === 'interview'),
          ) ??
            response.missions[0] ??
            null,
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos preparar tus misiones.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    return () => {
      void stopOfflineSpeech();
    };
  }, [missionId]);
  function start(mission: Mission) {
    setSelected(mission);
    setStep(mission.steps[0] ?? null);
    setHistory([]);
    setDone(false);
    setStarted(true);
  }
  function respond(option: MissionStep['options'][number]) {
    if (!step || !selected) return;
    setHistory([
      ...history,
      { speaker: step.speaker, prompt: step.promptEn, response: option.text },
    ]);
    const next = selected.steps.find((item) => item.id === option.nextStepId);
    if (next) {
      setStep(next);
      if (!next.options.length) setDone(true);
    } else {
      setStep(null);
      setDone(true);
    }
  }
  return (
    <FlowFrame
      title={selected?.titleEs ?? 'Inglés que sale al mundo'}
      eyebrow="Misiones de la vida real"
      onClose={onClose}
      progress={
        selected && started ? (done ? 1 : history.length / selected.steps.length) : undefined
      }
      footer={
        done ? (
          <Action onPress={onClose}>Volver a aprender</Action>
        ) : selected && !started ? (
          <Action onPress={() => start(selected)}>Empezar la conversación</Action>
        ) : undefined
      }
    >
      {!!speechMessage && (
        <Text accessibilityRole="alert" style={f.quiet}>
          {speechMessage}
        </Text>
      )}
      {loading && <ActivityIndicator color={palette.teal} size="large" />}
      {!!error && (
        <ErrorCard
          message={error}
          onRetry={() => {
            void load();
          }}
        />
      )}
      {!loading && !selected && (
        <>
          <Text style={f.title}>Pequeñas conversaciones. Grandes posibilidades.</Text>
          <Text style={f.body}>
            Practica situaciones cotidianas con opciones que te ayudan a expresarte. No necesitas
            micrófono y puedes volver a empezar.
          </Text>
          {missions.map((mission) => (
            <Pressable
              key={mission.id}
              accessibilityRole="button"
              onPress={() => setSelected(mission)}
              style={f.card}
            >
              <View style={f.row}>
                {mission.id === 'airport' ? (
                  <Plane size={26} color={palette.teal} />
                ) : (
                  <BriefcaseBusiness size={26} color={palette.teal} />
                )}
                <Text style={f.cardTitle}>{mission.titleEs}</Text>
              </View>
              <Text style={f.body}>{mission.descriptionEs}</Text>
              <Text style={s.link}>Explorar misión →</Text>
            </Pressable>
          ))}
        </>
      )}
      {selected && !started && (
        <>
          <View style={s.icon}>
            {selected.id === 'airport' ? (
              <Plane size={38} color={palette.teal} />
            ) : (
              <BriefcaseBusiness size={38} color={palette.teal} />
            )}
          </View>
          <Text style={f.title}>{selected.titleEs}</Text>
          <Text style={f.body}>{selected.descriptionEs}</Text>
          <View style={f.card}>
            <Text style={f.cardTitle}>Tú eliges cómo responder.</Text>
            <Text style={f.body}>
              Lee lo que dice la otra persona y elige una frase para continuar. Todas las opciones
              son práctica: sin puntajes ni penalizaciones.
            </Text>
            <Text style={f.quiet}>
              Conversación guiada · No es un chat con inteligencia artificial.
            </Text>
          </View>
        </>
      )}
      {started &&
        history.map((exchange, index) => (
          <View key={index} style={{ gap: 11 }}>
            <View style={s.promptBubble}>
              <Text style={f.eyebrow}>{exchange.speaker}</Text>
              <Text style={s.promptText}>{exchange.prompt}</Text>
            </View>
            <View style={s.replyBubble}>
              <Text style={s.replyText}>{exchange.response}</Text>
            </View>
          </View>
        ))}
      {started && step && (
        <>
          <View style={s.promptBubble}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={f.eyebrow}>{step.speaker}</Text>
              <Pressable
                accessibilityLabel="Escuchar conversación"
                accessibilityRole="button"
                style={s.sound}
                onPress={() => {
                  void playOffline(step.promptEn);
                }}
              >
                <Volume2 color={palette.teal} size={19} />
              </Pressable>
            </View>
            <Text style={s.promptText}>{step.promptEn}</Text>
            <Text style={f.quiet}>{step.hintEs}</Text>
          </View>
          {step.options.length > 0 && <Text style={f.eyebrow}>¿Qué te gustaría decir?</Text>}
          <View style={{ gap: 11 }}>
            {step.options.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => respond(option)}
                accessibilityRole="button"
                style={s.option}
              >
                <MessageCircle color={palette.teal} size={20} />
                <Text style={s.optionText}>{option.text}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
      {done && (
        <View style={[f.card, { backgroundColor: '#ECF6ED', borderColor: '#C4DECA' }]}>
          <CheckCheck color={palette.teal} size={31} />
          <Text style={f.cardTitle}>¡Acabas de usar tu inglés!</Text>
          <Text style={f.body}>
            Una conversación empieza con una frase. Cuando quieras, vuelve y prueba otras maneras de
            responder.
          </Text>
          <Action secondary onPress={() => selected && start(selected)}>
            Practicar otra vez
          </Action>
        </View>
      )}
    </FlowFrame>
  );
}
const s = StyleSheet.create({
  icon: {
    width: 84,
    height: 84,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.mint,
  },
  link: { fontFamily: 'Manrope', fontWeight: '700', color: palette.teal, fontSize: 13 },
  promptBubble: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 21,
    borderBottomLeftRadius: 4,
    padding: 23,
    gap: 12,
    marginRight: 30,
  },
  promptText: { fontFamily: 'Outfit', fontSize: 23, lineHeight: 31, color: palette.ink },
  replyBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#E3F0E7',
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingVertical: 17,
    paddingHorizontal: 22,
    marginLeft: 40,
  },
  replyText: { fontFamily: 'Manrope', fontSize: 15, color: palette.teal, lineHeight: 23 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#CCDDD2',
    borderRadius: 15,
    padding: 19,
    minHeight: 58,
  },
  optionText: { fontFamily: 'Manrope', fontSize: 15, color: palette.ink, flex: 1, lineHeight: 24 },
  sound: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F7EF',
  },
});

export { MissionsFlow };
