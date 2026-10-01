/**
 * The React-free half of ServerDrivenView: spec normalization, paths, state
 * writes, expression resolution and conditions. Everything here is pure and
 * never throws on a malformed spec — a bad value resolves to `undefined` and a
 * bad spec normalizes to `null`, so a page bound to a half-loaded variable
 * renders what it can instead of crashing.
 */
import { toRows, type WidgetRow } from '../utils/dataset';
import type {
  ServerDrivenElement,
  ServerDrivenSpec,
} from './serverdrivenview.props';

/** A parsed path: one segment per object key or array index. */
export type Path = string[];

/** A spec with every form folded into the flat json-render shape. */
export interface NormalizedSpec extends ServerDrivenSpec {
  state: Record<string, unknown>;
}

/** What an expression is resolved against. */
export interface Scope {
  /** The bound `data` prop. */
  data: unknown;
  /** Local UI state. */
  state: Record<string, unknown>;
  /** Current repeat row. */
  item?: unknown;
  /** Current repeat index. */
  index?: number;
  /** State path of the repeated array, when the repeat reads local state. */
  itemStatePath?: Path;
  /** Payload of the event being handled. */
  event?: unknown;
}

/** One local edit, replayed over the seeded state. */
export interface StateWrite {
  path: Path;
  value: unknown;
}

export function isPlainObject(value: unknown): value is Record<string, any> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/**
 * Parses a JSON pointer (`/a/0/b`, with `~1` and `~0` escapes) or a dotted
 * path (`a.0.b`). `""`, `"/"`, `true` and nullish all mean the root.
 */
export function parsePath(path: unknown): Path {
  if (path == null || typeof path === 'boolean') return [];
  const text = String(path).trim();
  if (text === '' || text === '/') return [];
  if (text.startsWith('/')) {
    return text
      .slice(1)
      .split('/')
      .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
  }
  return text.split('.').filter((segment) => segment !== '');
}

/** Formats a path as a JSON pointer, the shape events report. */
export function toPointer(path: Path): string {
  return path.map((segment) => `/${segment.replace(/~/g, '~0').replace(/\//g, '~1')}`).join('');
}

export function getIn(source: unknown, path: Path): unknown {
  let current: any = source;
  for (const segment of path) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[segment];
  }
  return current;
}

const INDEX = /^\d+$/;

/**
 * Immutable set. Missing containers are created — an array when the next
 * segment is an index — and `-` appends to an array, as in JSON Patch.
 */
export function setIn(source: unknown, path: Path, value: unknown): unknown {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  const container: any =
    source != null && typeof source === 'object' ? source : INDEX.test(head) || head === '-' ? [] : {};

  if (Array.isArray(container)) {
    const copy = container.slice();
    const index = head === '-' ? copy.length : Number(head);
    if (!Number.isInteger(index)) return container;
    copy[index] = setIn(copy[index], rest, value);
    return copy;
  }
  return { ...container, [head]: setIn(container[head], rest, value) };
}

function isPrefix(prefix: Path, path: Path): boolean {
  return prefix.length <= path.length && prefix.every((segment, i) => segment === path[i]);
}

/**
 * Records a write. Earlier writes at or below the same path are superseded,
 * so the log stays one entry per edited path however often the user types.
 */
export function addWrite(writes: StateWrite[], path: Path, value: unknown): StateWrite[] {
  return [...writes.filter((write) => !isPrefix(path, write.path)), { path, value }];
}

/** Replays the write log over the seeded state. */
export function applyWrites(base: Record<string, unknown>, writes: StateWrite[]): Record<string, unknown> {
  const next = writes.reduce<unknown>((state, write) => setIn(state, write.path, write.value), base);
  return isPlainObject(next) ? next : {};
}

// ---------------------------------------------------------------------------
// Spec normalization
// ---------------------------------------------------------------------------

/**
 * Folds every accepted spec form into the flat shape: a flat spec, a nested
 * spec (`{ root: node }`), a bare node, any of those as JSON, or any of those
 * inside a Studio `{ dataSet }` wrapper. Returns `null` when nothing usable is
 * there.
 */
