import type { StoryObj } from '@storybook/react';
import meta from '../meta';
import { STORAGE_SEGMENTS } from '../../sample-data';

export default { ...meta, title: 'UI Widgets/Segment Progress/Total' };
type Story = StoryObj<typeof meta>;

/** total=0 sums the segments, so the bar always fills completely. */
export const SummedTotal: Story = {
  args: { dataset: STORAGE_SEGMENTS, total: 0 },
  parameters: {
    note: 'Segments sum to 80 and total is 0, so the bar is treated as 100% full — use this for a pure breakdown.',
  },
};

/** A fixed total leaves the unused remainder visible as track. */
export const FixedTotal: Story = {
  args: { dataset: STORAGE_SEGMENTS, total: 128 },
  parameters: {
    note: 'Segments sum to 80 of a 128 total, so 48 of capacity stays unfilled.',
  },
};

/** A total below the sum clips the trailing segments at the bar edge. */
export const TotalBelowSum: Story = {
  args: { dataset: STORAGE_SEGMENTS, total: 60 },
};
