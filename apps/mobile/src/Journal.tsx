import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ColorValue,
  type ImageSourcePropType,
  type TextInputProps,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { Compass, Mountain, PencilLine } from 'lucide-react-native';
import notebookEdge from '../assets/journal/notebook-edge.png';
import notebookSide from '../assets/journal/notebook-side.png';
import grain from '../assets/journal/paper-grain.png';
import plaza from '../assets/journal/plaza.jpg';
import postcardEdge from '../assets/journal/postcard-edge.png';
import postcardSide from '../assets/journal/postcard-side.png';
import postagePaper from '../assets/journal/postage-paper.png';
import portrait from '../assets/journal/sam.jpg';
import { useTheme } from './theme';

const notebookColor = '#FCF0DD';
const postcardColor = '#FEF1DC';

export function PaperGrain({ opacity = 0.11 }: { opacity?: number }) {
  const { mode } = useTheme();
  if (mode !== 'light') return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        resizeMode="repeat"
        source={grain}
        style={[styles.grain, { opacity: opacity * 0.55 }]}
      />
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

const edgeStyles = {
  top: 'edgeTop',
  bottom: 'edgeBottom',
  left: 'edgeLeft',
  right: 'edgeRight',
} as const;
type Edge = keyof typeof edgeStyles;
type PaperKind = 'notebook' | 'postcard' | 'stamp';

export function PaperEdge({ edge, tint }: { edge: Edge; tint: ColorValue }) {
  return <PaperEdges kind="postcard" edge={edge} tint={tint} />;
}

function PaperEdges({
  kind,
  edge,
  tint,
}: {
  kind: Exclude<PaperKind, 'stamp'>;
  edge?: Edge;
  tint?: ColorValue;
}) {
  const { mode, colors } = useTheme();
  const horizontal = kind === 'notebook' ? notebookEdge : postcardEdge;
  const vertical = kind === 'notebook' ? notebookSide : postcardSide;
  const sides = edge ? [edge] : (Object.keys(edgeStyles) as Edge[]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {sides.map((side) => (
        <Image
          key={side}
          accessible={false}
          source={side === 'top' || side === 'bottom' ? horizontal : vertical}
          tintColor={tint ?? (mode === 'light' ? undefined : colors.white)}
          resizeMode="stretch"
          style={styles[edgeStyles[side]]}
        />
      ))}
    </View>
  );
}

export function JournalPostcardFrame({
  children,
  taped = false,
}: {
  children: React.ReactNode;
  taped?: boolean;
}) {
  const { colors, mode } = useTheme();
  return (
    <View
      style={[
        styles.photo,
        { backgroundColor: mode === 'light' ? postcardColor : colors.white },
        taped && styles.tapedFrame,
      ]}
    >
      <PaperEdges kind="postcard" />
      {children}
      {taped && (
        <View pointerEvents="none" style={[styles.tape, mode !== 'light' && styles.tapeDark]}>
          <PaperGrain opacity={0.36} />
        </View>
      )}
    </View>
  );
}

export function JournalStamp({
  source,
  size = 56,
  rotation = -9,
}: {
  source: ImageSourcePropType;
  size?: number;
  rotation?: number;
}) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.postage,
        { width: size, height: size, transform: [{ rotate: `${rotation}deg` }] },
      ]}
    >
      <Image accessible={false} source={postagePaper} style={styles.grain} />
      <View style={styles.postageVignette}>
        <Image accessible={false} source={source} style={styles.grain} resizeMode="cover" />
        <View style={[StyleSheet.absoluteFillObject, styles.stampInk]} />
      </View>
    </View>
  );
}

