import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Compass, Mountain, PencilLine } from 'lucide-react-native';
import notebookEdge from '../assets/journal/notebook-edge.png';
import grain from '../assets/journal/paper-grain.png';
import plaza from '../assets/journal/plaza.jpg';
import postcardEdge from '../assets/journal/postcard-edge.png';
import portrait from '../assets/journal/sam.jpg';
import { useTheme } from './theme';

const notebookColor = '#FAEDDB';
const postcardColor = '#FEF1DC';

export function PaperGrain({ opacity = 0.38 }: { opacity?: number }) {
  const { mode } = useTheme();
  if (mode !== 'light') return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image resizeMode="repeat" source={grain} style={[styles.grain, { opacity }]} />
    </View>
  );
}

export function JournalBrand({ small = false }: { small?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.brand}>
      <Compass strokeWidth={1.5} size={small ? 31 : 35} color={colors.accent} />
      <Text style={[styles.wordmark, { color: colors.ink, fontSize: small ? 22 : 25 }]}>
        LingoQuest
      </Text>
    </View>
  );
}

export function PlazaPhoto() {
  const { colors, mode } = useTheme();
  const light = mode === 'light';
  return (
    <View style={[styles.photo, { backgroundColor: light ? postcardColor : colors.white }]}>
      <View style={styles.landscape}>
        <Image
          accessible
          accessibilityLabel="Una plaza entre montañas, con una fuente y buganvilias"
          resizeMode="cover"
          source={plaza}
          style={styles.grain}
        />
      </View>
      {light && (
        <>
          <Image source={postcardEdge} resizeMode="stretch" style={styles.photoEdge} />
          <View pointerEvents="none" style={styles.tape}>
            <PaperGrain />
          </View>
        </>
      )}
    </View>
  );
}

export function PlazaPostcard() {
  const { colors, mode } = useTheme();
  return (
    <View style={styles.postcard}>
      <View style={styles.postcardPicture}>
        <PlazaPhoto />
      </View>
      <View
        style={[
          styles.traveler,
          {
            borderColor: colors.line,
            borderLeftColor: colors.accent,
            backgroundColor: colors.white,
          },
        ]}
      >
        <PaperGrain opacity={0.32} />
        <Image source={portrait} style={[styles.portrait, { borderColor: colors.white }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.travelerName, { color: colors.ink }]}>Sam</Text>
          <Text style={[styles.travelerRole, { color: colors.muted }]}>Viajero</Text>
        </View>
        <View
          pointerEvents="none"
          style={[styles.stamp, { borderColor: colors.accent, backgroundColor: colors.white }]}
        >
          <View style={[styles.stampInner, { borderColor: colors.accent }]}>
            <Mountain color={colors.accent} size={27} strokeWidth={1.4} />
          </View>
        </View>
        {mode === 'light' && (
          <View pointerEvents="none" style={styles.postmark}>
            {[0, 1, 2].map((line) => (
              <View key={line} style={styles.postmarkLine} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export function Notebook({ title, children }: { title: string; children: React.ReactNode }) {
  const { mode, colors } = useTheme();
  const light = mode === 'light';
  return (
    <View style={[styles.notebook, { backgroundColor: light ? notebookColor : colors.white }]}>
      <PaperGrain />
      {light && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Image source={notebookEdge} resizeMode="stretch" style={styles.notebookTop} />
          <Image source={notebookEdge} resizeMode="stretch" style={styles.notebookBottom} />
          <View style={styles.perforation}>
            {[0, 1, 2, 3, 4].map((hole) => (
              <View key={hole} style={[styles.hole, { backgroundColor: colors.paper }]} />
            ))}
          </View>
        </View>
      )}
      <View style={[styles.notebookHeading, { backgroundColor: light ? colors.ink : colors.mint }]}>
        <PencilLine color={light ? colors.white : colors.teal} size={19} />
        <Text style={[styles.notebookTitle, { color: light ? colors.white : colors.ink }]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

const liftedPaper = {
  shadowColor: '#533016',
  shadowOpacity: 0.16,
  shadowOffset: { width: 0, height: 5 },
  shadowRadius: 9,
  elevation: 2,
};

const styles = StyleSheet.create({
  grain: { width: '100%', height: '100%' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { fontFamily: 'LoraBold', letterSpacing: -0.7 },
  photo: { padding: 7, borderRadius: 9, ...liftedPaper },
  landscape: { width: '100%', aspectRatio: 2.36, borderRadius: 5, overflow: 'hidden' },
  photoEdge: {
    position: 'absolute',
    width: '100%',
    height: 10,
    top: -4,
    left: 0,
  },
  tape: {
    position: 'absolute',
    top: -8,
    left: '42%',
    width: '17%',
    height: 23,
    borderRadius: 2,
    backgroundColor: '#DAB78A',
    opacity: 0.94,
    transform: [{ rotate: '-6deg' }],
    overflow: 'hidden',
  },
  postcard: { paddingTop: 9 },
  postcardPicture: { marginHorizontal: 8 },
  traveler: {
    ...liftedPaper,
    minHeight: 83,
    paddingVertical: 11,
    marginTop: -2,
    paddingLeft: 102,
    paddingRight: 66,
    borderRadius: 19,
    borderWidth: 1,
    borderLeftWidth: 6,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  portrait: {
    position: 'absolute',
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 4,
    top: -17,
    left: 6,
  },
  travelerName: { fontFamily: 'LoraBold', fontSize: 27 },
  travelerRole: { fontFamily: 'Manrope', fontSize: 15, marginTop: 1 },
  stamp: {
    position: 'absolute',
    top: -22,
    right: 12,
    borderWidth: 1,
    borderRadius: 28,
    padding: 3,
    transform: [{ rotate: '-12deg' }],
  },
  stampInner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 23,
    width: 39,
    height: 39,
  },
  postmark: { position: 'absolute', right: 32, bottom: 17, gap: 4 },
  postmarkLine: {
    width: 43,
    height: 3,
    borderTopWidth: 1,
    borderColor: '#B88059',
    borderRadius: 8,
    transform: [{ rotate: '-10deg' }],
  },
  notebook: {
    ...liftedPaper,
    borderRadius: 6,
    paddingTop: 15,
    paddingBottom: 17,
    paddingLeft: 23,
    paddingRight: 15,
    gap: 13,
  },
  notebookTop: {
    position: 'absolute',
    width: '100%',
    height: 9,
    top: -4,
    left: 0,
  },
  notebookBottom: {
    position: 'absolute',
    width: '100%',
    height: 9,
    bottom: -4,
    left: 0,
    transform: [{ rotate: '180deg' }],
  },
  perforation: {
    position: 'absolute',
    top: 14,
    bottom: 14,
    left: -3,
    justifyContent: 'space-between',
  },
  hole: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#D3B392',
  },
  notebookHeading: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 9,
    transform: [{ rotate: '-1.5deg' }],
  },
  notebookTitle: { flexShrink: 1, fontFamily: 'LoraBold', fontSize: 18, lineHeight: 24 },
});
