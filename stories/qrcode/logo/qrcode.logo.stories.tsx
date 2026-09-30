import type { StoryObj } from '@storybook/react';
import meta from '../meta';

export default { ...meta, title: 'UI Widgets/QR Code/Logo' };
type Story = StoryObj<typeof meta>;

const value = 'https://www.wavemaker.com';
const logoUrl = 'https://www.wavemaker.com/wp-content/uploads/2021/09/favicon.png';

/** A centered logo, with error correction `H` so the code still scans. */
export const WithLogo: Story = {
  args: { value, size: 220, logoUrl, logoSize: 48, errorCorrection: 'H' },
  parameters: {
    note: 'Test logo codes with a real scanner.',
  },
};

/** Error correction L encodes the most data but tolerates the least occlusion. */
export const LowCorrection: Story = {
  args: { value, size: 220, errorCorrection: 'L' },
};

/** Error correction H is the most robust and the right pairing for a logo. */
export const HighCorrection: Story = {
  args: { value, size: 220, errorCorrection: 'H' },
};
