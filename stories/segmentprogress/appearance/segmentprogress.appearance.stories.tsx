import type { StoryObj } from '@storybook/react';
import meta from '../meta';
import { STORAGE_SEGMENTS } from '../../sample-data';

export default { ...meta, title: 'UI Widgets/Segment Progress/Appearance' };
type Story = StoryObj<typeof meta>;

/** A thin bar for inline use under a label. */
export const Thin: Story = {
  args: { dataset: STORAGE_SEGMENTS, barHeight: 6, cornerRadius: 3 },
};

/** A thick bar as a standalone summary. */
export const Thick: Story = {
  args: { dataset: STORAGE_SEGMENTS, barHeight: 32, cornerRadius: 16 },
};

/** Square caps by setting the radius to zero. */
export const SquareCaps: Story = {
  args: { dataset: STORAGE_SEGMENTS, cornerRadius: 0, gap: 2 },
};

/** A wider gap reads as distinct chips rather than one bar. */
export const WideGap: Story = {
  args: { dataset: STORAGE_SEGMENTS, gap: 8, total: 100 },
};

/** No gap runs the segments together. */
export const NoGap: Story = {
  args: { dataset: STORAGE_SEGMENTS, gap: 0 },
};

/** A dark track for use on a dark surface. */
export const DarkTrack: Story = {
  args: { dataset: STORAGE_SEGMENTS, trackColor: '#1F2937', total: 128 },
};
