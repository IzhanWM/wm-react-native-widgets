import type { StoryObj } from '@storybook/react';
import meta from './meta';
import { GLOW_BLOBS, SUNSET_BLOBS } from '../sample-data';

export default { ...meta, title: 'UI Widgets/Skia Effect', tags: ['autodocs'] };
type Story = StoryObj<typeof meta>;

/**
 * Default effect: three blobs, screen-blended and blurred.
 *
 * Storybook runs the **web** implementation. Skia on web needs the CanvasKit
 * WASM bundle loaded by the host before first render, so `skiaeffect.web.tsx`
 * reproduces the composition with CSS `filter` and `mix-blend-mode` instead —
 * the Skia module never enters the web bundle.
 */
export const Default: Story = {
  args: {
    dataset: GLOW_BLOBS,
  },
  parameters: {
    note: 'On iOS and Android this paints through Skia; here on web it is the CSS filter + mix-blend-mode equivalent, so no WASM is needed.',
    source: '<SkiaEffect dataset={blobs} blendMode="screen" blurAmount={24} />',
  },
};

/** A warmer, four-blob palette. */
export const Sunset: Story = {
  args: {
    dataset: SUNSET_BLOBS,
    size: 260,
  },
};

/** A single blob reads as a soft glow. */
export const SingleGlow: Story = {
  args: {
    dataset: [{ id: 1, color: '#38BDF8', radius: 0.4 }],
    blurAmount: 36,
  },
};

/** An empty dataset renders an empty canvas rather than erroring. */
export const EmptyDataset: Story = {
  args: {
    dataset: [],
  },
};

/** Blend modes need a backdrop to composite against. */
export const OnDarkBackground: Story = {
  args: {
    dataset: GLOW_BLOBS,
    backgroundColor: '#0B1020',
    size: 260,
  },
  parameters: {
    note: 'screen is additive, so it shows its character against a dark ground.',
  },
};
