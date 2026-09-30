import type { StoryObj } from '@storybook/react';
import meta from '../meta';
import { STORAGE_SEGMENTS } from '../../sample-data';

export default { ...meta, title: 'UI Widgets/Segment Progress/Total' };
type Story = StoryObj<typeof meta>;

/** total=0 sums the segments, so the bar always fills completely. */
export const SummedTotal: Story = {
  args: { dataset: STORAGE_SEGMENTS, total: 0 },
  parameters: {
    note: 'total is 0, so the bar always fills.',
  },
};

/** A fixed total leaves the unused remainder visible as track. */
export const FixedTotal: Story = {
  args: { dataset: STORAGE_SEGMENTS, total: 128 },
  parameters: {
    note: '80 of 128 used.',
  },
};

/** A total below the sum clips the trailing segments at the bar edge. */
export const TotalBelowSum: Story = {
  args: { dataset: STORAGE_SEGMENTS, total: 60 },
};
