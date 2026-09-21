import type { StoryObj } from '@storybook/react';
import meta from './meta';

export default { ...meta, title: 'UI Widgets/Signature Pad', tags: ['autodocs'] };
type Story = StoryObj<typeof meta>;

/**
 * Default pad. Draw with a finger or the mouse.
 *
 * Storybook runs the **web** implementation: the native pad draws inside a
 * WebView, which `react-native-web` has no equivalent for, so `signaturepad.web.tsx`
 * captures pointer strokes and rasterizes them instead. Both return the same
 * base64 PNG, so a page never branches on platform.
 */
export const Default: Story = {
  args: {},
  parameters: {
    note: 'Draw here. On web this is the pointer-and-vector implementation; on device it is the WebView canvas. Both emit a base64 PNG.',
    source: '<SignaturePad onSignatureEnd={(e) => upload(e.signature)} />',
  },
};

/** A tinted pen on a tinted canvas. The export keeps the same background. */
export const TintedPen: Story = {
  args: {
    penColor: '#1D4ED8',
    backgroundColor: '#EFF6FF',
  },
};

/** A heavy nib for a bolder signature. */
export const ThickStroke: Story = {
  args: {
    minWidth: 5,
    maxWidth: 9,
  },
  parameters: {
    note: 'On device the stroke tapers between min and max with pointer speed; on web the two are averaged into one width.',
  },
};

/** A fine nib. */
export const ThinStroke: Story = {
  args: {
    minWidth: 1,
    maxWidth: 2,
  },
};
