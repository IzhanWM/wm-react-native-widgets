import type { CommonWidgetProps } from '../widget-props/common';

/** Emitted when a signature stroke completes. */
export interface SignatureEndEvent {
  /**
   * The signature as a base64 PNG data URI (`data:image/png;base64,…`) — the same
   * shape on native and web, so a page can upload it without branching.
   */
  signature: string;
  /** Number of strokes drawn so far. */
  strokeCount: number;
}

/**
 * Imperative handle exposed through `ref`. Both the native and the web
 * implementation satisfy this contract.
 */
export interface SignaturePadHandle {
  /** Erases the canvas and fires `onClear`. */
  clear: () => void;
  /** Forces a read; resolves through `onSignatureEnd`. */
  readSignature: () => void;
  /** Whether nothing has been drawn since the last clear. */
  isEmpty: () => boolean;
}

/**
 * Props for SignaturePad.
 * common -> signaturepad
 */
export interface SignaturePadProps extends CommonWidgetProps {
  /**
   * Stroke color of the drawn signature.
   * @default '#1D1B20'
   */
  penColor?: string;
  /**
   * Background color of the signature canvas.
   * @default '#FFFFFF'
   */
  backgroundColor?: string;
  /**
   * Thinnest stroke width, used at speed.
   * @default 2
   */
  minWidth?: number;
  /**
   * Thickest stroke width, used when the pointer moves slowly.
   * @default 4
   */
  maxWidth?: number;
  /**
   * Called each time the user lifts their finger after a stroke, with the
   * signature as a base64 PNG data URI.
   */
  onSignatureEnd?: (event: SignatureEndEvent) => void;
  /**
   * Called after the canvas is cleared.
   */
  onClear?: () => void;
}
