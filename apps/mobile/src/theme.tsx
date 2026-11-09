import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { getRaw, putRaw } from './lib/storage';

export type ThemeMode = 'light' | 'dark' | 'oled';
export const THEME_KEY = 'lq_theme';
const light = {
  ink: '#173F43',
  teal: '#167D72',
  primary: '#167D72',
  onPrimary: '#FFFFFF',
  mint: '#DCF3E9',
  orange: '#EFA055',
  paper: '#F7FAF7',
  muted: '#6F8380',
  line: '#E3EBE5',
  white: '#FFFFFF',
  red: '#B84B50',
  coral: '#C96867',
};
export type ThemeColors = typeof light;
const palettes: Record<ThemeMode, ThemeColors> = {
  light,
  dark: {
    ...light,
    ink: '#E5F2EC',
    teal: '#79D9C3',
    mint: '#193B34',
    paper: '#101A19',
    muted: '#A8BBB4',
    line: '#354742',
    white: '#1A2825',
    red: '#FFAAA9',
    coral: '#F5A5A3',
  },
  oled: {
    ...light,
    ink: '#F0F7F3',
    teal: '#79D9C3',
    mint: '#092B21',
    paper: '#000000',
    muted: '#A8BBB4',
    line: '#333D38',
    white: '#000000',
    red: '#FFAAA9',
    coral: '#F5A5A3',
  },
};
function validMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'oled';
}
function makeTheme(mode: ThemeMode) {
  const colors = palettes[mode];
  // Preserve authored light colors; adapt their semantic role for dark surfaces.
  const tone = (value: string, role: 'background' | 'text' | 'border' = 'background') => {
    if (mode === 'light' || (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value) && value !== 'white'))
      return value;
    const hex = value === 'white' ? 'ffffff' : value.slice(1);
    const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const brightness = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / 255;
    if (role === 'border') return colors.line;
    if (role === 'text')
      return brightness > 0.93 ? value : brightness < 0.42 ? colors.ink : colors.muted;
    if (brightness < 0.65) return value;
    if (brightness > 0.97) return colors.white;
    return colors.mint;
  };
  return { mode, colors, tone };
}
const themes = { light: makeTheme('light'), dark: makeTheme('dark'), oled: makeTheme('oled') };
const ThemeContext = createContext({
  ...themes.light,
  setMode: (_mode: ThemeMode) => {},
  error: '',
});
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setTheme] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    void getRaw(THEME_KEY)
      .then((value) => {
        if (active && validMode(value)) setTheme(value);
      })
      .catch(() => {
        if (active) setError('No pudimos leer el tema guardado.');
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    document.documentElement.style.backgroundColor = palettes[mode].paper;
    document.documentElement.style.colorScheme = mode === 'light' ? 'light' : 'dark';
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.append(meta);
    }
    meta.content = palettes[mode].paper;
  }, [mode]);
  const setMode = (next: ThemeMode) => {
    setTheme(next);
    setError('');
    writes.current = writes.current
      .then(() => putRaw(THEME_KEY, next))
      .catch(() => {
        setError('El tema cambió, pero no pudimos guardarlo en este dispositivo.');
      });
  };
  if (!ready) return null;
  return (
    <ThemeContext.Provider value={{ ...themes[mode], setMode, error }}>
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
