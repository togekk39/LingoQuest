import { useTheme } from '../theme';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Button, Heading, Label } from '../ui';
import {
  getOfflineVoices,
  getSpeechPreferences,
  saveSpeechPreferences,
  previewOfflineSpeech,
  stopOfflineSpeech,
  OFFLINE_AUDIO_NOTICE,
} from './offlineSpeech';
import { openDeviceSpeechSettings } from './tts/deviceSpeech';
import { DEFAULT_SPEECH_PREFERENCES, type OfflineVoice, type SpeechPreferences } from './tts/types';

export function SpeechSettings() {
  const { colors: C } = useTheme();
  const [preferences, setPreferences] = useState<SpeechPreferences>(DEFAULT_SPEECH_PREFERENCES);
  const [voices, setVoices] = useState<OfflineVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const refreshVoices = useCallback(async () => {
    try {
      setVoices(await getOfflineVoices());
      setError('');
    } catch {
      setError(OFFLINE_AUDIO_NOTICE);
    }
  }, []);
  useEffect(() => {
    let active = true;
    void Promise.allSettled([getSpeechPreferences(), getOfflineVoices()]).then(
      ([saved, available]) => {
        if (!active) return;
        if (saved.status === 'fulfilled') setPreferences(saved.value);
        if (available.status === 'fulfilled') setVoices(available.value);
        else setError(OFFLINE_AUDIO_NOTICE);
        setLoading(false);
      },
    );
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshVoices();
    });
    return () => {
      active = false;
      subscription.remove();
      void stopOfflineSpeech();
    };
  }, [refreshVoices]);
  async function save() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await stopOfflineSpeech();
      await saveSpeechPreferences(preferences);
      setMessage('Configuración de voz guardada en este dispositivo.');
    } catch {
      setError('No pudimos guardar la configuración. Vuelve a intentarlo.');
    } finally {
      setBusy(false);
    }
  }
  async function preview() {
    setPreviewing(true);
    setError('');
    setMessage('');
    try {
      await previewOfflineSpeech('Hello! Let’s practice English together.', preferences, setError);
    } finally {
      setPreviewing(false);
    }
  }
  function choose(change: Partial<SpeechPreferences>) {
    void stopOfflineSpeech();
    setPreferences((current) => ({ ...current, ...change }));
    setMessage('');
    setError('');
  }
  if (loading) return <ActivityIndicator color={C.teal} accessibilityLabel="Cargando voces" />;
  const missingVoice =
    preferences.voice && !voices.some((voice) => voice.identifier === preferences.voice);
  return (
    <View style={{ gap: 12 }}>
      <Heading style={{ fontSize: 22 }}>Pronunciación sin conexión</Heading>
      <Label>
        Usamos el TTS del sistema y preferimos su voz de inglés sin conexión. Si no está disponible,
        buscamos otra voz de inglés instalada. Puedes elegir la voz y la velocidad para todas las
        prácticas.
      </Label>
      <ScrollView style={{ maxHeight: 190 }} nestedScrollEnabled>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Voz de pronunciación"
          style={{ gap: 8 }}
        >
          {[{ identifier: null, name: 'Predeterminada del sistema', language: '' }, ...voices].map(
            (voice) => {
              const selected = preferences.voice === voice.identifier;
              return (
                <Pressable
                  key={voice.identifier ?? 'system'}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: busy }}
                  aria-checked={selected}
                  disabled={busy}
                  onPress={() => choose({ voice: voice.identifier })}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: selected ? C.mint : C.paper,
                    borderWidth: 1,
                    borderColor: selected ? C.teal : C.line,
                  }}
                >
                  <Text style={{ color: C.ink, fontFamily: 'ManropeBold', fontSize: 12 }}>
                    {voice.name}
                    {voice.language ? ` · ${voice.language}` : ''}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>
      </ScrollView>
      {(!voices.length || missingVoice) && (
        <Text accessibilityRole="alert" style={{ color: C.red, fontSize: 12 }}>
          {missingVoice
            ? 'La voz guardada ya no está disponible. Elige otra voz o vuelve a la predeterminada.'
            : OFFLINE_AUDIO_NOTICE}
        </Text>
      )}
      <Label>Velocidad de pronunciación</Label>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Velocidad de pronunciación"
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
      >
        {[
          { value: null, label: 'Del sistema' },
          { value: 0.75, label: '0.75×' },
          { value: 1, label: '1×' },
          { value: 1.25, label: '1.25×' },
        ].map(({ value, label }) => (
          <Pressable
            key={label}
            accessibilityRole="radio"
            accessibilityLabel={`Velocidad ${label}`}
            accessibilityState={{ checked: preferences.rate === value, disabled: busy }}
            aria-checked={preferences.rate === value}
            disabled={busy}
            onPress={() => choose({ rate: value })}
            style={{
              padding: 12,
              borderRadius: 10,
              backgroundColor: preferences.rate === value ? C.mint : C.paper,
            }}
          >
            <Text style={{ color: C.teal, fontFamily: 'ManropeBold', fontSize: 12 }}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: C.red }}>
          {error}
        </Text>
      )}
      {!!message && <Label>{message}</Label>}
      <Button onPress={() => void save()} loading={busy}>
        Guardar configuración de voz
      </Button>
      <Button
        variant="secondary"
        disabled={busy || !voices.length || !!missingVoice}
        onPress={() => {
          void (previewing ? stopOfflineSpeech() : preview());
        }}
      >
        {previewing ? 'Detener prueba de voz' : 'Probar voz'}
      </Button>
      <Button variant="ghost" disabled={busy} onPress={() => void refreshVoices()}>
        Actualizar voces instaladas
      </Button>
      {Platform.OS === 'android' ? (
        <Button
          variant="ghost"
          onPress={() =>
            void openDeviceSpeechSettings().catch(() =>
              setError(
                'No pudimos abrir los ajustes TTS. Ábrelos desde los ajustes de tu dispositivo.',
              ),
            )
          }
        >
          Abrir ajustes TTS del sistema
        </Button>
      ) : (
        <Label style={{ fontSize: 11 }}>
          Para instalar voces sin conexión, abre los ajustes de voz de tu dispositivo y luego
          actualiza esta lista.
        </Label>
      )}
    </View>
  );
}
