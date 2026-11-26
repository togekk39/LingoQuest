import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ClipboardList } from 'lucide-react-native';
import {
  teamAvailability,
  teamWorkVisible,
  type TeamScenarioDefinition,
  type TeamScenarioState,
} from '@lingoquest/offline-engine';
import { JournalLeaf } from '../Journal';
import { useTheme } from '../theme';
import { Label } from '../ui';

const statuses = {
  unassigned: 'Sin asignar',
  assigned: 'Acordada',
  active: 'En curso',
  done: 'Terminada',
  blocked: 'En espera',
};
const availability = {
  available: 'Disponible',
  busy: 'Con una tarea',
  'on-break': 'En pausa',
};

export function TeamBoard({
  definition,
  state,
  selectedId,
  onSelect,
  disabled,
}: {
  definition: TeamScenarioDefinition;
  state: TeamScenarioState;
  selectedId: string;
  onSelect?: (id: string) => void;
  disabled: boolean;
}) {
  const { colors } = useTheme();
  const taskFor = (id: string) => definition.tasks.find((item) => item.id === id);
  return (
    <JournalLeaf kind="notebook" testID="travel-team-board" style={styles.card}>
      <View style={styles.heading}>
        <ClipboardList size={22} color={colors.teal} accessible={false} />
        <View style={styles.info}>
          <Text style={[styles.strong, { color: colors.ink }]}>{definition.title.es}</Text>
          <Label>{definition.subtitle.es}</Label>
        </View>
      </View>
      {definition.participants.map((person) => {
        const work = state.work.find(
          ({ personId, status }) =>
            personId === person.id && (status === 'active' || status === 'assigned'),
        );
        const task = work && taskFor(work.taskId);
        const hidden = task && !teamWorkVisible(state, task);
        const selected = selectedId === person.id;
        return (
          <View key={person.id} style={[styles.row, { borderColor: colors.line }]}>
            <View style={styles.info}>
              <Text style={[styles.strong, { color: colors.ink }]}>{person.name}</Text>
              <Label>Habitual · {taskFor(person.usualTaskId)?.command.en}</Label>
              <Label>
                {hidden
                  ? 'Trabajo por confirmar'
                  : work && task
                    ? `${statuses[work.status]} · ${work.status === 'active' ? task.progressive.en : task.command.en}`
                    : availability[teamAvailability(state, person)]}
              </Label>
              {person.needsHelp && state.phase !== 'complete' && <Label>Necesita ayuda</Label>}
              {task && state.confirmed.includes(task.id) && <Label>Confirmado con el equipo</Label>}
            </View>
            {onSelect && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Hablar con ${person.name}`}
                accessibilityState={{ selected, disabled }}
                testID={`travel-team-talk-${person.id}`}
                disabled={disabled}
                onPress={() => onSelect(person.id)}
                style={[
                  styles.button,
                  { borderColor: colors.teal },
                  selected && { backgroundColor: colors.teal },
                ]}
              >
                <Text style={{ color: selected ? colors.paper : colors.ink, fontWeight: '700' }}>
                  {selected ? 'En conversación' : 'Hablar'}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}
      {state.work.map(({ taskId, status }) => {
        if (status === 'active' || status === 'assigned') return null;
        const task = taskFor(taskId);
        return task && teamWorkVisible(state, task) ? (
          <View
            key={taskId}
            testID={`travel-team-task-${taskId}`}
            style={[styles.row, { borderColor: colors.line }]}
          >
            <Label>
              {statuses[status]} · {task.command.en}
            </Label>
          </View>
        ) : null;
      })}
    </JournalLeaf>
  );
}

const styles = StyleSheet.create({
  card: { gap: 9 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  info: { flex: 1, gap: 3 },
  strong: { fontSize: 17, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
});
