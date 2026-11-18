import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { getRaw, putRaw } from './lib/storage';

export type ThemeMode = 'light' | 'dark' | 'oled';
export const THEME_KEY = 'lq_theme';
const light = {
  ink: '#23382D',
  teal: '#395E4B',
  primary: '#913D2A',
  onPrimary: '#FFF9EE',
  mint: '#E8E9D9',
  orange: '#C4773E',
  paper: '#F5EBDD',
  muted: '#60554A',
  line: '#D8C4AA',
  white: '#FFFAF0',
  red: '#9D3E29',
  coral: '#A85436',
  accent: '#92502D',
  gold: '#D9AA6B',
};
export type ThemeColors = typeof light;
const palettes: Record<ThemeMode, ThemeColors> = {
  light,
  dark: {
    ...light,
    ink: '#FFF0DA',
    teal: '#B6CCAE',
    primary: '#A6482F',
    mint: '#31382C',
    paper: '#19271F',
    muted: '#D5C2A8',
    line: '#645543',
    white: '#26342A',
    accent: '#F3B583',
    red: '#FFAAA9',
    coral: '#F5A5A3',
  },
  oled: {
    ...light,
    ink: '#FFF3E0',
    teal: '#B6CCAE',
    primary: '#A6482F',
    mint: '#1B231A',
    accent: '#F3B583',
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
