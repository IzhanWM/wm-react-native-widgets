import type { CommonWidgetProps } from '../widget-props/common';

/** Error correction level: higher levels survive more damage but encode less data. */
export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

/** Emitted when the value cannot be encoded into a QR symbol. */
export interface QrCodeErrorEvent {
  /** Underlying error thrown by the encoder. */
  error: unknown;
  /** The value that failed to encode. */
  value: string;
}

/**
 * Props for QrCode.
 * common -> qrcode
 */
export interface QrCodeProps extends CommonWidgetProps {
  /**
   * Text or URL to encode.
   * @default 'https://www.wavemaker.com'
   */
  value?: string;
  /**
   * Edge length of the rendered symbol in pixels.
   * @default 160
   */
  size?: number;
  /**
   * Color of the QR modules (the dark squares).
   * @default '#000000'
   */
  color?: string;
  /**
   * Background color drawn behind the symbol.
   * @default '#FFFFFF'
   */
  backgroundColor?: string;
  /**
   * Optional logo image drawn at the center of the symbol.
   * Use `errorCorrection` of `Q` or `H` when a logo covers part of the code.
   */
  logoUrl?: string;
  /**
   * Logo edge length in pixels.
   * @default 40
   */
  logoSize?: number;
  /**
   * Error correction level. `H` tolerates the most occlusion — pair it with a logo.
   * @default 'M'
   */
  errorCorrection?: QrErrorCorrection;
  /**
   * Called when the value cannot be encoded (for example, too long for the chosen level).
   */
  onError?: (event: QrCodeErrorEvent) => void;
}
