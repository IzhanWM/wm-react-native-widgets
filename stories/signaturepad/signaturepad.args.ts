/**
 * ArgTypes for SignaturePad (common + signaturepad).
 * common -> signaturepad
 */
import { commonWidgetArgTypes } from '../args/widget-common';

const signaturePadOnlyArgTypes = {
  penColor: { control: 'color', description: 'Stroke color of the signature. Default: #1D1B20' },
  backgroundColor: {
    control: 'color',
    description: 'Canvas background, and the background of the exported PNG. Default: #FFFFFF',
  },
  minWidth: {
    control: { type: 'range', min: 0.5, max: 10, step: 0.5 },
    description:
      'Thinnest stroke width, used at speed. On web min and max are averaged into one fixed width. Default: 2',
  },
  maxWidth: {
    control: { type: 'range', min: 0.5, max: 16, step: 0.5 },
    description: 'Thickest stroke width, used when the pointer moves slowly. Default: 4',
  },
  onSignatureEnd: {
    control: false,
    description: 'Called on finger-up with the signature as a base64 PNG data URI.',
  },
  onClear: { control: false, description: 'Called after the canvas is cleared.' },
} as const;

export const signaturePadArgTypes = {
  ...commonWidgetArgTypes,
  ...signaturePadOnlyArgTypes,
} as const;
