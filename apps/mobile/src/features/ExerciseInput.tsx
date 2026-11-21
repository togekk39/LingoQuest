import { JournalLeaf, PaperInput } from '../Journal';
import { useTheme } from '../theme';
import React, { useContext, useRef, useState } from 'react';
import type { PublicExercise, Answer } from '@lingoquest/contracts';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { MotionPressable as Pressable } from '../motion';
import { Check, CornerDownLeft, RotateCcw } from 'lucide-react-native';
import { InputViewportContext, useFeatureStyles } from './FeatureUI';
export type Exercise = PublicExercise;
export type ExerciseAnswer = Partial<Answer>;
const english = Platform.OS === 'web' ? { lang: 'en-US' } : { accessibilityLanguage: 'en-US' };
export const kindLabels: Record<Exercise['type'], string> = {
  single_choice: 'Elige una respuesta',
  meaning: 'Reconoce el significado',
  matching: 'Relaciona palabras y significados',
  cloze: 'Completa la idea',
  reorder: 'Construye la oración',
  correction: 'Encuentra una mejor forma',
  short_text: 'Ahora, con tus palabras',
};
export function hasAnswer(answer: ExerciseAnswer, exercise?: Exercise) {
  if (exercise?.type === 'matching')
    return Object.keys(answer.matches ?? {}).length === (exercise.matchingPairs?.length ?? 0);
  return !!(
    answer.optionId ||
    answer.text?.trim() ||
    answer.tokens?.length ||
    Object.keys(answer.matches ?? {}).length
  );
}
export function ExerciseInput({
  exercise,
  answer,
  setAnswer,
  disabled,
  journal = false,
  inline = false,
  tokenLabel = (token: string) => token,
  kindLabel = kindLabels[exercise.type],
}: {
  exercise: Exercise;
  answer: ExerciseAnswer;
  setAnswer: (a: ExerciseAnswer) => void;
  disabled?: boolean;
  journal?: boolean;
  inline?: boolean;
  tokenLabel?: (token: string) => string;
  kindLabel?: string;
}) {
  const { colors: palette } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();
  const input = useRef<TextInput>(null);
  const { revealInput, maxHeight } = useContext(InputViewportContext);
  function revealFocusedInput() {
    if (input.current?.isFocused()) revealInput(input.current);
  }

  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const selectedTokens = answer.tokens ?? [];
  const pairs = exercise.matchingPairs ?? [];
  // Keep the meaning order stable, and different from the authored word order.
  const meanings = pairs.length > 1 ? [...pairs.slice(1), pairs[0]] : pairs;
  const matchingComplete =
    pairs.length > 0 && Object.keys(answer.matches ?? {}).length === pairs.length;
  const remainingTokens = (exercise.tokens ?? []).map((text, index) => ({ text, index }));
  const used: number[] = [];
  for (const token of selectedTokens) {
    const item = remainingTokens.find((t) => t.text === token && !used.includes(t.index));
    if (item) used.push(item.index);
  }
  return (
    <View testID={`exercise-${exercise.id}`} style={{ gap: journal ? 13 : 22 }}>
      {exercise.passage && (
        <JournalLeaf compact kind="notebook" style={[s.passage, journal && s.journalPassage]}>
          <Text style={f.eyebrow}>Lee con calma</Text>
          <Text {...english} style={s.passageText}>
            {exercise.passage}
          </Text>
        </JournalLeaf>
      )}
      <View style={{ gap: journal ? 6 : 12 }}>
        <Text style={f.eyebrow}>{kindLabel}</Text>
        <Text style={journal ? s.journalPrompt : s.prompt}>{exercise.promptEs}</Text>
        {exercise.sentence && (
          <Text {...english} style={s.sentence}>
            {exercise.sentence}
          </Text>
        )}
      </View>
      {!!exercise.contextualGlosses?.length && (
        <JournalLeaf compact kind="notebook" style={s.glosses}>
          <Text style={f.eyebrow}>Ayuda para esta situación</Text>
          {exercise.contextualGlosses.map((gloss) => (
            <Text key={gloss.en} style={f.body}>
              <Text {...english} style={{ color: palette.ink }}>
                {gloss.en}
              </Text>{' '}
              · {gloss.es}
            </Text>
          ))}
        </JournalLeaf>
      )}
      {exercise.type === 'matching' ? (
        <View style={{ gap: 14 }}>
          <Text style={f.body}>
            Toca una palabra y después su significado. Puedes cambiar tus parejas.
          </Text>
          <View style={s.matchingColumns}>
            <View style={s.matchingColumn}>
              {pairs.map((pair) => {
                const active = selectedPair === pair.id;
                const linked = answer.matches?.[pair.id];
                const meaning = pairs.find((item) => item.id === linked);
                return (
                  <Pressable
                    key={pair.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Relacionar: ${pair.left}`}
                    accessibilityState={{ selected: active, disabled }}
                    disabled={disabled}
                    onPress={() => setSelectedPair(pair.id)}
                    style={[
                      s.matchingItem,
                      journal && s.journalMatch,
                      !!linked && s.linked,
                      active && s.selected,
                    ]}
                  >
                    <Text {...english} style={s.optionText}>
                      {pair.left}
                    </Text>
                    {meaning && <Text style={f.quiet}>↔ {meaning.right}</Text>}
                  </Pressable>
                );
              })}
            </View>
            <View style={s.matchingColumn}>
              {meanings.map((pair) => (
                <Pressable
                  key={pair.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Significado: ${pair.right}`}
                  accessibilityState={{ disabled: disabled || !selectedPair }}
                  disabled={disabled || !selectedPair}
                  onPress={() => {
                    if (!selectedPair) return;
                    const matches = { ...answer.matches };
                    for (const [left, right] of Object.entries(matches))
                      if (right === pair.id) delete matches[left];
                    matches[selectedPair] = pair.id;
                    setAnswer({ matches });
                    setSelectedPair(null);
                  }}
                  style={[
                    s.matchingItem,
                    journal && s.journalMatch,
                    !selectedPair && { opacity: 0.72 },
                  ]}
                >
                  <Text style={s.optionText}>{pair.right}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Text accessibilityLiveRegion="polite" style={f.quiet}>
            {matchingComplete
              ? 'Ya relacionaste todas las palabras. Comprueba tus respuestas cuando quieras.'
              : `${Object.keys(answer.matches ?? {}).length} de ${pairs.length} parejas listas.`}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reiniciar las parejas"
            disabled={disabled}
            onPress={() => {
              setSelectedPair(null);
              setAnswer({ matches: {} });
            }}
            style={f.back}
          >
            <RotateCcw size={15} color={palette.muted} />
            <Text style={f.quiet}>Empezar de nuevo</Text>
          </Pressable>
        </View>
      ) : exercise.options?.length ? (
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={exercise.promptEs}
          style={{ gap: journal ? 8 : 12 }}
        >
          {exercise.options.map((option, index) => {
            const selected = answer.optionId === option.id;
            return (
              <Pressable
                {...(exercise.optionsLanguage === 'en' ? english : {})}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, disabled }}
                aria-checked={selected}
                accessibilityLabel={option.text}
                disabled={disabled}
                key={option.id}
                onPress={() => setAnswer({ optionId: option.id })}
                style={[
                  s.option,
                  journal && s.journalOption,
                  selected && (journal ? s.journalSelected : s.selected),
                ]}
              >
                {journal ? (
                  <View style={s.journalRadio}>
                    {selected && <View style={s.journalRadioDot} />}
                  </View>
                ) : (
                  <View style={[s.optionIndex, selected && { backgroundColor: palette.primary }]}>
                    {selected ? (
                      <Check color="white" size={15} />
                    ) : (
                      <Text style={s.optionIndexText}>{String.fromCharCode(65 + index)}</Text>
                    )}
                  </View>
                )}
                <Text style={[s.optionText, selected && { color: palette.teal }]}>
                  {option.text}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : exercise.type === 'reorder' ? (
        <View style={{ gap: 16 }}>
          <JournalLeaf compact kind="notebook" style={s.tokenAnswer}>
            {selectedTokens.length ? (
              selectedTokens.map((token, index) => (
                <Pressable
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar palabra: ${tokenLabel(token)}`}
                  key={`${index}-${token}`}
                  onPress={() =>
                    setAnswer({ tokens: selectedTokens.filter((_, i) => i !== index) })
                  }
                  style={[s.token, s.selectedToken]}
                >
                  <Text {...english} style={s.tokenText}>
                    {tokenLabel(token)}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={f.quiet}>Toca las palabras para formar una oración.</Text>
            )}
          </JournalLeaf>
          <View style={s.tokenList}>
            {remainingTokens.map(({ text, index }) => (
              <Pressable
                disabled={disabled || used.includes(index)}
                accessibilityRole="button"
                accessibilityLabel={`Agregar palabra: ${tokenLabel(text)}`}
                key={`${index}-${text}`}
                onPress={() => setAnswer({ tokens: [...selectedTokens, text] })}
                style={[s.token, used.includes(index) && { opacity: 0.25 }]}
              >
                <Text {...english} style={s.tokenText}>
                  {tokenLabel(text)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable disabled={disabled} onPress={() => setAnswer({ tokens: [] })} style={f.back}>
            <RotateCcw size={15} color={palette.muted} />
            <Text style={f.quiet}>Empezar de nuevo</Text>
          </Pressable>
        </View>
      ) : (
        <View>
          <PaperInput
            {...english}
            ref={input}
            onFocus={() => revealInput(input.current)}
            onBlur={() => revealInput(null)}
            onLayout={revealFocusedInput}
            onContentSizeChange={revealFocusedInput}
            onSelectionChange={revealFocusedInput}
            accessibilityLabel="Tu respuesta en inglés"
            style={[
              s.textInput,
              journal && s.journalTextInput,
              {
                minHeight: Math.min(inline ? 66 : 120, maxHeight),
                maxHeight: Math.min(inline ? 150 : 200, maxHeight),
              },
            ]}
            placeholder="Escribe tu respuesta en inglés…"
            placeholderTextColor="#91A09B"
            value={answer.text ?? ''}
            onChangeText={(text) => {
              setAnswer({ text });
              revealFocusedInput();
            }}
            editable={!disabled}
            autoCapitalize="sentences"
            autoCorrect={false}
            maxLength={2000}
            multiline
            scrollEnabled
          />
          {!inline && (
            <View style={[f.row, { marginTop: 10 }]}>
              <CornerDownLeft size={13} color={palette.muted} />
              <Text style={f.quiet}>Tómate el tiempo que necesites.</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
export function useStyles() {
  const { colors: palette, tone } = useTheme();
  return StyleSheet.create({
    glosses: {
      backgroundColor: tone('#F2F6F1', 'background'),
      padding: 17,
      borderRadius: 15,
      gap: 6,
    },
    matchingColumns: { flexDirection: 'row', gap: 12 },
    matchingColumn: { flex: 1, gap: 12 },
    matchingItem: {
      borderWidth: 1,
      borderColor: palette.line,
      borderRadius: 15,
      backgroundColor: tone('white', 'background'),
      padding: 14,
      minHeight: 78,
      justifyContent: 'center',
      gap: 5,
    },
    linked: {
      borderColor: tone('#A7CEC0', 'border'),
      backgroundColor: tone('#F0F8F2', 'background'),
    },
    prompt: { fontFamily: 'Outfit', fontSize: 29, lineHeight: 37, color: palette.ink },
    journalPrompt: {
      fontFamily: 'ManropeMedium',
      fontSize: 18,
      lineHeight: 26,
      color: palette.ink,
    },
    sentence: {
      fontFamily: 'Outfit',
      fontSize: 24,
      lineHeight: 34,
      color: palette.teal,
      paddingVertical: 12,
    },
    passage: {
      backgroundColor: tone('#EFF5EF', 'background'),
      padding: 22,
      borderRadius: 18,
      gap: 10,
    },
    passageText: { fontFamily: 'LoraBold', fontSize: 20, lineHeight: 29, color: palette.ink },
    journalPassage: {
      backgroundColor: palette.white,
      borderLeftColor: palette.accent,
      borderLeftWidth: 3,
      padding: 12,
      borderRadius: 9,
    },
    journalMatch: { minHeight: 58, borderRadius: 9, backgroundColor: palette.white, padding: 10 },
    journalTextInput: { backgroundColor: palette.white, borderRadius: 10, padding: 13 },
    option: {
      borderWidth: 1,
      borderColor: palette.line,
      backgroundColor: tone('white', 'background'),
      borderRadius: 16,
      padding: 17,
      minHeight: 66,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    selected: {
      borderColor: palette.teal,
      backgroundColor: tone('#ECF7F0', 'background'),
      borderWidth: 2,
      padding: 16,
    },
    journalOption: { paddingHorizontal: 13, paddingVertical: 9, minHeight: 48, borderRadius: 13 },
    journalSelected: { borderColor: palette.accent, backgroundColor: palette.mint },
    journalRadio: {
      width: 21,
      height: 21,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: palette.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    journalRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.accent },
    optionIndex: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tone('#F0F4EF', 'background'),
    },
    optionIndexText: {
      color: palette.muted,
      fontFamily: 'Manrope',
      fontWeight: '700',
      fontSize: 12,
    },
    optionText: { color: palette.ink, fontFamily: 'Manrope', fontSize: 16, flex: 1 },
    textInput: {
      minHeight: 120,
      backgroundColor: tone('white', 'background'),
      borderWidth: 1,
      borderColor: tone('#C6D8CE', 'border'),
      borderRadius: 17,
      padding: 20,
      fontFamily: 'Manrope',
      fontSize: 18,
      lineHeight: 28,
      color: palette.ink,
      textAlignVertical: 'top',
    },
    tokenAnswer: {
      minHeight: 94,
      padding: 18,
      backgroundColor: tone('#EFF5EF', 'background'),
      borderRadius: 17,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: tone('#BCCFC4', 'border'),
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
      alignItems: 'center',
    },
    tokenList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    token: {
      paddingVertical: 13,
      paddingHorizontal: 18,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tone('#D2DFD5', 'border'),
      backgroundColor: tone('white', 'background'),
      minHeight: 46,
    },
    selectedToken: {
      borderColor: tone('#B0CFC0', 'border'),
      backgroundColor: tone('#FFFFFF', 'background'),
    },
    tokenText: { fontFamily: 'Manrope', fontSize: 16, color: palette.ink },
  });
}