export function PlazaPhoto() {
  return (
    <JournalArt
      source={plaza}
      label="Una plaza entre montañas, con una fuente y buganvilias"
      aspectRatio={2.36}
      taped
    />
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
            backgroundColor: colors.white,
          },
        ]}
      >
        <PaperEdges kind="postcard" tint={colors.white} />
        <PaperGrain opacity={0.32} />
        <Image source={portrait} style={[styles.portrait, { borderColor: colors.white }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.travelerName, { color: colors.ink }]}>Sam</Text>
          <Text style={[styles.travelerRole, { color: colors.muted }]}>Viajero</Text>
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.postmarkSeal,
            { borderColor: colors.accent, backgroundColor: colors.white },
          ]}
        >
          <View style={[styles.postmarkInner, { borderColor: colors.accent }]}>
            <Mountain color={colors.accent} size={27} strokeWidth={1.4} />
          </View>
        </View>
        <View pointerEvents="none" style={styles.postmark}>
          {mode === 'light' && (
            <View style={styles.postmarkWaves}>
              {[0, 1, 2].map((line) => (
                <View key={line} style={styles.postmarkLine} />
              ))}
            </View>
          )}
          <JournalStamp source={plaza} size={49} rotation={-8} />
        </View>
      </View>
    </View>
  );
}

export function Notebook({ title, children }: { title: string; children: React.ReactNode }) {
  const { mode, colors } = useTheme();
  const light = mode === 'light';
  return (
    <View style={[styles.notebook, { backgroundColor: light ? notebookColor : colors.white }]}>
      <PaperEdges kind="notebook" />
      <PaperGrain />
      <View pointerEvents="none" style={styles.perforation}>
        {[0, 1, 2, 3, 4].map((hole) => (
          <View
            key={hole}
            style={[
              styles.hole,
              { backgroundColor: colors.paper, borderBottomColor: light ? '#CEAF91' : colors.line },
            ]}
          />
        ))}
      </View>
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

export function JournalArt({
  source,
  label,
  aspectRatio = 2.2,
  taped = false,
}: {
  source: ImageSourcePropType;
  label?: string;
  aspectRatio?: number;
  taped?: boolean;
}) {
  const { colors } = useTheme();
  const image = (
    <View style={[styles.artCrop, { aspectRatio, backgroundColor: colors.mint }]}>
      <Image
        accessible={!!label}
        accessibilityLabel={label}
        source={source}
        resizeMode="cover"
        style={[StyleSheet.absoluteFillObject, styles.grain]}
      />
    </View>
  );
  return <JournalPostcardFrame taped={taped}>{image}</JournalPostcardFrame>;
}

export function JournalLeaf({
  children,
  style,
  tint = 'white',
  kind = 'postcard',
  compact = false,
  ...props
}: ViewProps & {
  tint?: 'white' | 'mint' | 'paper';
  kind?: PaperKind;
  compact?: boolean;
}) {
  const { colors, mode } = useTheme();
  const backgroundColor = StyleSheet.flatten(style)?.backgroundColor ?? colors[tint];
  return (
    <View
      {...props}
      style={[
        styles.leaf,
        compact && styles.compactLeaf,
        { backgroundColor },
        style,
        styles.leafEdge,
        kind === 'stamp' && styles.stampLeaf,
      ]}
    >
      {kind === 'stamp' ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Image
            accessible={false}
            source={postagePaper}
            tintColor={mode === 'light' ? undefined : colors.mint}
            style={styles.grain}
            resizeMode="stretch"
          />
        </View>
      ) : (
        <PaperEdges kind={kind} tint={backgroundColor} />
      )}
      {children}
    </View>
  );
}

export const PaperInput = React.forwardRef<TextInput, TextInputProps>(function PaperInput(
  { style, ...props },
  ref,
) {
  const { colors } = useTheme();
  return (
    <JournalLeaf kind="notebook" compact tint="paper">
      <TextInput
        underlineColorAndroid="transparent"
        {...props}
        ref={ref}
        style={[
          style,
          styles.paperInput,
          Platform.OS === 'web' && [styles.paperInputWeb, { outlineColor: colors.teal }],
        ]}
      />
    </JournalLeaf>
  );
});

export function JournalSpread({
  source,
  title,
  detail,
  children,
}: {
  source: ImageSourcePropType;
  title: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.spread}>
      <JournalArt source={source} taped />
      <JournalLeaf style={styles.caption}>
        <Text accessibilityRole="header" style={[styles.spreadTitle, { color: colors.ink }]}>
          {title}
        </Text>
        {!!detail && <Text style={[styles.spreadDetail, { color: colors.muted }]}>{detail}</Text>}
        {children}
      </JournalLeaf>
    </View>
  );
}

