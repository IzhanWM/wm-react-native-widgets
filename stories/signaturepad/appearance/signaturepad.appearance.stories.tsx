import type { StoryObj } from '@storybook/react';
import meta from '../meta';

export default { ...meta, title: 'UI Widgets/Signature Pad/Appearance' };
type Story = StoryObj<typeof meta>;

/** Classic blue ink on white — the usual look for a consent form. */
export const BlueInk: Story = {
  args: { penColor: '#1E3A8A', backgroundColor: '#FFFFFF' },
};

/** A dark canvas with light ink. */
export const DarkCanvas: Story = {
  args: { penColor: '#F8FAFC', backgroundColor: '#0F172A' },
  parameters: {
    note: 'backgroundColor is baked into the exported PNG, so a dark pad exports a dark image.',
  },
};

/** A warm paper tone. */
export const PaperTone: Story = {
  args: { penColor: '#3F2A14', backgroundColor: '#FDF6E3', minWidth: 2, maxWidth: 5 },
};
