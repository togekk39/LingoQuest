import React, { type ReactNode } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { QuestBuddy } from '../QuestBuddy';
import { useTheme } from '../theme';
import { storyPortraits } from './illustrations';

const english = Platform.OS === 'web' ? { lang: 'en-US' } : { accessibilityLanguage: 'en-US' };

export type StoryTranslation = {
  translationsVisible: boolean;
  onToggleTranslation: () => void;
};

export function StoryActivity({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.activity, { borderTopColor: colors.line }]}>
      <Text accessibilityRole="header" style={[styles.activityTitle, { color: colors.ink }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export function StoryPortrait({
  name,
  portrait,
}: {
  name: string;
  portrait?: ImageSourcePropType;
}) {
  const { colors } = useTheme();
  const source =
    portrait ?? (name === 'Sam' ? storyPortraits.sam : name === 'Luz' ? storyPortraits.luz : null);

  if (source) {
    return (
      <Image
        accessible={false}
        source={source}
        style={[styles.portrait, { borderColor: colors.white, backgroundColor: colors.mint }]}
      />
    );
  }

  return name === 'QuestBuddy' ? <QuestBuddy size={54} /> : null;
}

export function StorySpeaker({
  name,
  portrait,
  heading,
  children,
}: {
  name: string;
  portrait?: ImageSourcePropType;
  heading?: ReactNode;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.speaker}>
      <StoryPortrait name={name} portrait={portrait} />
      <View style={styles.speakerText}>
        {heading ?? (
          <Text accessibilityRole="header" style={[styles.speakerName, { color: colors.ink }]}>
            {name}
          </Text>
        )}
        {children}
      </View>
    </View>
  );
}

export function StoryPhrase({
  line,
  showTranslation,
  onToggleTranslation,
  onListen,
  disabled,
  testID,
}: {
  line: { en: string; es: string };
  showTranslation: boolean;
  onToggleTranslation: () => void;
  onListen: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  const { colors } = useTheme();
  const translationLabel = showTranslation ? 'Ocultar traducción' : 'Mostrar traducción';

  return (
    <View testID={testID} style={styles.phrase}>
      <View style={[styles.quote, { backgroundColor: colors.mint, borderColor: colors.line }]}>
        <Text {...english} style={[styles.phraseEnglish, { color: colors.ink }]}>
          {line.en}
        </Text>
        {showTranslation && (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.translation, { color: colors.muted }]}
          >
            {line.es}
          </Text>
        )}
      </View>
      <View style={styles.tools}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escuchar frase"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onListen}
          style={({ pressed }) => [
            styles.tool,
            { borderColor: colors.line, backgroundColor: colors.white },
            (pressed || disabled) && styles.pressed,
          ]}
        >
          <Volume2 color={colors.teal} size={18} />
          <Text style={[styles.toolLabel, { color: colors.ink }]}>Escuchar</Text>
        </Pressable>
        <Pressable
          testID="story-translation"
          accessibilityRole="switch"
          accessibilityState={{ checked: showTranslation, disabled }}
          aria-checked={showTranslation}
          accessibilityLabel="Mostrar traducción"
          disabled={disabled}
          onPress={onToggleTranslation}
          style={[styles.tool, disabled && styles.pressed]}
        >
          <Text style={[styles.toolLabel, { color: colors.ink }]}>{translationLabel}</Text>
          <View
            style={[
              styles.switchTrack,
              {
                backgroundColor: showTranslation ? colors.teal : colors.mint,
                borderColor: colors.teal,
              },
              showTranslation && styles.switchOn,
            ]}
          >
            <View
              style={[
                styles.switchKnob,
                { backgroundColor: showTranslation ? colors.white : colors.teal },
              ]}
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activity: { borderTopWidth: 1, paddingTop: 12, gap: 10 },
  activityTitle: { fontFamily: 'LoraBold', fontSize: 20 },
  speaker: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  speakerText: { flex: 1, minWidth: 0, gap: 4 },
  speakerName: { fontFamily: 'LoraBold', fontSize: 24, flexShrink: 1 },
  portrait: { width: 58, height: 58, borderRadius: 29, borderWidth: 3 },
  phrase: { gap: 5 },
  quote: { paddingVertical: 12, paddingHorizontal: 15, borderWidth: 1, borderRadius: 12, gap: 4 },
  phraseEnglish: { fontFamily: 'LoraBold', fontSize: 23 },
  translation: { fontFamily: 'Manrope', fontStyle: 'italic', fontSize: 15 },
  tools: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  tool: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    maxWidth: '100%',
  },
  toolLabel: { flexShrink: 1, fontFamily: 'ManropeBold', fontSize: 13 },
  pressed: { opacity: 0.67 },
  switchTrack: {
    width: 35,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchOn: { alignItems: 'flex-end' },
  switchKnob: { width: 14, height: 14, borderRadius: 7 },
});
