/**
 * ArgTypes for SegmentProgress (common + dataset + segmentprogress).
 * common -> dataset -> segmentprogress
 */
import { datasetWidgetArgTypes } from '../args/widget-common';

const segmentProgressOnlyArgTypes = {
  valueField: {
    control: 'text',
    description: "Row field holding each segment's numeric value. Default: value",
  },
  colorField: {
    control: 'text',
    description: 'Row field holding a per-segment color. Default: color',
  },
  total: {
    control: 'number',
    description:
      'Denominator for the bar. 0 sums the segments so the bar always fills; a fixed total shows remaining capacity. Default: 0',
  },
  barHeight: {
    control: { type: 'range', min: 4, max: 48, step: 2 },
    description: 'Bar thickness in pixels. Default: 12',
  },
  gap: {
    control: { type: 'range', min: 0, max: 12, step: 1 },
    description: 'Separator width between adjacent segments. Default: 2',
  },
  cornerRadius: {
    control: { type: 'range', min: 0, max: 24, step: 1 },
    description: "Corner radius applied to each segment's caps. Default: 6",
  },
  trackColor: {
    control: 'color',
    description: 'Color of the unfilled track. Default: #E5E7EB',
  },
  colors: {
    control: 'object',
    description: 'Palette cycled through for rows that carry no color of their own.',
  },
  onSegmentSelect: {
    control: false,
    description: 'Called when the user taps a segment.',
  },
} as const;

export const segmentProgressArgTypes = {
  ...datasetWidgetArgTypes,
  ...segmentProgressOnlyArgTypes,
} as const;
