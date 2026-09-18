import type { DatasetWidgetProps } from '../widget-props/common';
import type { WidgetRow } from '../utils/dataset';

/** Shape a row is read as. */
export interface ProgressSegment extends WidgetRow {
  /** Stable identity; falls back to the row index for the React key. */
  id?: string | number;
  /** Magnitude of this segment, read via `valueField`. */
  value?: number;
  /** Per-segment color override; otherwise the built-in palette cycles. */
  color?: string;
  /** Human label, surfaced on the select event for the page to display. */
  label?: string;
}

/** Emitted when a segment is tapped. */
export interface SegmentSelectEvent {
  /** The bound row behind the tapped segment. */
  segment: ProgressSegment;
  /** Position of the segment in the bar. */
  index: number;
  /** Numeric value read from the row. */
  value: number;
  /** Share of the bar this segment occupies, 0–100. */
  percent: number;
}

/**
 * Props for SegmentProgress.
 * common -> dataset -> segmentprogress
 */
export interface SegmentProgressProps extends DatasetWidgetProps {
  /**
   * Row field holding each segment's numeric value.
   * @default 'value'
   */
  valueField?: string;
  /**
   * Row field holding a per-segment color. Falls back to the built-in palette.
   * @default 'color'
   */
  colorField?: string;
  /**
   * Denominator for the bar. When `0`, the segment values are summed, so the bar
   * always fills completely. Set a fixed total to show remaining capacity.
   * @default 0
   */
  total?: number;
  /**
   * Bar thickness in pixels.
   * @default 12
   */
  barHeight?: number;
  /**
   * Separator width in pixels between adjacent segments.
   * @default 2
   */
  gap?: number;
  /**
   * Corner radius applied to each segment's caps.
   * @default 6
   */
  cornerRadius?: number;
  /**
   * Color of the unfilled track behind the segments.
   * @default '#E5E7EB'
   */
  trackColor?: string;
  /**
   * Colors cycled through when a row carries no color of its own.
   */
  colors?: string[];
  /**
   * Called when the user taps a segment.
   */
  onSegmentSelect?: (event: SegmentSelectEvent) => void;
}