function paperShadow(offset: number, blur: number): ViewStyle {
  if (Platform.OS === 'android' && Number(Platform.Version) < 28) {
    return { elevation: 4, shadowColor: '#684425' };
  }
  return {
    boxShadow: `0 1px 2px rgba(88, 52, 25, 0.22), 0 ${offset}px ${blur}px rgba(103, 61, 30, 0.22)`,
  };
}

const styles = StyleSheet.create({
  grain: { width: '100%', height: '100%' },
  tapedFrame: { marginHorizontal: 4, marginTop: 8 },
  artCrop: { width: '100%', overflow: 'hidden', borderRadius: 4 },
  leaf: { borderRadius: 5, padding: 15, gap: 9, ...paperShadow(4, 11) },
  leafEdge: {
    borderWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 5,
    overflow: 'visible',
  },
  compactLeaf: { padding: 0, gap: 0, ...paperShadow(2, 6) },
  stampLeaf: { backgroundColor: 'transparent', boxShadow: 'none', elevation: 0 },
  paperInput: { backgroundColor: 'transparent', borderRadius: 4, borderWidth: 0 },
  paperInputWeb: { zIndex: 1, outlineOffset: -4 },
  spread: { gap: 0 },
  caption: { marginTop: -17, marginHorizontal: 12 },
  spreadTitle: { fontFamily: 'LoraBold', fontSize: 24, letterSpacing: -0.35 },
  spreadDetail: { fontFamily: 'Manrope', fontSize: 14, lineHeight: 21 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { fontFamily: 'LoraBold', letterSpacing: -0.7 },
  photo: { padding: 6, borderRadius: 5, ...paperShadow(7, 12) },
  edgeTop: { position: 'absolute', left: 0, top: -6, width: '100%', height: 14 },
  edgeBottom: {
    position: 'absolute',
    left: 0,
    bottom: -6,
    width: '100%',
    height: 14,
    transform: [{ scaleY: -1 }],
  },
  edgeLeft: { position: 'absolute', top: 0, left: -6, width: 14, height: '100%' },
  edgeRight: {
    position: 'absolute',
    top: 0,
    right: -6,
    width: 14,
    height: '100%',
    transform: [{ scaleX: -1 }],
  },
  tape: {
    position: 'absolute',
    top: -8,
    left: '42%',
    width: '17%',
    height: 23,
    borderRadius: 2,
    backgroundColor: '#DFC49C',
    opacity: 0.94,
    transform: [{ rotate: '-6deg' }],
    overflow: 'hidden',
    ...paperShadow(2, 3),
  },
  tapeDark: { backgroundColor: '#A18057', opacity: 0.75 },
  postage: { alignItems: 'center', justifyContent: 'center' },
  postageVignette: {
    position: 'absolute',
    left: '17%',
    right: '17%',
    top: '15%',
    bottom: '19%',
    overflow: 'hidden',
    backgroundColor: '#E7C6A0',
  },
  stampInk: { backgroundColor: '#B268423B' },
  postcard: { paddingTop: 9 },
  postcardPicture: { marginHorizontal: 8 },
  traveler: {
    ...paperShadow(6, 12),
    minHeight: 83,
    paddingVertical: 11,
    marginTop: -4,
    paddingLeft: 102,
    paddingRight: 66,
    borderRadius: 5,
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
  postmarkSeal: {
    position: 'absolute',
    top: -22,
    right: 12,
    borderWidth: 1,
    borderRadius: 28,
    padding: 3,
    transform: [{ rotate: '-12deg' }],
  },
  postmarkInner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 23,
    width: 39,
    height: 39,
  },
  postmark: { position: 'absolute', right: 9, bottom: 5 },
  postmarkWaves: { position: 'absolute', right: 40, top: 16, gap: 4 },
  postmarkLine: {
    width: 28,
    height: 3,
    borderTopWidth: 1,
    borderColor: '#B88059',
    borderRadius: 8,
    transform: [{ rotate: '-10deg' }],
  },
  notebook: {
    ...paperShadow(8, 12),
    borderRadius: 3,
    paddingTop: 15,
    paddingBottom: 17,
    paddingLeft: 23,
    paddingRight: 15,
    gap: 13,
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
    borderBottomWidth: 1.5,
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
