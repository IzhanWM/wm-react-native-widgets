import type { StoryObj } from '@storybook/react';
import meta from '../meta';
import { GLOW_BLOBS, SUNSET_BLOBS } from '../../sample-data';

export default { ...meta, title: 'UI Widgets/Skia Effect/Appearance' };
type Story = StoryObj<typeof meta>;

/** No blur leaves hard-edged circles, which makes the geometry easy to read. */
export const NoBlur: Story = {
  args: { dataset: GLOW_BLOBS, blurAmount: 0, backgroundColor: '#0B1020' },
};

/** Heavy blur melts the blobs into a single wash. */
export const HeavyBlur: Story = {
  args: { dataset: GLOW_BLOBS, blurAmount: 64, backgroundColor: '#0B1020' },
};

/** Zero spread stacks every blob concentrically. */
export const NoSpread: Story = {
  args: { dataset: SUNSET_BLOBS, spread: 0, backgroundColor: '#0B1020' },
};

/** A wide spread pushes the blobs toward the canvas edge. */
export const WideSpread: Story = {
  args: { dataset: SUNSET_BLOBS, spread: 0.4, backgroundColor: '#0B1020' },
};

/** A large canvas for use as a hero backdrop. */
export const LargeCanvas: Story = {
  args: { dataset: SUNSET_BLOBS, size: 380, blurAmount: 44, backgroundColor: '#0B1020' },
};