export function normalizeSpec(spec: unknown): NormalizedSpec | null {
  let value: unknown = spec;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    try {
      value = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  if (!isPlainObject(value)) return null;
  if (!('root' in value) && !('type' in value) && 'dataSet' in value) {
    return normalizeSpec(value.dataSet);
  }

  const state = isPlainObject(value.state) ? value.state : {};

  if (typeof value.root === 'string' && isPlainObject(value.elements)) {
    return { root: value.root, elements: value.elements as Record<string, ServerDrivenElement>, state };
  }

  const node = isPlainObject(value.root) ? value.root : typeof value.type === 'string' ? value : null;
  if (node == null) return null;

  const elements: Record<string, ServerDrivenElement> = {};
  const root = flatten(node, elements, 'root');
  return root == null ? null : { root, elements, state };
}

function flatten(node: unknown, elements: Record<string, ServerDrivenElement>, fallbackKey: string): string | null {
  const source = typeof node === 'string' ? { type: 'Text', props: { text: node } } : node;
  if (!isPlainObject(source) || typeof source.type !== 'string') return null;

  let key = typeof source.key === 'string' && source.key !== '' ? source.key : fallbackKey;
  while (key in elements) key = `${key}_`;

  const { key: _key, children, state: _state, ...rest } = source;
  const element: ServerDrivenElement = { ...(rest as ServerDrivenElement) };
  // Claim the key before recursing so a child cannot take it.
  elements[key] = element;
  if (Array.isArray(children)) {
    element.children = children
      .map((child, i) => flatten(child, elements, `${key}.${i}`))
      .filter((childKey): childKey is string => childKey != null);
  }
  return key;
}

// ---------------------------------------------------------------------------
// Expressions
// ---------------------------------------------------------------------------

const NO_EXPRESSION = Symbol('no-expression');

/** Keys that turn an object into a value read; checked in this order. */
const SOURCE_KEYS = ['$data', '$state', '$bindState', '$item', '$bindItem', '$index', '$event'] as const;

function readSource(key: (typeof SOURCE_KEYS)[number], ref: unknown, scope: Scope): unknown {
  switch (key) {
    case '$data':
      return getIn(scope.data, parsePath(ref));
    case '$state':
    case '$bindState':
      return getIn(scope.state, parsePath(ref));
    case '$item':
    case '$bindItem':
      return getIn(scope.item, parsePath(ref));
    case '$index':
      return scope.index;
    case '$event':
      return getIn(scope.event, parsePath(ref));
  }
}

function readExpression(value: Record<string, any>, scope: Scope): unknown {
  for (const key of SOURCE_KEYS) {
    if (key in value) return readSource(key, value[key], scope);
  }
  if ('$template' in value) return interpolate(String(value.$template ?? ''), scope);
  if ('$cond' in value) {
    return resolveValue(evaluateCondition(value.$cond, scope) ? value.$then : value.$else, scope);
  }
  return NO_EXPRESSION;
}

/** Resolves every expression inside `value`, recursing through arrays and objects. */
export function resolveValue(value: unknown, scope: Scope): any {
  if (Array.isArray(value)) return value.map((entry) => resolveValue(entry, scope));
  if (!isPlainObject(value)) return value;

  const resolved = readExpression(value, scope);
  if (resolved !== NO_EXPRESSION) return resolved;

  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value)) out[key] = resolveValue(value[key], scope);
  return out;
}

const TEMPLATE_REF = /\$\{([^}]*)\}/g;

/**
 * `${/path}` reads local state, as in json-render. `${$data/path}`,
 * `${$item/field}`, `${$index}` and `${$event/field}` read the other sources;
 * dotted paths work after any prefix (`${$data.user.name}`).
 */
