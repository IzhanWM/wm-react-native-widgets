import type { StoryObj } from '@storybook/react';
import meta from '../meta';

/** The props that visibly change the pad, one per story. Draw to see the ink. */
export default { ...meta, title: 'UI Widgets/Signature Pad/Props' };
type Story = StoryObj<typeof meta>;

/** `penColor` — red ink. Draw on the pad to see it. */
export const PenColor: Story = {
  args: { penColor: '#BE123C' },
  parameters: { source: '<SignaturePad penColor="#BE123C" />' },
};

/** `backgroundColor` — a paper tone, which the exported PNG keeps too. */
export const BackgroundColor: Story = {
  args: { backgroundColor: '#FDF6E3' },
  parameters: { source: '<SignaturePad backgroundColor="#FDF6E3" />' },
};

/** `minWidth` / `maxWidth` — a heavy nib. */
export const StrokeWidth: Story = {
  args: { minWidth: 6, maxWidth: 10 },
  parameters: { source: '<SignaturePad minWidth={6} maxWidth={10} />' },
};
