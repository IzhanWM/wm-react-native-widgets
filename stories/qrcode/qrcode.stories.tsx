import type { StoryObj } from '@storybook/react';
import meta from './meta';

export default { ...meta, title: 'UI Widgets/QR Code', tags: ['autodocs'] };
type Story = StoryObj<typeof meta>;

/** Default QR code. Vectors, so it stays crisp at any size on device and web. */
export const Default: Story = {
  args: {
    value: 'https://www.wavemaker.com',
  },
  parameters: {
    source: '<QrCode value="https://www.wavemaker.com" />',
  },
};

/** Encoding arbitrary text rather than a URL. */
export const PlainText: Story = {
  args: {
    value: 'WaveMaker — build apps visually.',
  },
};

/** An empty value is encoded as a single space instead of throwing. */
export const EmptyValue: Story = {
  args: {
    value: '',
  },
  parameters: {
    note: 'An empty value falls back to a single space, so the widget renders a valid symbol rather than erroring.',
  },
};
