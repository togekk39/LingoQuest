import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BookOpen, CircleCheck, CircleHelp } from 'lucide-react-native';
import {
  confirmedEventFact,
  type EventScenarioDefinition,
  type EventScenarioState,
} from '@lingoquest/offline-engine';
import { JournalLeaf } from '../Journal';
import { useTheme } from '../theme';
import { Label } from '../ui';

export function EventJournal({
  definition,
  state,
  selectedId,
  onSelect,
  disabled,
}: {
  definition: EventScenarioDefinition;
  state?: EventScenarioState;
  selectedId?: string;
  onSelect?: (id: string) => void;
  disabled: boolean;
}) {
  const { colors } = useTheme();
  const required = definition.events.flatMap((event) =>
    event.required.map((field) => ({
      confirmed: confirmedEventFact(state, event, field),
    })),
  );
  return (
    <JournalLeaf kind="notebook" testID="travel-event-journal" style={styles.card}>
      <View style={styles.heading}>
        <BookOpen size={23} color={colors.teal} accessible={false} />
        <View style={styles.title}>
          <Text style={[styles.strong, { color: colors.ink }]}>{definition.title.es}</Text>
          <Label>{definition.subtitle.es}</Label>
        </View>
        <Text testID="travel-event-progress" style={{ color: colors.ink }}>
          {required.filter((fact) => fact.confirmed).length}/{required.length} datos confirmados
        </Text>
      </View>
      {definition.events.map((event) => {
        const person = definition.participants.find(({ id }) => id === event.personId);
        const personKnown = confirmedEventFact(state, event, 'person');
        const timeKnown = confirmedEventFact(state, event, 'time');
        const placeKnown = confirmedEventFact(state, event, 'place');
        const allKnown = event.required.every((field) => confirmedEventFact(state, event, field));
        const hour = Math.floor(event.minute / 60);
        const clock = `${hour % 12 || 12}:${String(event.minute % 60).padStart(2, '0')} ${hour < 12 ? 'a.m.' : 'p.m.'}`;
        const submitted = state?.submitted.find(({ eventId }) => eventId === event.id);
        const Icon = allKnown ? CircleCheck : CircleHelp;
        return (
          <View
            key={event.id}
            testID={`travel-event-${event.id}`}
            style={[styles.row, { borderColor: colors.line }]}
          >
            <View style={styles.heading}>
              <Text style={[styles.strong, styles.title, { color: colors.ink }]}>
                {timeKnown ? clock : 'Hora por confirmar'}
              </Text>
              <Icon
                size={20}
                color={allKnown ? colors.teal : colors.ink}
                accessibilityLabel={allKnown ? 'Datos confirmados' : 'Datos pendientes'}
              />
            </View>
            <Label>
              {submitted?.text ?? (event.required.length ? event.note.es : event.statement.en)}
            </Label>
            {!submitted && event.required.includes('person') && personKnown && (
              <Label>Persona confirmada: {person?.name}</Label>
            )}
            {!submitted && placeKnown && event.required.includes('place') && (
              <Label>Lugar confirmado: {event.place.label.en}</Label>
            )}
          </View>
        );
      })}
      {onSelect && (
        <View style={styles.people}>
          <Label>¿A quién quieres preguntar?</Label>
          <View style={styles.buttons}>
            {definition.participants.map(({ id, name }) => (
              <Pressable
                key={id}
                accessibilityRole="button"
                testID={`travel-event-ask-${id}`}
                accessibilityState={{ selected: id === selectedId }}
                style={[
                  styles.button,
                  { borderColor: colors.teal },
                  id === selectedId && { backgroundColor: colors.teal },
                ]}
                disabled={disabled}
                onPress={() => onSelect(id)}
              >
                <Text
                  style={{
                    color: id === selectedId ? colors.paper : colors.ink,
                    fontWeight: '700',
                  }}
                >
                  {name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </JournalLeaf>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  title: { flex: 1 },
  strong: { fontWeight: '700', fontSize: 17 },
  row: { gap: 6, paddingTop: 9, borderTopWidth: StyleSheet.hairlineWidth },
  people: { gap: 6 },
  button: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
