/**
 * The style spec: one JSON that sets how every element of a ServerDrivenView
 * looks — named colors, spacing, radii, fonts and text styles, per-component
 * part styles with variants, reusable classes, and modes such as `dark`. It is
 * merged over {@link DEFAULT_STYLE_SPEC}, so a theme only lists what it changes.
 *
 * Pure and React-free like the engine: a malformed theme falls back to the
 * defaults instead of throwing.
 */
import { isPlainObject } from './serverdrivenview.engine';
import type {
  ServerDrivenStyle,
  ServerDrivenStyleSpec,
  ServerDrivenTheme,
} from './serverdrivenview.props';

type Style = Record<string, any>;
type Parts = Record<string, Style>;

/**
 * The built-in look, written in the style-spec format — the reference for
 * every name a theme can override.
 */
export const DEFAULT_STYLE_SPEC: ServerDrivenStyleSpec = {
  colors: {
    primary: '#2563EB',
    onPrimary: '#FFFFFF',
    secondary: '#E5E7EB',
    onSecondary: '#111827',
    background: 'transparent',
    surface: '#FFFFFF',
    surfaceVariant: '#F3F4F6',
    text: '#111827',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    outline: '#D1D5DB',
    error: '#DC2626',
    onError: '#FFFFFF',
    success: '#15803D',
    warning: '#D97706',
    info: '#0284C7',
  },
  space: { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radii: { none: 0, sm: 6, md: 10, lg: 12, xl: 20, pill: 999 },
  fonts: {},
  typography: {
    heading: { fontSize: 24, fontWeight: '700', color: 'text' },
    title: { fontSize: 18, fontWeight: '600', color: 'text' },
    subtitle: { fontSize: 15, fontWeight: '500', color: 'textMuted' },
    body: { fontSize: 15, color: 'text' },
    caption: { fontSize: 12, color: 'textMuted' },
    label: { fontSize: 13, fontWeight: '600', color: 'text' },
    h1: { fontSize: 28, fontWeight: '700', color: 'text' },
    h2: { fontSize: 22, fontWeight: '700', color: 'text' },
    h3: { fontSize: 18, fontWeight: '700', color: 'text' },
  },
  components: {
    Column: { style: { gap: 'sm' } },
    Row: { style: { gap: 'sm', alignItems: 'center' } },
    Card: {
      style: {
        padding: 'lg',
        gap: 'sm',
        borderRadius: 'lg',
        borderWidth: 1,
        borderColor: 'border',
        backgroundColor: 'surface',
      },
      titleStyle: { fontSize: 17, fontWeight: '600', color: 'text' },
      subtitleStyle: { fontSize: 13, color: 'textMuted', marginTop: -4 },
    },
    Divider: { style: { backgroundColor: 'border', marginVertical: 'xs' } },
    Badge: {
      style: { paddingHorizontal: 'sm', paddingVertical: 2, borderRadius: 'pill', backgroundColor: 'primary' },
      textStyle: { fontSize: 12, fontWeight: '600', color: 'onPrimary' },
    },
    ListItem: {
      style: { gap: 'md', paddingVertical: 10 },
      imageStyle: { width: 40, height: 40, borderRadius: 'pill', backgroundColor: 'border' },
      titleStyle: { fontSize: 15, fontWeight: '500', color: 'text' },
      subtitleStyle: { fontSize: 13, color: 'textMuted' },
      trailingStyle: { fontSize: 14, fontWeight: '600', color: 'text' },
      chevronStyle: { fontSize: 22, color: 'textMuted', marginLeft: -4 },
    },
    Button: {
      style: { minHeight: 44, paddingHorizontal: 18, borderRadius: 'md', backgroundColor: 'primary' },
      labelStyle: { fontSize: 15, fontWeight: '600', color: 'onPrimary' },
      variants: {
        secondary: { style: { backgroundColor: 'secondary' }, labelStyle: { color: 'onSecondary' } },
        outline: {
          style: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'primary' },
          labelStyle: { color: 'primary' },
        },
        ghost: { style: { backgroundColor: 'transparent' }, labelStyle: { color: 'primary' } },
        danger: { style: { backgroundColor: 'error' }, labelStyle: { color: 'onError' } },
      },
    },
    TextInput: {
      style: { gap: 6 },
      labelStyle: { fontSize: 13, fontWeight: '600', color: 'text' },
      inputStyle: {
        minHeight: 44,
        paddingHorizontal: 'md',
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'outline',
        borderRadius: 'md',
        fontSize: 15,
        color: 'text',
        backgroundColor: 'surface',
      },
      placeholderStyle: { color: 'textMuted' },
    },
    Switch: { labelStyle: { fontSize: 15, color: 'text' } },
    Checkbox: {
      labelStyle: { fontSize: 15, color: 'text' },
      boxStyle: { width: 22, height: 22, borderRadius: 'sm', borderWidth: 2, borderColor: 'outline' },
    },
    Stepper: {
      labelStyle: { fontSize: 15, color: 'text' },
      buttonStyle: { width: 34, height: 34, borderRadius: 'pill', borderWidth: 1, borderColor: 'primary' },
      symbolStyle: { fontSize: 18, fontWeight: '600', color: 'primary' },
      valueStyle: { minWidth: 32, fontSize: 16, fontWeight: '600', color: 'text' },
    },
    ProgressBar: {
      style: { height: 8, borderRadius: 'pill', backgroundColor: 'border' },
      fillStyle: { backgroundColor: 'primary' },
    },
  },
  modes: {
    dark: {
      colors: {
        primary: '#60A5FA',
        onPrimary: '#0B1220',
        secondary: '#1F2937',
        onSecondary: '#F9FAFB',
        background: '#0B0F17',
        surface: '#111827',
        surfaceVariant: '#1F2937',
        text: '#F9FAFB',
        textMuted: '#9CA3AF',
        border: '#1F2937',
        outline: '#374151',
        error: '#F87171',
        onError: '#0B1220',
        success: '#4ADE80',
        warning: '#FBBF24',
        info: '#38BDF8',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Parsing and merging
// ---------------------------------------------------------------------------

/** A theme as an object, a JSON string, or inside a Studio `{ dataSet }` wrapper. */
function parseStyleSpec(theme: unknown): ServerDrivenStyleSpec {
  let value = theme;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (isPlainObject(value) && isPlainObject(value.dataSet)) value = value.dataSet;
  return isPlainObject(value) ? (value as ServerDrivenStyleSpec) : {};
}

/** Objects merge key by key; anything else in `over` replaces what `base` had. */
function deepMerge<T>(base: T, over: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(over)) return (over === undefined ? base : over) as T;
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(over)) out[key] = deepMerge(out[key], over[key]);
  return out as T;
}

// ---------------------------------------------------------------------------
// Resolving names
// ---------------------------------------------------------------------------

/** Longest alias chain followed (`primary` → `brand` → `#…`); also stops cycles. */
const MAX_ALIAS_DEPTH = 8;

const PX = /^(-?\d+(?:\.\d+)?)px$/;

/** `"16px"` → `16`, so values copied from CSS or a design tool work as-is. */
function px(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const match = PX.exec(value.trim());
  return match != null ? Number(match[1]) : value;
}

/** Follows a name through `table` — whose entries may name each other — to a value. */
function lookup(table: Record<string, unknown>, value: unknown): unknown {
  let current = value;
  for (let depth = 0; depth < MAX_ALIAS_DEPTH; depth++) {
    if (typeof current !== 'string' || !Object.prototype.hasOwnProperty.call(table, current)) break;
    current = table[current];
  }
  return current;
}

function resolveTable(table: unknown, transform: (value: unknown) => unknown = (value) => value) {
  const source = isPlainObject(table) ? table : {};
  const out: Record<string, any> = {};
  for (const key of Object.keys(source)) out[key] = transform(lookup(source, source[key]));
  return out;
}

const SPACE_KEY = /^(padding|margin|gap|rowGap|columnGap)/;
const RADIUS_KEY = /Radius$/;

/** Theme tables a style's values are looked up in. */
interface Tables {
  colors: Record<string, string>;
  space: Record<string, number>;
  radii: Record<string, number>;
  fonts: Record<string, string>;
}

/** Folds a style — or an array of styles, as React Native allows — into one object. */
function flatten(style: unknown, into: Style = {}): Style {
  if (Array.isArray(style)) {
    for (const entry of style) flatten(entry, into);
  } else if (isPlainObject(style)) {
    Object.assign(into, style);
  }
  return into;
}

/**
 * Resolves theme names inside a style, by what each key holds: a color key
 * (`color`, `*Color`) reads `colors`, a spacing key (`padding*`, `margin*`,
 * `gap`) reads `space`, a `*Radius` key reads `radii`, `fontFamily` reads
 * `fonts`. Unknown names pass through, so raw values keep working.
 */
function resolveStyleWith(tables: Tables, style: unknown): Style {
  const flat = flatten(style);
  const out: Style = {};
  for (const key of Object.keys(flat)) {
    let value = flat[key];
    if (key === 'color' || key.endsWith('Color')) value = lookup(tables.colors, value);
    else if (SPACE_KEY.test(key)) value = lookup(tables.space, value);
    else if (RADIUS_KEY.test(key)) value = lookup(tables.radii, value);
    else if (key === 'fontFamily') value = lookup(tables.fonts, value);
    value = px(value);
    // Numeric weights from a design tool become the strings React Native expects.
    if (key === 'fontWeight' && typeof value === 'number') value = String(value);
    if (value !== undefined && value !== null) out[key] = value;
  }
  return out;
}

const COLOR_PROP = /^(color|background)$|Color$/;

/**
 * Resolves the theme names an element's props may carry: `style` and every
 * `*Style` prop as styles, `color` / `background` / `*Color` as colors, `gap`
 * and `padding` as spacing, `radius` as a radius, and `className` folded into
 * `style` — class styles first, the element's own `style` on top.
 */
export function resolveThemeProps(theme: ServerDrivenTheme, props: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...props };
  for (const key of Object.keys(props)) {
    const value = props[key];
    if (key === 'style' || key.endsWith('Style')) {
      if (value != null && typeof value === 'object') out[key] = theme.resolveStyle(value);
    } else if (typeof value === 'string') {
      if (COLOR_PROP.test(key)) out[key] = theme.colors[value] ?? value;
      else if (key === 'gap' || key === 'padding') out[key] = theme.space[value] ?? px(value);
      else if (key === 'radius') out[key] = theme.radii[value] ?? px(value);
    }
  }
  if (props.className != null) {
    const names = Array.isArray(props.className) ? props.className : String(props.className).split(/\s+/);
    const classes = names.map((name) => theme.classes[String(name)]).filter(Boolean);
    if (classes.length > 0) out.style = { ...Object.assign({}, ...classes), ...out.style };
  }
  return out;
}

// ---------------------------------------------------------------------------
// The resolved theme
// ---------------------------------------------------------------------------

/**
 * Builds the theme components receive: the style spec merged over the
 * defaults, the active mode applied on top, and every name resolved.
 */
export function createTheme(theme: unknown, mode: string): ServerDrivenTheme {
  const user = parseStyleSpec(theme);
  const merged = deepMerge(DEFAULT_STYLE_SPEC, user);
  // Modes come from the merged spec, so a theme can tweak the built-in `dark`.
  const modeSpec = isPlainObject(merged.modes) ? merged.modes[mode] : undefined;
  const spec: ServerDrivenStyleSpec = isPlainObject(modeSpec) ? deepMerge(merged, modeSpec) : merged;

  const tables: Tables = {
    colors: resolveTable(spec.colors, (value) => (value == null ? undefined : String(value))),
    space: resolveTable(spec.space, px),
    radii: resolveTable(spec.radii, px),
    fonts: resolveTable(spec.fonts, (value) => (value == null ? undefined : String(value))),
  };
  const resolveStyle = (style: unknown) => resolveStyleWith(tables, style);

  const typography: Record<string, Style> = {};
  for (const [name, style] of Object.entries(isPlainObject(spec.typography) ? spec.typography : {})) {
    typography[name] = resolveStyle(style);
  }
  const classes: Record<string, Style> = {};
  for (const [name, style] of Object.entries(isPlainObject(spec.classes) ? spec.classes : {})) {
    classes[name] = resolveStyle(style);
  }

  const components = isPlainObject(spec.components) ? spec.components : {};
  const cache = new Map<string, Parts>();
  const parts = (type: string, variant?: unknown): Parts => {
    const cacheKey = `${type}\u0000${variant ?? ''}`;
    const cached = cache.get(cacheKey);
    if (cached != null) return cached;
    const own = isPlainObject(components[type]) ? components[type] : {};
    const variantParts =
      typeof variant === 'string' && isPlainObject(own.variants) && isPlainObject(own.variants[variant])
        ? own.variants[variant]
        : {};
    const out: Parts = {};
    for (const source of [own, variantParts] as Record<string, any>[]) {
      for (const key of Object.keys(source)) {
        if (key === 'style' || key.endsWith('Style')) {
          out[key] = { ...out[key], ...resolveStyle(source[key] as ServerDrivenStyle) };
        }
      }
    }
    cache.set(cacheKey, out);
    return out;
  };

  return { mode, ...tables, typography, classes, parts, resolveStyle };
}
