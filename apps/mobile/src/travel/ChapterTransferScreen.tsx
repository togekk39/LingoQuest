import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { ArrowLeft, Download, RotateCw, TriangleAlert } from 'lucide-react-native';
import atlas from '../../assets/journal/atlas.jpg';
import atlasPortrait from '../../assets/journal/atlas-portrait.jpg';
import writing from '../../assets/journal/writing.jpg';
import writingPortrait from '../../assets/journal/writing-portrait.jpg';
import { JournalLeaf, PaperGrain } from '../Journal';
import { useTheme } from '../theme';
import { Button, Label, ProgressBar } from '../ui';

export type ChapterTransferFailure = { title: string; detail: string };

export function ChapterTransferBackdrop({ failed }: { failed: boolean }) {
  const { colors, mode } = useTheme();
  const { width, height } = useWindowDimensions();
  const portrait = height > width;
  const shortPortrait = portrait && width < 360 && height < 670;
  const portraitArtwork = failed ? writingPortrait : atlasPortrait;
  const landscapeArtwork = failed ? writing : atlas;
  return (
    <View
      testID="chapter-transfer-backdrop"
      pointerEvents="none"
      aria-hidden
      style={StyleSheet.absoluteFill}
    >
      {portrait && (
        <Image
          source={portraitArtwork}
          resizeMode="cover"
          blurRadius={28}
          style={styles.backdropImage}
        />
      )}
      <Image
        testID="chapter-transfer-artwork"
        source={portrait ? portraitArtwork : landscapeArtwork}
        resizeMode={portrait ? 'contain' : 'cover'}
        style={[styles.backdropImage, shortPortrait && styles.shortPortraitArtwork]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.paper, opacity: mode === 'light' ? 0.12 : 0.4 },
        ]}
      />
    </View>
  );
}

export function ChapterTransferScreen({
  title,
  percent,
  error,
  onRetry,
  onBack,
}: {
  title: string;
  percent?: number;
  error?: ChapterTransferFailure;
  onRetry: () => void;
  onBack: () => void;
}) {
  const { colors, tone } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const status =
    percent === undefined
      ? 'Preparando descarga…'
      : percent === 100
        ? 'Guardando capítulo…'
        : 'Descargando capítulo…';

  return (
    <JournalLeaf
      compact
      kind="notebook"
      style={[styles.card, compact && styles.compactCard, { borderColor: colors.line }]}
    >
      <PaperGrain />
      <View style={styles.eyebrow}>
        <Download size={15} color={colors.accent} />
        <Text style={[styles.section, { color: colors.accent }]}>Recursos sin conexión</Text>
      </View>
      <Text
        accessibilityRole="header"
        style={[styles.title, compact && styles.compactTitle, { color: colors.ink }]}
      >
        {title}
      </Text>
      {error ? (
        <>
          <View
            style={[styles.panel, { backgroundColor: tone('#FAECE2'), borderColor: colors.line }]}
          >
            <View style={styles.errorTitle}>
              <TriangleAlert size={19} color={colors.red} />
              <Text accessibilityRole="header" style={[styles.status, { color: colors.red }]}>
                {error.title}
              </Text>
            </View>
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
              style={[styles.detail, { color: colors.ink }]}
            >
              {error.detail}
            </Text>
          </View>
          <View style={styles.actions}>
            <Button icon={RotateCw} onPress={onRetry}>
              Reintentar
            </Button>
            <Button icon={ArrowLeft} variant="ghost" onPress={onBack}>
              Volver
            </Button>
          </View>
        </>
      ) : (
        <>
          <View style={[styles.panel, { backgroundColor: colors.mint, borderColor: colors.line }]}>
            <View style={styles.progressHeader}>
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.status, { color: colors.teal }]}
              >
                {status}
              </Text>
              {percent === undefined ? (
                <ActivityIndicator accessible={false} color={colors.teal} />
              ) : (
                <Text aria-hidden style={[styles.percent, { color: colors.teal }]}>
                  {percent}
                  {'\u00a0'}%
                </Text>
              )}
            </View>
            {percent !== undefined && (
              <ProgressBar
                value={percent / 100}
                height={8}
                accessibilityLabel="Descarga del capítulo"
              />
            )}
          </View>
          <Label style={styles.detail}>
            Podrás usar las lecciones, imágenes y audios sin conexión.
          </Label>
        </>
      )}
    </JournalLeaf>
  );
}

const styles = StyleSheet.create({
  backdropImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  shortPortraitArtwork: { height: '84%' },
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
    gap: 12,
  },
  compactCard: { padding: 14, gap: 9 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  section: {
    flexShrink: 1,
    fontFamily: 'ManropeBold',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: { fontFamily: 'LoraBold', fontSize: 30 },
  compactTitle: { fontSize: 25 },
  panel: { gap: 9, padding: 12, borderWidth: 1, borderRadius: 8 },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  errorTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { flexShrink: 1, fontFamily: 'ManropeBold', fontSize: 15 },
  percent: { fontFamily: 'ManropeBold', fontSize: 20, fontVariant: ['tabular-nums'] },
  detail: { fontFamily: 'Manrope', fontSize: 13, lineHeight: 21 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
