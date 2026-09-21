import type { Meta } from '@storybook/react';
import { QrCode } from '@components/qrcode/qrcode';
import { widgetDecorator } from '../widget-decorator';
import { qrCodeArgTypes } from './qrcode.args';

export default {
  title: 'UI Widgets/QR Code/Appearance',
  component: QrCode,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    ...qrCodeArgTypes,
  },
  decorators: [widgetDecorator()],
} satisfies Meta<typeof QrCode>;
