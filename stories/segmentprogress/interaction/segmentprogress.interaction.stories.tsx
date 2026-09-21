import { SegmentProgress } from '@components/segmentprogress/segmentprogress';
import type { SegmentSelectEvent } from '@components/segmentprogress';
import type { StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import meta from '../meta';
import { STORAGE_SEGMENTS } from '../../sample-data';

export default { ...meta, title: 'UI Widgets/Segment Progress/Interaction' };
type Story = StoryObj<typeof meta>;

const styles = StyleSheet.create({
  readout: {
    marginTop: 16,
    padding: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  readoutText: { fontSize: 13, color: '#1E3A8A' },
});

/** Tapping a segment emits its row, value and share of the bar. */
export const OnSegmentSelect: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<SegmentSelectEvent | null>(null);
    return (
      <View>
        <SegmentProgress {...args} onSegmentSelect={(event) => setSelected(event)} />
        <View style={styles.readout}>
          <Text style={styles.readoutText}>
            {selected == null
              ? 'Tap a segment.'
              : `${String(selected.segment.label)} — ${selected.value} (${selected.percent.toFixed(1)}% of the bar).`}
          </Text>
        </View>
      </View>
    );
  },
  args: {
    dataset: STORAGE_SEGMENTS,
    barHeight: 24,
    total: 100,
  },
};
