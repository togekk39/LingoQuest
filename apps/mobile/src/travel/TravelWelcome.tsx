import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Compass, Route, X } from 'lucide-react-native';
import { Button } from '../ui';
import { useTheme } from '../theme';
import { TravelMark, WelcomePicture } from './TravelAppearance';

export function TravelWelcome({
  busy,
  onStart,
  onAssessment,
  onClose,
}: {
  busy: boolean;
  onStart: () => void;
  onAssessment: () => void;
  onClose: () => void;
}) {
  const { colors: C, mode } = useTheme();
  const { width, height, fontScale } = useWindowDimensions();
  const wide = width >= 850 && fontScale < 1.4;
  const artHeight = wide
    ? Math.min(510, Math.max(430, height - 170))
    : Math.min(270, Math.max(150, height * 0.29));
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.paper }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.wrap, { justifyContent: wide ? 'center' : 'flex-start' }]}
      >
        <View
          style={[
            styles.ticket,
            { borderColor: C.line, backgroundColor: C.white, maxWidth: wide ? 1120 : 540 },
          ]}
        >
          <View style={styles.brandBar}>
            <TravelMark size={33} />
            <Text style={styles.brand}>LingoQuest</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Explorar primero"
              disabled={busy}
              onPress={onClose}
              style={({ pressed }) => [styles.close, { opacity: pressed ? 0.6 : 1 }]}
            >
              <X size={21} color="#FFF3D6" />
            </Pressable>
          </View>
          <View style={{ flexDirection: wide ? 'row' : 'column' }}>
            <View style={{ flex: wide ? 1.12 : undefined }}>
              <WelcomePicture height={artHeight} />
              <View pointerEvents="none" style={styles.caption}>
                <Compass size={14} color="#472D1B" strokeWidth={2} />
                <Text style={styles.ticketCaption}>La primera postal</Text>
              </View>
            </View>
            <View
              style={[
                styles.words,
                { flex: wide ? 1 : undefined, padding: wide ? 32 : width < 355 ? 19 : 23 },
              ]}
            >
              <View style={[styles.line, { borderColor: C.line }]}>
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.title,
                    { color: C.ink, fontSize: wide ? 49 : width > 375 ? 36 : 30 },
                  ]}
                >
                  Aprende inglés, descubre el mundo.
                </Text>
                <Text style={[styles.intro, { color: C.muted }]}>
                  Tu viaje empieza cerca de casa. Usa el inglés para ayudar a Sam a encontrar su
                  camino.
                </Text>
              </View>
              <View style={{ gap: 12 }}>
                <Button loading={busy} icon={ArrowRight} style={styles.button} onPress={onStart}>
                  Empezar mi viaje
                </Button>
                <Button
                  disabled={busy}
                  variant="secondary"
                  icon={Route}
                  style={[
                    styles.button,
                    {
                      backgroundColor: mode === 'light' ? '#EEE0CC' : C.mint,
                      borderWidth: 1,
                      borderColor: C.line,
                    },
                  ]}
                  onPress={onAssessment}
                >
                  Ya sé algo de inglés
                </Button>
                <Text style={[styles.detail, { color: C.muted }]}>
                  Seis preguntas para encontrar tu punto de partida.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  wrap: { flexGrow: 1, padding: 14, alignItems: 'center' },
  ticket: { width: '100%', borderRadius: 13, borderWidth: 1, overflow: 'hidden' },
  brandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 10,
    backgroundColor: '#293D31',
  },
  brand: { fontFamily: 'Journal', fontSize: 21, color: '#FFE6B8', flex: 1 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  caption: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    flexDirection: 'row',
    backgroundColor: '#F7E5C3',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  ticketCaption: { fontFamily: 'ManropeBold', color: '#472D1B', fontSize: 11 },
  words: { gap: 17, justifyContent: 'center' },
  line: { gap: 10, borderBottomWidth: 1, paddingBottom: 15 },
  title: { fontFamily: 'Journal', letterSpacing: -0.7 },
  intro: { fontFamily: 'Manrope', fontSize: 15, lineHeight: 23 },
  button: { minHeight: 51, borderRadius: 8 },
  detail: { fontFamily: 'Manrope', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
