import type { DatasetWidgetProps } from '../widget-props/common';
import type { WidgetRow } from '../utils/dataset';

/**
 * Blend modes shared by Skia (native) and CSS `mix-blend-mode` (web), so the
 * same value produces the same compositing on both.
 */
export type EffectBlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

/** Shape a blob row is read as. */
export interface EffectBlob extends WidgetRow {
  /** Stable identity; falls back to the row index for the React key. */
  id?: string | number;
  /** Blob color. */
  color?: string;
  /** Blob radius as a fraction of `size`, 0–1. Defaults to `0.3`. */
  radius?: number;
}

/**
 * Props for SkiaEffect.
 * common -> dataset -> skiaeffect
 */
export interface SkiaEffectProps extends DatasetWidgetProps {
  /**
   * Canvas edge length in pixels.
   * @default 200
   */
  size?: number;
  /**
   * Gaussian blur radius applied to the blobs, in pixels.
   * @default 24
   */
  blurAmount?: number;
  /**
   * Compositing mode used between blobs. `screen` produces the classic
   * additive "lava lamp" look.
   * @default 'screen'
   */
  blendMode?: EffectBlendMode;
  /**
   * Distance of each blob from the center, as a fraction of `size`.
   * @default 0.18
   */
  spread?: number;
  /**
   * Background painted behind the blobs. Transparent by default so the effect
   * composites onto whatever sits below it.
   * @default 'transparent'
   */
  backgroundColor?: string;
}
