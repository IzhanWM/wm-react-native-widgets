import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReorderableList, {
  reorderItems,
  useReorderableDrag,
  useIsActive,
} from 'react-native-reorderable-list';
import type {
  ReorderListProps,
  ReorderRow,
} from './reorderlist.props';
import { rowField, rowKey, rowsSignature, toRows } from '../utils/dataset';

export type {
  ReorderListProps,
  ReorderRow,
  ReorderEvent,
  ReorderItemPressEvent,
} from './reorderlist.props';

interface RowProps {
  row: ReorderRow;
  index: number;
  labelField: string;
  itemHeight: number;
  rowColor: string;
  draggingRowColor: string;
  labelColor: string;
  showSeparator: boolean;
  enabled: boolean;
  onItemPress?: (row: ReorderRow, index: number) => void;
}

/**
 * `useReorderableDrag` and `useIsActive` are only valid inside a row rendered by
 * `ReorderableList`, so the row lives in its own component.
 */
const Row = ({
  row,
  index,
  labelField,
  itemHeight,
  rowColor,
  draggingRowColor,
  labelColor,
  showSeparator,
  enabled,
  onItemPress,
}: RowProps) => {
  const drag = useReorderableDrag();
  const isActive = useIsActive();
  const label = rowField(row, labelField, 'label', 'name', 'title');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label != null ? String(label) : `Row ${index + 1}`}
      accessibilityHint={enabled ? 'Press and hold to reorder' : undefined}
      style={[
        styles.row,
        {
          height: itemHeight,
          backgroundColor: isActive ? draggingRowColor : rowColor,
        },
        showSeparator && styles.rowSeparator,
        isActive && styles.rowActive,
      ]}
      onLongPress={enabled ? drag : undefined}
      delayLongPress={200}
      onPress={() => onItemPress?.(row, index)}
    >
      <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
        {label != null ? String(label) : ''}
      </Text>
      {enabled && <View style={styles.grip} />}
    </Pressable>
  );
};

/**
 * Drag-to-reorder list. Long-press a row to lift it, drag to a new position, and
 * the reordered list is handed back to the page.
 *
 * `react-native-reorderable-list` is pure JavaScript over Reanimated and Gesture
 * Handler — it declares no native modules — so it also runs under
 * `react-native-web`. Upstream tests iOS and Android only; treat web drag as
 * best-effort and keep a non-drag path (tap, or a sort control) for web users.
 */
const ReorderListComponent = ({
  dataset,
  labelField = 'label',
  itemHeight = 56,
  rowColor = '#FFFFFF',
  draggingRowColor = '#EEF2FF',
  labelColor = '#111827',
  showSeparator = true,
  enabled = true,
  onReorder,
  onItemPress,
  style,
}: ReorderListProps) => {
  const incoming = useMemo(() => toRows(dataset) as ReorderRow[], [dataset]);
  const [rows, setRows] = useState<ReorderRow[]>(incoming);

  // The list owns order locally while dragging, so it only re-syncs when the
  // incoming rows actually change. Keying this on the array's identity would
  // discard a completed reorder the next time the page re-rendered.
  const signature = useMemo(() => rowsSignature(incoming), [incoming]);
  useEffect(() => {
    setRows(incoming);
    // `incoming` is intentionally omitted: `signature` is its content identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const handleReorder = useCallback(({ from, to }: { from: number; to: number }) => {
    setRows((current) => {
      const next = reorderItems(current, from, to);
      const moved = current[from];
      if (moved !== undefined) {
        onReorderRef.current?.({ rows: next, from, to, row: moved });
      }
      return next;
    });
  }, []);

  const handleItemPress = useCallback(
    (row: ReorderRow, index: number) => {
      onItemPress?.({ row, index });
    },
    [onItemPress]
  );

  return (
    <View style={[styles.root, style]}>
      <ReorderableList
        data={rows}
        onReorder={handleReorder}
        keyExtractor={(item: ReorderRow, index: number) => rowKey(item, index)}
        renderItem={({ item, index }: { item: ReorderRow; index: number }) => (
          <Row
            row={item}
            index={index}
            labelField={labelField}
            itemHeight={itemHeight}
            rowColor={rowColor}
            draggingRowColor={draggingRowColor}
            labelColor={labelColor}
            showSeparator={showSeparator}
            enabled={enabled}
            onItemPress={handleItemPress}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  rowSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  rowActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  label: { fontSize: 15, flex: 1 },
  grip: {
    width: 18,
    height: 2,
    backgroundColor: '#9CA3AF',
    borderRadius: 1,
  },
});

export const ReorderList = Object.assign(ReorderListComponent, {
  displayName: 'ReorderList',
});
