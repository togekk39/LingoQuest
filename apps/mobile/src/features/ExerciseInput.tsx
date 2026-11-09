import { useTheme } from '../theme';
import React, { useState } from 'react';
import type { PublicExercise, Answer } from '@lingoquest/contracts';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, CornerDownLeft, RotateCcw } from 'lucide-react-native';
import { useFeatureStyles } from './FeatureUI';
export type Exercise = PublicExercise;
export type ExerciseAnswer = Partial<Answer>;
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
}: {
  exercise: Exercise;
  answer: ExerciseAnswer;
  setAnswer: (a: ExerciseAnswer) => void;
  disabled?: boolean;
}) {
  const { colors: palette } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();

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
    <View testID={`exercise-${exercise.id}`} style={{ gap: 22 }}>
      {exercise.passage && (
        <View style={s.passage}>
          <Text style={f.eyebrow}>Lee con calma</Text>
          <Text style={s.passageText}>{exercise.passage}</Text>
        </View>
      )}
      <View style={{ gap: 12 }}>
        <Text style={f.eyebrow}>{kindLabels[exercise.type]}</Text>
        <Text style={s.prompt}>{exercise.promptEs}</Text>
        {exercise.sentence && <Text style={s.sentence}>{exercise.sentence}</Text>}
      </View>
      {!!exercise.contextualGlosses?.length && (
        <View style={s.glosses}>
          <Text style={f.eyebrow}>Ayuda para esta situación</Text>
          {exercise.contextualGlosses.map((gloss) => (
            <Text key={gloss.en} style={f.body}>
              <Text style={{ color: palette.ink }}>{gloss.en}</Text> · {gloss.es}
            </Text>
          ))}
        </View>
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
                    style={[s.matchingItem, !!linked && s.linked, active && s.selected]}
                  >
                    <Text style={s.optionText}>{pair.left}</Text>
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
                  style={[s.matchingItem, !selectedPair && { opacity: 0.72 }]}
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
        <View style={{ gap: 12 }}>
          {exercise.options.map((option, index) => {
            const selected = answer.optionId === option.id;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, disabled }}
                accessibilityLabel={option.text}
                disabled={disabled}
                key={option.id}
                onPress={() => setAnswer({ optionId: option.id })}
                style={[s.option, selected && s.selected]}
              >
                <View style={[s.optionIndex, selected && { backgroundColor: palette.primary }]}>
                  {selected ? (
                    <Check color="white" size={15} />
                  ) : (
                    <Text style={s.optionIndexText}>{String.fromCharCode(65 + index)}</Text>
                  )}
                </View>
                <Text style={[s.optionText, selected && { color: palette.teal }]}>
                  {option.text}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : exercise.type === 'reorder' ? (
        <View style={{ gap: 16 }}>
          <View style={s.tokenAnswer}>
            {selectedTokens.length ? (
              selectedTokens.map((token, index) => (
                <Pressable
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar palabra: ${token}`}
                  key={`${index}-${token}`}
                  onPress={() =>
                    setAnswer({ tokens: selectedTokens.filter((_, i) => i !== index) })
                  }
                  style={[s.token, s.selectedToken]}
                >
                  <Text style={s.tokenText}>{token}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={f.quiet}>Toca las palabras para formar una oración.</Text>
            )}
          </View>
          <View style={s.tokenList}>
            {remainingTokens.map(({ text, index }) => (
              <Pressable
                disabled={disabled || used.includes(index)}
                accessibilityRole="button"
                accessibilityLabel={`Agregar palabra: ${text}`}
                key={`${index}-${text}`}
                onPress={() => setAnswer({ tokens: [...selectedTokens, text] })}
                style={[s.token, used.includes(index) && { opacity: 0.25 }]}
              >
                <Text style={s.tokenText}>{text}</Text>
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
          <TextInput
            accessibilityLabel="Tu respuesta en inglés"
            style={s.textInput}
            placeholder="Escribe tu respuesta en inglés…"
            placeholderTextColor="#91A09B"
            value={answer.text ?? ''}
            onChangeText={(text) => setAnswer({ text })}
            editable={!disabled}
            autoCapitalize="sentences"
            autoCorrect={false}
            multiline
          />
          <View style={[f.row, { marginTop: 10 }]}>
            <CornerDownLeft size={13} color={palette.muted} />
            <Text style={f.quiet}>Tómate el tiempo que necesites.</Text>
          </View>
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
    passageText: { fontFamily: 'Manrope', fontSize: 15, lineHeight: 26, color: palette.ink },
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
