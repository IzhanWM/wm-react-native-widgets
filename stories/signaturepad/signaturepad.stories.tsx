import type { StoryObj } from '@storybook/react';
import meta from './meta';

export default { ...meta, title: 'UI Widgets/Signature Pad', tags: ['autodocs'] };
type Story = StoryObj<typeof meta>;

/** Draw with a finger or the mouse. Every platform emits a base64 PNG. */
export const Default: Story = {
  args: {},
  parameters: {
    note: 'Draw here.',
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
    note: 'Web averages minWidth and maxWidth into one width.',
  },
};

/** A fine nib. */
export const ThinStroke: Story = {
  args: {
    minWidth: 1,
    maxWidth: 2,
  },
};
