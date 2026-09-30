import type { StoryObj } from '@storybook/react';
import meta from '../meta';
import { STORAGE_SEGMENTS, UNCOLORED_SEGMENTS } from '../../sample-data';

/** The props that visibly change the bar, one per story. */
export default { ...meta, title: 'UI Widgets/Segment Progress/Props' };
type Story = StoryObj<typeof meta>;

/** `total` — 80 GB used of 128, so the free space shows as empty track. */
export const Total: Story = {
  args: { dataset: STORAGE_SEGMENTS, total: 128 },
  parameters: { source: '<SegmentProgress dataset={segments} total={128} />' },
};

/** `barHeight` — a thicker bar. */
export const BarHeight: Story = {
  args: { dataset: STORAGE_SEGMENTS, barHeight: 32 },
  parameters: { source: '<SegmentProgress dataset={segments} barHeight={32} />' },
};

/** `gap` — wider breaks between segments. */
export const Gap: Story = {
  args: { dataset: STORAGE_SEGMENTS, barHeight: 20, gap: 8 },
  parameters: { source: '<SegmentProgress dataset={segments} gap={8} />' },
};

/** `cornerRadius` — square ends instead of rounded caps. */
export const CornerRadius: Story = {
  args: { dataset: STORAGE_SEGMENTS, barHeight: 20, cornerRadius: 0 },
  parameters: { source: '<SegmentProgress dataset={segments} cornerRadius={0} />' },
};

/** `trackColor` — a dark track behind the unused space. */
export const TrackColor: Story = {
  args: { dataset: STORAGE_SEGMENTS, total: 128, barHeight: 20, trackColor: '#1F2937' },
  parameters: { source: '<SegmentProgress dataset={segments} total={128} trackColor="#1F2937" />' },
};

/** `colors` — a custom palette for rows that bring no color of their own. */
export const Colors: Story = {
  args: { dataset: UNCOLORED_SEGMENTS, barHeight: 20, colors: ['#BE123C', '#F97316', '#FACC15', '#84CC16'] },
  parameters: {
    source: "<SegmentProgress dataset={segments} colors={['#BE123C', '#F97316', '#FACC15', '#84CC16']} />",
  },
};
