import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ArrowLeft, Download, RotateCw, TriangleAlert } from 'lucide-react-native';
import atlas from '../../assets/journal/atlas.jpg';
import writing from '../../assets/journal/writing.jpg';
import { JournalArt, JournalLeaf, PaperGrain } from '../Journal';
import { useTheme } from '../theme';
import { Button, Label, ProgressBar } from '../ui';

export type ChapterTransferFailure = { title: string; detail: string };

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
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 760 && fontScale <= 1.25;
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
      style={[
        styles.card,
        wide && styles.spread,
        { borderColor: colors.line, backgroundColor: colors.white },
      ]}
    >
      <PaperGrain />
      <View style={wide && styles.artColumn}>
        <JournalArt source={error ? writing : atlas} aspectRatio={wide ? 1.08 : 1.52} taped />
      </View>
      <View style={[styles.body, wide && styles.bodyColumn]}>
        <View style={styles.eyebrow}>
          <Download size={15} color={colors.accent} />
          <Text style={[styles.section, { color: colors.accent }]}>Recursos sin conexión</Text>
        </View>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
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
            <View
              style={[styles.panel, { backgroundColor: colors.mint, borderColor: colors.line }]}
            >
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
                    {percent} %
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
      </View>
    </JournalLeaf>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 540,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 20,
  },
  spread: {
    maxWidth: 900,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 28,
  },
  artColumn: { flex: 1, minWidth: 0 },
  body: { gap: 12 },
  bodyColumn: { flex: 1, minWidth: 0 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  section: {
    flexShrink: 1,
    fontFamily: 'ManropeBold',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: { fontFamily: 'LoraBold', fontSize: 30 },
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
