import type { StoryObj } from '@storybook/react';
import meta from './meta';
import { STORAGE_SEGMENTS, UNCOLORED_SEGMENTS } from '../sample-data';

export default { ...meta, title: 'UI Widgets/Segment Progress', tags: ['autodocs'] };
type Story = StoryObj<typeof meta>;

/** Default bar. Each segment keeps its own rounded caps — the reason this is drawn as vectors. */
export const Default: Story = {
  args: {
    dataset: STORAGE_SEGMENTS,
  },
  parameters: {
    source: '<SegmentProgress dataset={segments} />',
  },
};

/** Rows with no color cycle through the built-in palette. */
export const PaletteFallback: Story = {
  args: {
    dataset: UNCOLORED_SEGMENTS,
  },
};

/** A custom palette applied to uncolored rows. */
export const CustomPalette: Story = {
  args: {
    dataset: UNCOLORED_SEGMENTS,
    colors: ['#0F766E', '#0EA5E9', '#6366F1', '#EC4899'],
  },
};

/** A single segment behaves as an ordinary progress bar. */
export const SingleSegment: Story = {
  args: {
    dataset: [{ id: 'used', label: 'Used', value: 62, color: '#2563EB' }],
    total: 100,
  },
};

/** An empty dataset renders the bare track. */
export const EmptyDataset: Story = {
  args: {
    dataset: [],
    total: 100,
  },
  parameters: {
    note: 'With no rows and a fixed total the widget still paints its track, so the layout does not jump once data arrives.',
  },
};
