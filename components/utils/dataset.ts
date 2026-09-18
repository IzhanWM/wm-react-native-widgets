/**
 * Dataset normalization shared by every data-driven widget.
 *
 * WaveMaker Studio binds a `dataset` prop from a variable, a live variable page,
 * or a static JSON string, so the same widget can receive any of these shapes:
 *
 * - an array of rows (already normalized)
 * - a JSON string that parses to an array
 * - a Studio dataset wrapper (`{ dataSet }`, `{ content }`, or `{ data }`)
 */
export type WidgetDataset = unknown;

/** Row shape widgets read fields from. Studio rows are untyped bags of values. */
export type WidgetRow = Record<string, any>;

/**
 * Coerces any Studio-bound `dataset` value into a plain array of rows.
 * Returns an empty array (never throws) when the value is missing or unparseable,
 * so a widget bound to a not-yet-loaded variable renders its empty state.
 */
export function toRows(dataset: WidgetDataset): WidgetRow[] {
  if (dataset == null) return [];
  if (Array.isArray(dataset)) return dataset as WidgetRow[];

  if (typeof dataset === 'string') {
    const trimmed = dataset.trim();
    if (trimmed === '') return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? (parsed as WidgetRow[]) : [];
    } catch {
      return [];
    }
  }

  if (typeof dataset === 'object') {
    const wrapper = dataset as { dataSet?: unknown; content?: unknown; data?: unknown };
    const inner = wrapper.dataSet ?? wrapper.content ?? wrapper.data;
    if (Array.isArray(inner)) return inner as WidgetRow[];
  }

  return [];
}

/** Reads `field` off a row, falling back through `fallbacks` then to `undefined`. */
export function rowField(row: WidgetRow | undefined, field: string, ...fallbacks: string[]): any {
  if (row == null) return undefined;
  if (row[field] != null) return row[field];
  for (const name of fallbacks) {
    if (row[name] != null) return row[name];
  }
  return undefined;
}

/** Stable React key for a row: its `id` when present, else the index. */
export function rowKey(row: WidgetRow | undefined, index: number): string {
  const id = row?.id ?? row?.key;
  return id != null ? String(id) : String(index);
}

/**
 * Cheap content signature for a row list, used to decide whether a widget's
 * local state (a deck position, a dragged order) should reset.
 *
 * A Studio page can hand a widget a freshly built array on every render even
 * when nothing changed. Keying an effect on the array's identity would then
 * reset that state constantly — snapping a half-dragged deck back to the top, or
 * discarding a reorder the moment the page re-renders. Keying on this signature
 * resets only when the rows themselves actually change.
 */
export function rowsSignature(rows: WidgetRow[]): string {
  return `${rows.length}:${rows.map((row, index) => rowKey(row, index)).join('|')}`;
}
