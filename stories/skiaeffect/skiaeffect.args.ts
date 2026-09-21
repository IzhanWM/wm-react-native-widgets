/**
 * ArgTypes for SkiaEffect (common + dataset + skiaeffect).
 * common -> dataset -> skiaeffect
 */
import { datasetWidgetArgTypes } from '../args/widget-common';

export const EFFECT_BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
] as const;

const skiaEffectOnlyArgTypes = {
  size: {
    control: { type: 'range', min: 100, max: 400, step: 10 },
    description: 'Canvas edge length in pixels. Default: 200',
  },
  blurAmount: {
    control: { type: 'range', min: 0, max: 80, step: 2 },
    description: 'Gaussian blur radius applied to the blobs. Default: 24',
  },
  blendMode: {
    control: 'select',
    options: EFFECT_BLEND_MODES,
    description:
      'Compositing mode between blobs. The same value maps onto Skia natively and CSS mix-blend-mode on web. Default: screen',
  },
  spread: {
    control: { type: 'range', min: 0, max: 0.5, step: 0.02 },
    description: 'Distance of each blob from the center, as a fraction of size. Default: 0.18',
  },
  backgroundColor: {
    control: 'color',
    description: 'Background painted behind the blobs. Default: transparent',
  },
} as const;

export const skiaEffectArgTypes = {
  ...datasetWidgetArgTypes,
  ...skiaEffectOnlyArgTypes,
} as const;
