import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import {
  formatScenarioAmount,
  formatScenarioSelection,
  scenarioSelectionTotal,
  type MenuScenarioDefinition,
  type MenuScenarioState,
} from '@lingoquest/offline-engine';
import { JournalLeaf } from '../Journal';
import { useTheme } from '../theme';

const english = Platform.OS === 'web' ? { lang: 'en-US' } : { accessibilityLanguage: 'en-US' };
const phaseLabel = {
  initial: 'Por confirmar',
  menu: 'Por confirmar',
  selected: 'Por confirmar',
  confirmed: 'Confirmado',
  closed: 'Confirmado',
  complete: 'Completado',
};
const maxPlannedPortions = 9;

export function ScenarioBoard({
  definition,
  state,
  showMenu,
  planning,
  disabled,
}: {
  definition: MenuScenarioDefinition;
  state?: MenuScenarioState;
  showMenu: boolean;
  planning: boolean;
  disabled: boolean;
}) {
  const { colors } = useTheme();
  const [portions, setPortions] = useState<Record<string, number>>({});
  const planned = Object.entries(portions).map(([itemId, quantity]) => ({ itemId, quantity }));
  const estimated = scenarioSelectionTotal(definition, planned);
  const overBudget = definition.budget !== undefined && estimated > definition.budget;
  const amount = (price: number) => formatScenarioAmount(definition, price);

  function changePortion(itemId: string, delta: number) {
    setPortions((previous) => ({
      ...previous,
      [itemId]: Math.min(maxPlannedPortions, Math.max(0, (previous[itemId] ?? 0) + delta)),
    }));
  }

  return (
    <>
      {showMenu && (
        <JournalLeaf compact kind="notebook" testID="travel-scenario-menu" style={styles.card}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
            {definition.title.es}
          </Text>
          {definition.participants.map(({ id, name, noteEs }) => (
            <Text key={id} style={[styles.partyNote, { color: colors.muted }]}>
              <Text style={styles.emphasis}>{name}</Text> · {noteEs}
            </Text>
          ))}
          {definition.menu.map((item) => {
            const count = portions[item.id] ?? 0;
            return (
              <View key={item.id} style={[styles.row, { borderTopColor: colors.line }]}>
                <View style={styles.item}>
                  <Text {...english} style={[styles.itemName, { color: colors.ink }]}>
                    {item.label.en}
                  </Text>
                  <Text style={[styles.detail, { color: colors.muted }]}>{amount(item.price)}</Text>
                </View>
                {planning && (
                  <View style={styles.quantity}>
                    <PortionControl
                      itemId={item.id}
                      label={item.label.en}
                      delta={-1}
                      disabled={disabled || count === 0}
                      onPress={() => changePortion(item.id, -1)}
                    />
                    <Text
                      accessibilityLiveRegion="polite"
                      accessibilityLabel={`${item.label.en}, ${count} porciones en el cálculo`}
                      testID={`travel-scenario-planning-${item.id}`}
                      style={[styles.count, { color: colors.ink }]}
                    >
                      {count}
                    </Text>
                    <PortionControl
                      itemId={item.id}
                      label={item.label.en}
                      delta={1}
                      disabled={disabled || count >= maxPlannedPortions}
                      onPress={() => changePortion(item.id, 1)}
                    />
                  </View>
                )}
              </View>
            );
          })}
          {(definition.budget !== undefined || planning) && (
            <View style={[styles.summary, { borderTopColor: colors.line }]}>
              {definition.budget !== undefined && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.detail, { color: colors.muted }]}>Presupuesto</Text>
                  <Text style={[styles.itemName, { color: colors.ink }]}>
                    {amount(definition.budget)}
                  </Text>
                </View>
              )}
              {planning && (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.itemName, { color: colors.ink }]}>Total estimado</Text>
                    <Text
                      accessibilityLiveRegion="polite"
                      testID="travel-scenario-planning-total"
                      style={[styles.itemName, { color: overBudget ? colors.red : colors.teal }]}
                    >
                      {amount(estimated)}
                    </Text>
                  </View>
                  {overBudget && (
                    <Text style={[styles.detail, { color: colors.red }]}>
                      Este cálculo supera el presupuesto.
                    </Text>
                  )}
                  <Text style={[styles.detail, { color: colors.muted }]}>
                    Calcula las porciones aquí y escribe tu pedido en inglés.
                  </Text>
                </>
              )}
            </View>
          )}
        </JournalLeaf>
      )}
      {!!state?.lines.length && (
        <JournalLeaf compact kind="notebook" testID="travel-scenario-order" style={styles.card}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
            Tu pedido
          </Text>
          <Text {...english} style={[styles.itemName, { color: colors.ink }]}>
            {formatScenarioSelection(definition, state)}
          </Text>
          <Text style={[styles.detail, { color: colors.teal }]}>{phaseLabel[state.phase]}</Text>
          {state.phase === 'complete' && state.total !== undefined && (
            <View testID="travel-scenario-bill" style={styles.summaryRow}>
              <Text style={[styles.itemName, { color: colors.ink }]}>Tu cuenta</Text>
              <Text style={[styles.itemName, { color: colors.teal }]}>{amount(state.total)}</Text>
            </View>
          )}
        </JournalLeaf>
      )}
    </>
  );
}

function PortionControl({
  itemId,
  label,
  delta,
  disabled,
  onPress,
}: {
  itemId: string;
  label: string;
  delta: -1 | 1;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const Icon = delta === 1 ? Plus : Minus;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${delta === 1 ? 'Agregar' : 'Quitar'} una porción de ${label}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      testID={`travel-scenario-${delta === 1 ? 'add' : 'remove'}-${itemId}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        { borderColor: colors.line, backgroundColor: colors.mint },
        (disabled || pressed) && styles.dimmed,
      ]}
    >
      <Icon color={colors.teal} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8, padding: 12 },
  title: { fontFamily: 'LoraBold', fontSize: 20 },
  partyNote: { fontFamily: 'Manrope', fontSize: 14, lineHeight: 20 },
  emphasis: { fontFamily: 'ManropeBold' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 7, borderTopWidth: 1 },
  item: { flex: 1, minWidth: 0, gap: 2 },
  itemName: { fontFamily: 'ManropeBold', fontSize: 16, flexShrink: 1 },
  detail: { fontFamily: 'Manrope', fontSize: 14, lineHeight: 20 },
  quantity: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  count: { minWidth: 20, fontFamily: 'ManropeBold', fontSize: 16, textAlign: 'center' },
  control: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 22,
  },
  dimmed: { opacity: 0.5 },
  summary: { borderTopWidth: 1, paddingTop: 8, gap: 7 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
});
