import type { StoryObj } from '@storybook/react';
import meta from '../meta';
import { GLOW_BLOBS } from '../../sample-data';

export default { ...meta, title: 'UI Widgets/Skia Effect/Blend' };
type Story = StoryObj<typeof meta>;

const base = { dataset: GLOW_BLOBS, size: 240, backgroundColor: '#0B1020' };

/** No blending — later blobs simply paint over earlier ones. */
export const Normal: Story = { args: { ...base, blendMode: 'normal' } };

/** Additive. The classic glow, and the default. */
export const Screen: Story = { args: { ...base, blendMode: 'screen' } };

/** Subtractive; best read on a light ground. */
export const Multiply: Story = {
  args: { ...base, blendMode: 'multiply', backgroundColor: '#F8FAFC' },
};

/** Contrast-preserving mix of multiply and screen. */
export const Overlay: Story = { args: { ...base, blendMode: 'overlay' } };

/** Keeps the lighter of each pair of pixels. */
export const Lighten: Story = { args: { ...base, blendMode: 'lighten' } };

/** Inverts where the blobs overlap. */
export const Difference: Story = { args: { ...base, blendMode: 'difference' } };

/** Softer than difference. */
export const Exclusion: Story = { args: { ...base, blendMode: 'exclusion' } };
