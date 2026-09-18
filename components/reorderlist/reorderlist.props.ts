import type { DatasetWidgetProps } from '../widget-props/common';
import type { WidgetRow } from '../utils/dataset';

/** Shape a row is read as. */
export interface ReorderRow extends WidgetRow {
  /** Stable identity; falls back to the row index for the React key. */
  id?: string | number;
  /** Row label, read via `labelField`. */
  label?: string;
}

/** Emitted after a drag settles into a new position. */
export interface ReorderEvent {
  /** The full list in its new order. */
  rows: ReorderRow[];
  /** Index the dragged row started at. */
  from: number;
  /** Index the dragged row landed on. */
  to: number;
  /** The row that moved. */
  row: ReorderRow;
}

/** Emitted when a row is tapped rather than dragged. */
export interface ReorderItemPressEvent {
  /** The row that was tapped. */
  row: ReorderRow;
  /** Its current position in the list. */
  index: number;
}

/**
 * Props for ReorderList.
 * common -> dataset -> reorderlist
 */
export interface ReorderListProps extends DatasetWidgetProps {
  /**
   * Row field shown as the row label.
   * @default 'label'
   */
  labelField?: string;
  /**
   * Fixed row height in pixels.
   * @default 56
   */
  itemHeight?: number;
  /**
   * Row background color.
   * @default '#FFFFFF'
   */
  rowColor?: string;
  /**
   * Row background color while the row is lifted for dragging.
   * @default '#EEF2FF'
   */
  draggingRowColor?: string;
  /**
   * Color of the row label text.
   * @default '#111827'
   */
  labelColor?: string;
  /**
   * Whether to draw a hairline separator under each row.
   * @default true
   */
  showSeparator?: boolean;
  /**
   * Whether dragging is accepted. Set `false` for a read-only list.
   * @default true
   */
  enabled?: boolean;
  /**
   * Called after a drag completes, with the list in its new order.
   */
  onReorder?: (event: ReorderEvent) => void;
  /**
   * Called when the user taps (rather than drags) a row.
   */
  onItemPress?: (event: ReorderItemPressEvent) => void;
}
