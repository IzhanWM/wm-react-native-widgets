import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import type { ProgressSegment, SegmentProgressProps } from './segmentprogress.props';
import { rowField, rowKey, toRows } from '../utils/dataset';

export type {
  SegmentProgressProps,
  ProgressSegment,
  SegmentSelectEvent,
} from './segmentprogress.props';

const DEFAULT_PALETTE = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

/**
 * Multi-segment progress bar. Each segment gets its own rounded caps, which
 * stacked views cannot express, so the bar is drawn with `react-native-svg` —
 * vector output that renders identically on iOS, Android and web.
 */
const SegmentProgressComponent = ({
  dataset,
  valueField = 'value',
  colorField = 'color',
  total = 0,
  barHeight = 12,
  gap = 2,
  cornerRadius = 6,
  trackColor = '#E5E7EB',
  colors,
  onSegmentSelect,
  style,
}: SegmentProgressProps) => {
  const [width, setWidth] = useState(0);

  const rows = useMemo(() => toRows(dataset) as ProgressSegment[], [dataset]);

  const palette = colors != null && colors.length > 0 ? colors : DEFAULT_PALETTE;

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setWidth((prev) => (prev === next ? prev : next));
  }, []);

  const bars = useMemo(() => {
    const values = rows.map((row) => {
      const raw = Number(rowField(row, valueField, 'value'));
      return Number.isFinite(raw) ? Math.max(0, raw) : 0;
    });
    const sum = values.reduce((a, b) => a + b, 0);
    const denominator = Number(total) > 0 ? Number(total) : sum;
    if (denominator <= 0 || width <= 0) return [];

    let cursor = 0;
    return values.map((value, index) => {
      const span = (value / denominator) * width;
      const isLast = index === values.length - 1;
      const barWidth = Math.max(0, span - (isLast ? 0 : gap));
      const bar = {
        x: cursor,
        width: barWidth,
        row: rows[index],
        index,
        value,
        percent: (value / denominator) * 100,
      };
      cursor += span;
      return bar;
    });
  }, [rows, valueField, total, width, gap]);

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      {width > 0 && (
        <Svg width={width} height={barHeight}>
          <Rect
            x={0}
            y={0}
            width={width}
            height={barHeight}
            rx={cornerRadius}
            fill={trackColor}
          />
          {bars.map((bar) =>
            bar.width > 0 ? (
              <Rect
                key={rowKey(bar.row, bar.index)}
                x={bar.x}
                y={0}
                width={bar.width}
                height={barHeight}
                rx={cornerRadius}
                fill={
                  rowField(bar.row, colorField, 'color') ??
                  palette[bar.index % palette.length]
                }
                onPress={() =>
                  onSegmentSelect?.({
                    segment: bar.row,
                    index: bar.index,
                    value: bar.value,
                    percent: bar.percent,
                  })
                }
              />
            ) : null
          )}
        </Svg>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { width: '100%', justifyContent: 'center' },
});

export const SegmentProgress = Object.assign(SegmentProgressComponent, {
  displayName: 'SegmentProgress',
});
