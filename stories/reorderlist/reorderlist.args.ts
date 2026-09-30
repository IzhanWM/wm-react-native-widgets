/**
 * ArgTypes for ReorderList (common + dataset + reorderlist).
 * common -> dataset -> reorderlist
 */
import { datasetWidgetArgTypes } from '../args/widget-common';

const reorderListOnlyArgTypes = {
  labelField: { control: 'text', description: 'Row field shown as the row label. Default: label' },
  itemHeight: {
    control: { type: 'range', min: 36, max: 96, step: 4 },
    description: 'Fixed row height in pixels. Default: 56',
  },
  rowColor: { control: 'color', description: 'Row background color. Default: #FFFFFF' },
  draggingRowColor: {
    control: 'color',
    description: 'Row background while it is lifted for dragging. Default: #EEF2FF',
  },
  labelColor: { control: 'color', description: 'Color of the row label text. Default: #111827' },
  showSeparator: { control: 'boolean', description: 'Draw a hairline under each row. Default: true' },
  enabled: { control: 'boolean', description: 'Whether dragging is accepted. Default: true' },
  onReorder: { control: false, description: 'Called after a drag completes, with the list in its new order.' },
  onItemPress: { control: false, description: 'Called when a row is tapped rather than dragged.' },
} as const;

export const reorderListArgTypes = {
  ...datasetWidgetArgTypes,
  ...reorderListOnlyArgTypes,
} as const;
