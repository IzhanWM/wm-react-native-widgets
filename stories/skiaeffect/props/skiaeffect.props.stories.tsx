import type { StoryObj } from '@storybook/react';
import meta from '../meta';
import { GLOW_BLOBS, SUNSET_BLOBS } from '../../sample-data';

/** The props that visibly change the effect, one per story. */
export default { ...meta, title: 'UI Widgets/Blur Effect/Props' };
type Story = StoryObj<typeof meta>;

const backgroundColor = '#0B1020';

/** `size` — a larger canvas. */
export const Size: Story = {
  args: { dataset: GLOW_BLOBS, size: 340, backgroundColor },
  parameters: { source: '<SkiaEffect dataset={blobs} size={340} />' },
};

/** `blurAmount` — no blur, so the blobs are hard-edged circles. */
export const BlurAmount: Story = {
  args: { dataset: GLOW_BLOBS, blurAmount: 0, backgroundColor },
  parameters: { source: '<SkiaEffect dataset={blobs} blurAmount={0} />' },
};

/** `blendMode` — difference inverts the colors where blobs overlap. */
export const BlendMode: Story = {
  args: { dataset: GLOW_BLOBS, blendMode: 'difference', backgroundColor },
  parameters: { source: '<SkiaEffect dataset={blobs} blendMode="difference" />' },
};

/** `spread` — blobs pushed out toward the edge. */
export const Spread: Story = {
  args: { dataset: SUNSET_BLOBS, spread: 0.4, backgroundColor },
  parameters: { source: '<SkiaEffect dataset={blobs} spread={0.4} />' },
};

/** `backgroundColor` — a light ground, here with multiply blending. */
export const BackgroundColor: Story = {
  args: { dataset: GLOW_BLOBS, backgroundColor: '#F8FAFC', blendMode: 'multiply' },
  parameters: { source: '<SkiaEffect dataset={blobs} backgroundColor="#F8FAFC" blendMode="multiply" />' },
};
