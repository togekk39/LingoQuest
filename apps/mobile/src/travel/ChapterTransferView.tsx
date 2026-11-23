import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ArrowLeft, CloudDownload, RotateCw, TriangleAlert } from 'lucide-react-native';
import atlas from '../../assets/journal/atlas.jpg';
import welcomeDesk from '../../assets/journal/welcome-desk.jpg';
import { JournalArt, JournalLeaf, PaperGrain } from '../Journal';
import { useTheme } from '../theme';
import { Button, Label } from '../ui';

export function ChapterTransferView({
  title,
  firstChapter,
  percent,
  error,
  onRetry,
  onBack,
}: {
  title: string;
  firstChapter: boolean;
  percent?: number;
  error?: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  const { colors } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 760 && fontScale < 1.35;
  const phase =
    percent === undefined
      ? 'Preparando el capítulo…'
      : percent === 100
        ? 'Verificando y guardando…'
        : 'Descargando capítulo…';

  return (
    <View style={[styles.postcard, wide && styles.widePostcard]}>
      <View style={wide ? styles.wideArtwork : undefined}>
        <JournalArt
          source={firstChapter ? welcomeDesk : atlas}
          aspectRatio={wide ? 1.15 : 1.75}
          taped
        />
      </View>
      <JournalLeaf kind="notebook" style={[styles.sheet, wide && styles.wideSheet]}>
        <PaperGrain opacity={0.28} />
        <View style={styles.eyebrow}>
          <CloudDownload color={colors.teal} size={20} strokeWidth={1.7} />
          <Text style={[styles.eyebrowText, { color: colors.teal }]}>Paquete sin conexión</Text>
        </View>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
          {title}
        </Text>
        {error ? (
          <>
            <View
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={[styles.notice, { borderColor: colors.red, backgroundColor: colors.paper }]}
            >
              <TriangleAlert color={colors.red} size={21} style={styles.noticeIcon} />
              <View style={styles.noticeText}>
                <Text style={[styles.errorTitle, { color: colors.red }]}>
                  No pudimos preparar el capítulo
                </Text>
                <Label style={styles.detail}>{error}</Label>
              </View>
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
            <View style={[styles.progress, { borderColor: colors.line }]}>
              <View style={styles.progressHeading}>
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.phase, { color: colors.ink }]}
                >
                  {phase}
                </Text>
                {percent === undefined ? (
                  <ActivityIndicator color={colors.teal} />
                ) : (
                  <Text
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    aria-hidden
                    style={[styles.percent, { color: colors.teal }]}
                  >
                    {percent} %
                  </Text>
                )}
              </View>
              {percent !== undefined && (
                <View
                  accessible
                  accessibilityRole="progressbar"
                  accessibilityLabel="Descarga del capítulo"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  style={[styles.track, { backgroundColor: colors.mint }]}
                >
                  <View
                    style={[styles.fill, { width: `${percent}%`, backgroundColor: colors.teal }]}
                  />
                </View>
              )}
            </View>
            <Label style={[styles.detail, { color: colors.muted }]}>
              Las lecciones, las ilustraciones y el audio estarán disponibles sin internet.
            </Label>
          </>
        )}
      </JournalLeaf>
    </View>
  );
}

const styles = StyleSheet.create({
  postcard: { width: '100%', maxWidth: 780, alignSelf: 'center', gap: 18, paddingVertical: 8 },
  widePostcard: { flexDirection: 'row', alignItems: 'center', gap: 22, paddingVertical: 18 },
  wideArtwork: { flex: 0.95, minWidth: 0 },
  sheet: { gap: 14, padding: 18 },
  wideSheet: { flex: 1, minWidth: 0, padding: 22 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrowText: { flex: 1, fontFamily: 'ManropeBold', fontSize: 13, letterSpacing: 0.5 },
  title: { fontFamily: 'LoraBold', fontSize: 30 },
  progress: { gap: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14 },
  progressHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  phase: { flexShrink: 1, fontFamily: 'ManropeBold', fontSize: 15 },
  percent: { fontFamily: 'LoraBold', fontSize: 27, fontVariant: ['tabular-nums'] },
  track: { height: 10, overflow: 'hidden', borderRadius: 5 },
  fill: { height: '100%', borderRadius: 5 },
  detail: { fontSize: 14, lineHeight: 21 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderRadius: 5,
  },
  noticeIcon: { marginTop: 2 },
  noticeText: { flex: 1, minWidth: 0, gap: 4 },
  errorTitle: { fontFamily: 'ManropeBold', fontSize: 16 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
