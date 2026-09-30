import type { StoryObj } from '@storybook/react';
import meta from '../meta';

/** The props that visibly change the symbol, one per story. */
export default { ...meta, title: 'UI Widgets/QR Code/Props' };
type Story = StoryObj<typeof meta>;

const value = 'https://www.wavemaker.com';
const logoUrl = 'https://www.wavemaker.com/wp-content/uploads/2021/09/favicon.png';

/** `size` — a bigger symbol that scans from further away. */
export const Size: Story = {
  args: { value, size: 260 },
  parameters: { source: '<QrCode value={url} size={260} />' },
};

/** `color` — tints the dark squares. Keep strong contrast or scanners struggle. */
export const ModuleColor: Story = {
  args: { value, size: 200, color: '#0E7C86' },
  parameters: { source: '<QrCode value={url} color="#0E7C86" />' },
};

/** `backgroundColor` — fills behind the symbol, including the quiet zone. */
export const BackgroundColor: Story = {
  args: { value, size: 200, backgroundColor: '#FEF3C7' },
  parameters: { source: '<QrCode value={url} backgroundColor="#FEF3C7" />' },
};

/** `logoUrl` — a logo in the middle. Pair it with error correction H so it still scans. */
export const CenterLogo: Story = {
  args: { value, size: 220, logoUrl, errorCorrection: 'H' },
  parameters: { source: '<QrCode value={url} logoUrl={logo} errorCorrection="H" />' },
};

/** `logoSize` — a larger logo. */
export const LogoSize: Story = {
  args: { value, size: 220, logoUrl, logoSize: 64, errorCorrection: 'H' },
  parameters: { source: '<QrCode value={url} logoUrl={logo} logoSize={64} errorCorrection="H" />' },
};
