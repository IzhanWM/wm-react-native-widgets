import { ReorderList } from '@components/reorderlist/reorderlist';
import type { StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import meta from '../meta';
import { widgetDecorator } from '../../widget-decorator';
import { RELEASE_TASKS } from '../../sample-data';

// These stories draw their own list frame with the readout under it, so the
// meta's frame decorator is replaced rather than nested — it would clip the readout.
export default {
  ...meta,
  title: 'UI Widgets/Reorder List/Interaction',
  decorators: [widgetDecorator()],
};
type Story = StoryObj<typeof meta>;

const styles = StyleSheet.create({
  frame: {
    width: 380,
    maxWidth: '100%',
    height: 340,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  readout: {
    marginTop: 16,
    padding: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  readoutText: { fontSize: 13, color: '#1E3A8A' },
});

/** A finished drag emits the moved row, where it went, and the whole list in its new order. */
export const OnReorder: Story = {
  render: (args) => {
    const [summary, setSummary] = useState<string | null>(null);
    return (
      <View>
        <GestureHandlerRootView style={styles.frame}>
          <ReorderList
            {...args}
            onReorder={(event) =>
              setSummary(
                `Moved "${String(event.row.label)}" from ${event.from} to ${event.to}.\nNew order: ${event.rows
                  .map((row) => row.id)
                  .join(', ')}`
              )
            }
          />
        </GestureHandlerRootView>
        <View style={styles.readout}>
          <Text style={styles.readoutText}>{summary ?? 'Press and hold a row, then drag it.'}</Text>
        </View>
      </View>
    );
  },
  args: { dataset: RELEASE_TASKS },
};

/** A tap, rather than a drag, emits the row and its current position. */
export const OnItemPress: Story = {
  render: (args) => {
    const [summary, setSummary] = useState<string | null>(null);
    return (
      <View>
        <GestureHandlerRootView style={styles.frame}>
          <ReorderList
            {...args}
            onItemPress={(event) => setSummary(`Tapped "${String(event.row.label)}" at index ${event.index}.`)}
          />
        </GestureHandlerRootView>
        <View style={styles.readout}>
          <Text style={styles.readoutText}>{summary ?? 'Tap a row.'}</Text>
        </View>
      </View>
    );
  },
  args: { dataset: RELEASE_TASKS },
};

/** `enabled={false}` makes the list read-only: rows ignore press-and-drag. */
export const ReadOnly: Story = {
  render: (args) => (
    <GestureHandlerRootView style={styles.frame}>
      <ReorderList {...args} />
    </GestureHandlerRootView>
  ),
  args: { dataset: RELEASE_TASKS, enabled: false },
  parameters: {
    note: 'Try dragging a row — it stays put.',
  },
};