function interpolate(template: string, scope: Scope): string {
  return template.replace(TEMPLATE_REF, (_match, raw: string) => {
    const ref = raw.trim();
    let value: unknown;
    if (ref.startsWith('$index')) value = scope.index;
    else if (ref.startsWith('$data')) value = getIn(scope.data, parsePath(ref.slice(5)));
    else if (ref.startsWith('$item')) value = getIn(scope.item, parsePath(ref.slice(5)));
    else if (ref.startsWith('$event')) value = getIn(scope.event, parsePath(ref.slice(6)));
    else if (ref.startsWith('$state')) value = getIn(scope.state, parsePath(ref.slice(6)));
    else value = getIn(scope.state, parsePath(ref));
    if (value == null) return '';
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
}

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

/** JS truthiness, except an empty array or string counts as false. */
export function isTruthy(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

/** Strict equality, but `1` equals `"1"` — Studio data often carries numbers as strings. */
function looseEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null || typeof a === 'object' || typeof b === 'object') return false;
  return String(a) === String(b);
}

function compare(a: unknown, b: unknown): number | null {
  if (a == null || b == null || a === '' || b === '') return null;
  const x = Number(a);
  const y = Number(b);
  if (Number.isFinite(x) && Number.isFinite(y)) return x - y;
  return String(a).localeCompare(String(b));
}

function toList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value];
}

export function evaluateCondition(condition: unknown, scope: Scope): boolean {
  if (typeof condition === 'boolean') return condition;
  if (Array.isArray(condition)) return condition.every((entry) => evaluateCondition(entry, scope));
  if (!isPlainObject(condition)) return isTruthy(condition);

  if ('$and' in condition) return toList(condition.$and).every((entry) => evaluateCondition(entry, scope));
  if ('$or' in condition) return toList(condition.$or).some((entry) => evaluateCondition(entry, scope));
  if ('$not' in condition) return !evaluateCondition(condition.$not, scope);

  const source = SOURCE_KEYS.find((key) => key in condition);
  const subject = source != null ? readSource(source, condition[source], scope) : resolveValue(condition, scope);
  const operand = (key: string) => resolveValue(condition[key], scope);

  let result: boolean;
  if ('eq' in condition) result = looseEqual(subject, operand('eq'));
  else if ('neq' in condition) result = !looseEqual(subject, operand('neq'));
  else if ('gt' in condition) result = (compare(subject, operand('gt')) ?? 0) > 0;
  else if ('gte' in condition) result = (compare(subject, operand('gte')) ?? -1) >= 0;
  else if ('lt' in condition) result = (compare(subject, operand('lt')) ?? 0) < 0;
  else if ('lte' in condition) result = (compare(subject, operand('lte')) ?? 1) <= 0;
  else if ('in' in condition) {
    const list = operand('in');
    result = Array.isArray(list) && list.some((entry) => looseEqual(entry, subject));
  } else result = isTruthy(subject);

  return condition.not === true ? !result : result;
}

// ---------------------------------------------------------------------------
// Repeat
// ---------------------------------------------------------------------------

export interface RepeatRows {
  rows: WidgetRow[];
  /** Set when the rows come from local state, so `$bindItem` can write back. */
  statePath?: Path;
}

/** Rows an element's `repeat` iterates, through `toRows` so Studio wrappers work. */
export function repeatRows(repeat: ServerDrivenElement['repeat'], scope: Scope): RepeatRows {
  if (repeat == null) return { rows: [] };
  if (repeat.statePath != null) {
    const statePath = parsePath(repeat.statePath);
    return { rows: toRows(getIn(scope.state, statePath)), statePath };
  }
  if (repeat.dataPath != null) {
    return { rows: toRows(getIn(scope.data, parsePath(repeat.dataPath))) };
  }
  if (repeat.itemPath != null) {
    // A list inside the current row stays writable when that row lives in state.
    const itemPath = parsePath(repeat.itemPath);
    const statePath =
      scope.itemStatePath != null && scope.index != null
        ? [...scope.itemStatePath, String(scope.index), ...itemPath]
        : undefined;
    return { rows: toRows(getIn(scope.item, itemPath)), statePath };
  }
  return { rows: [] };
}

/**
 * React key for a repeated row: its `repeat.key` field, else `id`/`key`, else
 * the index. Index keys get their own prefix, so a row pushed without an id at
 * index 2 cannot collide with a sibling whose id is 2.
 */
export function repeatKey(row: WidgetRow, index: number, keyField?: string): string {
  const isObject = row != null && typeof row === 'object';
  const value = keyField != null && isObject ? row[keyField] : undefined;
  if (value != null) return `k:${String(value)}`;
  const own = isObject ? (row.id ?? row.key) : undefined;
  return own != null ? `k:${String(own)}` : `i:${index}`;
}
