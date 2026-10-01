import { ServerDrivenView } from '@components/serverdrivenview/serverdrivenview';
import type { ServerDrivenStateChangeEvent } from '@components/serverdrivenview';
import type { StoryObj } from '@storybook/react';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import meta from '../meta';
import { Readout } from '../readout';
import { CURRENT_USER, RECENT_ORDERS } from '../../sample-data';
import { ACCOUNT_SPEC, PROFILE_FORM_SPEC } from '../serverdrivenview.specs';

/** How bound Studio variables reach the spec. */
export default { ...meta, title: 'UI Widgets/Server Driven View/Binding' };
type Story = StoryObj<typeof meta>;

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  tool: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#1F2937' },
  toolText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});

function Tool({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.tool}>
      <Text style={styles.toolText}>{label}</Text>
    </Pressable>
  );
}

/**
 * The page updates its variables — here, the buttons above stand in for a
 * service variable refreshing — and the spec re-renders with no extra wiring.
 */
export const LiveVariableUpdate: Story = {
  render: (args) => {
    const [user, setUser] = useState(CURRENT_USER);
    const [orders, setOrders] = useState(RECENT_ORDERS);
    return (
      <View>
        <View style={styles.toolbar}>
          <Tool label="+250 points" onPress={() => setUser((u) => ({ ...u, points: Math.min(u.points + 250, u.nextTierPoints) }))} />
          <Tool label="Toggle tier" onPress={() => setUser((u) => ({ ...u, tier: u.tier === 'gold' ? 'member' : 'gold' }))} />
          <Tool label="Clear orders" onPress={() => setOrders({ dataSet: [] })} />
          <Tool label="Restore orders" onPress={() => setOrders(RECENT_ORDERS)} />
        </View>
        <ServerDrivenView {...args} data={{ user, orders }} />
      </View>
    );
  },
  args: { spec: ACCOUNT_SPEC },
  parameters: {
    note: 'The buttons play the part of Studio variables changing.',
  },
};

/**
 * The form's state is seeded from `data` with `$data`. The variable arrives
 * 1.5 s after mount and the untouched fields fill in; a field the user already
 * edited keeps the edit.
 */
export const LateLoadingVariable: Story = {
  render: (args) => {
    const [user, setUser] = useState<typeof CURRENT_USER | undefined>(undefined);
    const [change, setChange] = useState<ServerDrivenStateChangeEvent>();
    useEffect(() => {
      const timer = setTimeout(() => setUser(CURRENT_USER), 1500);
      return () => clearTimeout(timer);
    }, []);
    return (
      <View>
        <View style={styles.toolbar}>
          <Tool label="Unload variable" onPress={() => setUser(undefined)} />
          <Tool label="Load variable" onPress={() => setUser(CURRENT_USER)} />
          <Tool label="Load another user" onPress={() => setUser({ ...CURRENT_USER, firstName: 'Liam', email: 'liam@example.com', newsletter: false })} />
        </View>
        <ServerDrivenView {...args} data={user} onStateChange={setChange} />
        <Readout label="onStateChange" value={change && { statePath: change.statePath, value: change.value }} />
      </View>
    );
  },
  args: { spec: PROFILE_FORM_SPEC },
  parameters: {
    note: 'data starts undefined and loads after 1.5 s.',
  },
};

/**
 * The spec itself comes from a variable: a JSON string, inside the `dataSet`
 * wrapper a Studio variable hands over. Change the spec and the screen follows.
 */
export const SpecFromVariable: Story = {
  render: (args) => {
    const [compact, setCompact] = useState(false);
    const spec = compact
      ? { root: 'only', elements: { only: { type: 'Card', props: { title: 'Compact layout', subtitle: 'Served by the same variable' }, children: ['name'] }, name: { type: 'Text', props: { text: { $data: '/user/firstName' } } } } }
      : ACCOUNT_SPEC;
    return (
      <View>
        <View style={styles.toolbar}>
          <Tool label={compact ? 'Serve full layout' : 'Serve compact layout'} onPress={() => setCompact((c) => !c)} />
        </View>
        <ServerDrivenView {...args} spec={{ dataSet: JSON.stringify(spec) } as never} />
      </View>
    );
  },
  args: { data: { user: CURRENT_USER, orders: RECENT_ORDERS } },
  parameters: {
    note: 'spec is { dataSet: "<json string>" }, as a Studio variable binds it.',
  },
};
