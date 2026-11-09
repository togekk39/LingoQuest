import React, { useState } from 'react';
import { Modal, Pressable, Text, View, ScrollView } from 'react-native';
import { Check, Moon, Sun, X, Eclipse } from 'lucide-react-native';
import { useTheme, type ThemeMode } from './theme';

const options: { id: ThemeMode; label: string; detail: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Claro', detail: 'Fondo claro y colores suaves', icon: Sun },
  { id: 'dark', label: 'Oscuro', detail: 'Tonos oscuros para poca luz', icon: Moon },
  { id: 'oled', label: 'Negro OLED', detail: 'Fondo negro puro (#000000)', icon: Eclipse },
];
export function ThemePicker() {
  const { mode, colors: C, setMode, error } = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: C.ink, fontFamily: 'OutfitSemiBold', fontSize: 23 }}>Apariencia</Text>
      <Text style={{ color: C.muted, fontFamily: 'Manrope', lineHeight: 22 }}>
        Elige el tema. Se guarda en este dispositivo.
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Tema de la aplicación"
        style={{ gap: 10 }}
      >
        {options.map(({ id, label, detail, icon: Icon }) => (
          <Pressable
            key={id}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ checked: mode === id }}
            aria-checked={mode === id}
            onPress={() => setMode(id)}
            style={({ pressed }) => ({
              minHeight: 68,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: mode === id ? C.teal : C.line,
              backgroundColor: mode === id ? C.mint : C.white,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Icon size={22} color={C.teal} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.ink, fontFamily: 'ManropeBold', fontSize: 14 }}>{label}</Text>
              <Text style={{ color: C.muted, fontFamily: 'Manrope', fontSize: 12, marginTop: 4 }}>
                {detail}
              </Text>
            </View>
            {mode === id && <Check size={20} color={C.teal} />}
          </Pressable>
        ))}
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: C.red }}>
          {error}
        </Text>
      )}
    </View>
  );
}
export function ThemeButton() {
  const { mode, colors: C } = useTheme();
  const [open, setOpen] = useState(false);
  const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Eclipse;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cambiar tema"
        onPress={() => setOpen(true)}
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: C.line,
        }}
      >
        <Icon size={20} color={C.teal} />
      </Pressable>
      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#00000099',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <ScrollView
            style={{ maxHeight: '90%', width: '100%', maxWidth: 430 }}
            contentContainerStyle={{
              padding: 24,
              borderRadius: 20,
              backgroundColor: C.white,
              borderWidth: 1,
              borderColor: C.line,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar apariencia"
              onPress={() => setOpen(false)}
              style={{
                minWidth: 44,
                minHeight: 44,
                alignSelf: 'flex-end',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X color={C.ink} size={22} />
            </Pressable>
            <ThemePicker />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
