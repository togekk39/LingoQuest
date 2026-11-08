import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, CornerDownLeft, RotateCcw } from 'lucide-react-native';
import { f, palette } from './FeatureUI';
export interface Exercise {
  id: string;
  type: 'single_choice' | 'cloze' | 'reorder' | 'correction' | 'short_text';
  promptEs: string;
  sentence?: string;
  options?: { id: string; text: string }[];
  tokens?: string[];
  skillId: string;
  passage?: string;
  difficulty: number;
}
export interface ExerciseAnswer {
  optionId?: string;
  text?: string;
  tokens?: string[];
}
export const kindLabels: Record<Exercise['type'], string> = {
  single_choice: 'Elige una respuesta',
  cloze: 'Completa la idea',
  reorder: 'Construye la oración',
  correction: 'Encuentra una mejor forma',
  short_text: 'Ahora, con tus palabras',
};
export function hasAnswer(answer: ExerciseAnswer) {
  return !!(answer.optionId || answer.text?.trim() || answer.tokens?.length);
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
  const selectedTokens = answer.tokens ?? [];
  const remainingTokens = (exercise.tokens ?? []).map((text, index) => ({ text, index }));
  const used: number[] = [];
  for (const token of selectedTokens) {
    const item = remainingTokens.find((t) => t.text === token && !used.includes(t.index));
    if (item) used.push(item.index);
  }
  return (
    <View style={{ gap: 22 }}>
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
      {exercise.options?.length ? (
        <View style={{ gap: 12 }}>
          {exercise.options.map((option, index) => {
            const selected = answer.optionId === option.id;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, disabled }}
                disabled={disabled}
                key={option.id}
                onPress={() => setAnswer({ optionId: option.id })}
                style={[s.option, selected && s.selected]}
              >
                <View style={[s.optionIndex, selected && { backgroundColor: palette.teal }]}>
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
const s = StyleSheet.create({
  prompt: { fontFamily: 'Outfit', fontSize: 29, lineHeight: 37, color: palette.ink },
  sentence: {
    fontFamily: 'Outfit',
    fontSize: 24,
    lineHeight: 34,
    color: palette.teal,
    paddingVertical: 12,
  },
  passage: { backgroundColor: '#EFF5EF', padding: 22, borderRadius: 18, gap: 10 },
  passageText: { fontFamily: 'Manrope', fontSize: 15, lineHeight: 26, color: palette.ink },
  option: {
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 17,
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  selected: { borderColor: palette.teal, backgroundColor: '#ECF7F0', borderWidth: 2, padding: 16 },
  optionIndex: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4EF',
  },
  optionIndexText: { color: palette.muted, fontFamily: 'Manrope', fontWeight: '700', fontSize: 12 },
  optionText: { color: palette.ink, fontFamily: 'Manrope', fontSize: 16, flex: 1 },
  textInput: {
    minHeight: 120,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#C6D8CE',
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
    backgroundColor: '#EFF5EF',
    borderRadius: 17,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BCCFC4',
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
    borderColor: '#D2DFD5',
    backgroundColor: 'white',
    minHeight: 46,
  },
  selectedToken: { borderColor: '#B0CFC0', backgroundColor: '#FFFFFF' },
  tokenText: { fontFamily: 'Manrope', fontSize: 16, color: palette.ink },
});
