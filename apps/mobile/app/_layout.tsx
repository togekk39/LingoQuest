import { ThemeProvider, useTheme } from '../src/theme';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
function ThemedStack() {
  const { mode, colors } = useTheme();
  return (
    <>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} backgroundColor={colors.paper} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}
      />
    </>
  );
}
export default function Layout() {
  const [ready, error] = useFonts({
    Manrope: Manrope_400Regular,
    ManropeMedium: Manrope_500Medium,
    ManropeSemiBold: Manrope_600SemiBold,
    ManropeBold: Manrope_700Bold,
    ManropeExtraBold: Manrope_800ExtraBold,
    Outfit: Outfit_400Regular,
    OutfitMedium: Outfit_500Medium,
    OutfitSemiBold: Outfit_600SemiBold,
    OutfitBold: Outfit_700Bold,
  });
  if (!ready && !error) return null;
  return (
    <ThemeProvider>
      <ThemedStack />
    </ThemeProvider>
  );
}
