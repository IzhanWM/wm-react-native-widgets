import type { StoryObj } from '@storybook/react';
import meta from '../meta';

export default { ...meta, title: 'UI Widgets/QR Code/Appearance' };
type Story = StoryObj<typeof meta>;

const value = 'https://www.wavemaker.com';

/** Small symbol for dense layouts. */
export const Small: Story = { args: { value, size: 96 } };

/** Large symbol for scan-from-a-distance cases. */
export const Large: Story = { args: { value, size: 280 } };

/** Branded colors. Keep strong contrast between modules and background or scanners fail. */
export const BrandColors: Story = {
  args: { value, size: 200, color: '#1E3A8A', backgroundColor: '#EFF6FF' },
};

/** Inverted palette. */
export const Inverted: Story = {
  args: { value, size: 200, color: '#F8FAFC', backgroundColor: '#0F172A' },
};
