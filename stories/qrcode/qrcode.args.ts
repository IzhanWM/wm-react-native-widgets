/**
 * ArgTypes for QrCode (common + qrcode).
 * common -> qrcode
 */
import { commonWidgetArgTypes } from '../args/widget-common';

const qrCodeOnlyArgTypes = {
  value: {
    control: 'text',
    description: 'Text or URL to encode.',
  },
  size: {
    control: { type: 'range', min: 80, max: 320, step: 8 },
    description: 'Edge length of the rendered symbol in pixels. Default: 160',
  },
  color: {
    control: 'color',
    description: 'Color of the QR modules (the dark squares). Default: #000000',
  },
  backgroundColor: {
    control: 'color',
    description: 'Background drawn behind the symbol. Default: #FFFFFF',
  },
  logoUrl: {
    control: 'text',
    description: 'Optional logo image drawn at the center of the symbol.',
  },
  logoSize: {
    control: { type: 'range', min: 16, max: 96, step: 4 },
    description: 'Logo edge length in pixels. Default: 40',
  },
  errorCorrection: {
    control: 'select',
    options: ['L', 'M', 'Q', 'H'],
    description:
      'Error correction level. L encodes the most data, H survives the most occlusion. Default: M',
  },
  onError: {
    control: false,
    description: 'Called when the value cannot be encoded.',
  },
} as const;

export const qrCodeArgTypes = {
  ...commonWidgetArgTypes,
  ...qrCodeOnlyArgTypes,
} as const;
