import type { ReactNode } from 'react';
import type { CommonWidgetProps } from '../widget-props/common';

/**
 * A JSON value that may hold dynamic expressions. Resolved against the bound
 * `data`, the local UI state and the current repeat item before a component
 * sees it:
 *
 * - `{ "$data": "/user/name" }` — reads the bound `data` prop (Studio variables)
 * - `{ "$api": "/listOrders/data" }` — an API operation's result (`data`, `loading`, `error`, `status`)
 * - `{ "$state": "/form/email" }` — reads local UI state
 * - `{ "$bindState": "/form/email" }` — reads local state and lets the
 *   component write it back (inputs, switches, checkboxes)
 * - `{ "$item": "title" }`, `{ "$index": true }` — the current repeat row
 * - `{ "$bindItem": "done" }` — two-way field of a row repeated from state
 * - `{ "$event": "member.name" }` — the payload of the event being handled
 * - `{ "$template": "Hi ${$data/user/name}" }` — string interpolation
 * - `{ "$cond": <condition>, "$then": a, "$else": b }` — branching
 *
 * Paths are JSON pointers (`/a/0/b`) or dotted (`a.0.b`); `""` is the root.
 */
export type ServerDrivenValue = unknown;

/**
 * A boolean test used by `visible` and `$cond`.
 *
 * - `true` / `false`
 * - an array — every entry must hold
 * - `{ "$and": [...] }`, `{ "$or": [...] }`, `{ "$not": <condition> }`
 * - a source (`$data`, `$state`, `$item`, `$index`) alone for truthiness — an
 *   empty array or string counts as false — or with one comparator: `eq`,
 *   `neq`, `gt`, `gte`, `lt`, `lte`, `in`. Add `"not": true` to invert.
 *
 * Example: `{ "$data": "/orders", "not": true }` — shown when there are none.
 */
export type ServerDrivenCondition = unknown;

/** One action fired by an element event. */
export interface ServerDrivenActionBinding {
  /**
   * Built-in (`setState`, `pushState`, `removeState`, `toggleState`,
   * `resetState`) or custom. Custom actions reach a handler in `actions`, or
   * else the `onAction` event — which is how a Studio page invokes a service
   * variable or navigates. A name listed in the `api` schema's operations
   * sends that request.
   */
  action: string;
  /** Parameters, resolved against the element's scope and the event payload. */
  params?: Record<string, ServerDrivenValue>;
  /**
   * Run once the action settles: after an API response, or after a handler's
   * returned promise resolves (right away for anything synchronous). `$event`
   * is the result.
   */
  onSuccess?: ServerDrivenActionBinding | ServerDrivenActionBinding[];
  /** Run when the action fails; `$event` is `{ message, status, data }`. */
  onError?: ServerDrivenActionBinding | ServerDrivenActionBinding[];
}

/** An element in the flat `elements` map. */
export interface ServerDrivenElement {
  /** Catalog component name, e.g. `Text`, `Button`, `Card`. */
  type: string;
  /** Component props; any value may be a dynamic expression. */
  props?: Record<string, ServerDrivenValue>;
  /** Keys of child elements, rendered in order. */
  children?: string[];
  /** Rendered only while this condition holds. */
  visible?: ServerDrivenCondition;
  /** Event name (`press`, `change`, `submit`, …) to the action(s) it fires. */
  on?: Record<string, ServerDrivenActionBinding | ServerDrivenActionBinding[]>;
  /**
   * Renders the children once per row. `statePath` repeats a local state
   * array, `dataPath` a bound one, and `itemPath` a list inside the current
   * repeat row (aisle → products); any of them may be a Studio variable
   * wrapper or a JSON string. `key` names the field used as the React key.
   */
  repeat?: { statePath?: string; dataPath?: string; apiPath?: string; itemPath?: string; key?: string };
}

/**
 * A nested element — the hand-written alternative to the flat map. Children
 * are elements themselves, and a bare string child renders as `Text`.
 */
export interface ServerDrivenNode extends Omit<ServerDrivenElement, 'children'> {
  /** Stable key; generated from the position when omitted. */
  key?: string;
  children?: (ServerDrivenNode | string)[];
}

/**
 * A UI spec, compatible with json-render's flat format:
 * `{ "root": "card", "elements": { "card": { "type": "Card", … } } }`.
 * A single nested {@link ServerDrivenNode} is accepted too.
 */
export interface ServerDrivenSpec {
  /** Key of the element rendered at the top. */
  root: string;
  /** Every element, keyed by its id. */
  elements: Record<string, ServerDrivenElement>;
  /**
   * Initial local state. Values may use `$data`, so a form can be seeded from
   * a variable: they re-resolve when `data` changes until the user edits them.
   */
  state?: Record<string, ServerDrivenValue>;
}

/** The nested form of a spec: a root {@link ServerDrivenNode} plus optional state. */
export interface ServerDrivenNestedSpec {
  root: ServerDrivenNode;
  /** Initial local state, as in {@link ServerDrivenSpec.state}. */
  state?: Record<string, ServerDrivenValue>;
}

/**
 * A React Native style whose values may name theme entries: a color key
 * (`color`, `*Color`) takes a `colors` name, a spacing key (`padding*`,
 * `margin*`, `gap`) a `space` name, a `*Radius` key a `radii` name,
 * `fontFamily` a `fonts` name. `"16px"` reads as `16`.
 */
export type ServerDrivenStyle = Record<string, unknown>;

/** Styles for one component type: `style` is its root, `*Style` its parts. */
export interface ServerDrivenComponentStyles {
  style?: ServerDrivenStyle;
  /** Overrides picked by the element's `variant` prop. */
  variants?: Record<string, Omit<ServerDrivenComponentStyles, 'variants'>>;
  [part: `${string}Style`]: ServerDrivenStyle | undefined;
}

/**
 * The style spec — one JSON that themes everything a spec renders. Every
 * section is optional and merges over the built-in defaults.
 *
 * ```json
 * {
 *   "colors": { "brand": "#0E7C86", "primary": "brand", "surface": "#F8FAFC" },
 *   "radii": { "md": 14 },
 *   "typography": { "title": { "fontSize": 20, "fontWeight": "700" } },
 *   "components": { "Button": { "style": { "borderRadius": "pill" } } },
 *   "classes": { "price": { "fontSize": 18, "fontWeight": "700", "color": "primary" } },
 *   "modes": { "dark": { "colors": { "surface": "#111827" } } }
 * }
 * ```
 */
export interface ServerDrivenStyleSpec {
  /** Named colors; a value may name another color. */
  colors?: Record<string, string>;
  /** Named spacing, in pixels. */
  space?: Record<string, number | string>;
  /** Named corner radii, in pixels. */
  radii?: Record<string, number | string>;
  /** Named font families — fonts the app has loaded. */
  fonts?: Record<string, string>;
  /** Text styles: `Text` variants and `h1`–`h3` for `Heading` levels. */
  typography?: Record<string, ServerDrivenStyle>;
  /** Styles per component type, applied to every element of that type. */
  components?: Record<string, ServerDrivenComponentStyles>;
  /** Named styles an element applies with `className`. */
  classes?: Record<string, ServerDrivenStyle>;
  /** Overrides applied when `themeMode` names them, e.g. `dark`. */
  modes?: Record<string, Omit<ServerDrivenStyleSpec, 'modes'>>;
}

/** The resolved theme a catalog component receives. */
export interface ServerDrivenTheme {
  /** The active mode. */
  mode: string;
  colors: Record<string, string>;
  space: Record<string, number>;
  radii: Record<string, number>;
  fonts: Record<string, string>;
  typography: Record<string, Record<string, any>>;
  classes: Record<string, Record<string, any>>;
  /**
   * Resolved part styles for a component type and variant, e.g.
   * `parts('Button', 'outline').labelStyle`. Works for host components too.
   */
  parts: (type: string, variant?: unknown) => Record<string, Record<string, any>>;
  /** Resolves theme names inside a style. */
  resolveStyle: (style: unknown) => Record<string, any>;
}

/** An operation in the API schema. */
export interface ServerDrivenApiOperation {
  /** @default 'GET' */
  method?: string;
  /** Appended to `baseUrl` (or an absolute URL). `{name}` placeholders take params. */
  path: ServerDrivenValue;
  /** Default params, under the caller's; may be expressions. */
  params?: Record<string, ServerDrivenValue>;
  /** Extra headers; may be expressions. */
  headers?: Record<string, ServerDrivenValue>;
  /** Fetch on mount, and again whenever the resolved request changes. */
  load?: boolean;
  /**
   * With `load`, waits this many ms after the request last changed before
   * refetching — e.g. a search box. The first load is never delayed.
   * @default 0
   */
  debounce?: number;
  /** Part of the response kept as `data`, e.g. `/content`. */
  select?: string;
}

/**
 * The APIs a spec may call:
 * `{ "baseUrl": "https://api.example.com", "headers": {…}, "operations": { "listOrders": { "path": "/orders", "load": true } } }`.
 */
export interface ServerDrivenApiSchema {
  /** May be an expression, e.g. `{ "$data": "/env/apiUrl" }`. */
  baseUrl?: ServerDrivenValue;
  /** Sent with every operation, e.g. `{ "Authorization": { "$template": "Bearer ${$data/token}" } }`. */
  headers?: Record<string, ServerDrivenValue>;
  operations: Record<string, ServerDrivenApiOperation>;
}

/** What `{ "$api": "/<operation>" }` reads. */
export interface ServerDrivenApiResult {
  data?: unknown;
  loading: boolean;
  /** Message of the last failure, cleared by a success. */
  error?: string;
  status?: number;
}

/** What a catalog component receives. */
export interface ServerDrivenComponentProps {
  /** Resolved props — no expressions left. */
  props: Record<string, any>;
  /** Rendered children, when the element has any. */
  children?: ReactNode;
  /**
   * Fires the element's `on[event]` actions. `payload` is readable from
   * action params as `{ "$event": "" }`.
   */
  emit: (event: string, payload?: unknown) => void;
  /** Whether the element declares any action for `event`. */
  handles: (event: string) => boolean;
  /**
   * Setters for props bound with `$bindState` / `$bindItem`, keyed by prop
   * name. A component writes `bindings.value?.(next)` to update state.
   */
  bindings: Record<string, (value: unknown) => void>;
  /** The element as written in the spec. */
  element: ServerDrivenElement;
  /** Key of the element in the spec. */
  elementKey: string;
  theme: ServerDrivenTheme;
}

/** A catalog component. */
export type ServerDrivenComponent = (props: ServerDrivenComponentProps) => ReactNode;

/** Context handed to a handler in the `actions` prop. */
export interface ServerDrivenActionContext {
  /** The payload of the event that fired the action, if any. */
  event?: unknown;
  /** Current repeat row, when fired from inside a repeat. */
  item?: unknown;
  /** Current repeat index, when fired from inside a repeat. */
  index?: number;
  /** Key of the element that fired the action. */
  elementKey: string;
  /** Local state at the time of the action. */
  state: Record<string, unknown>;
  /** Writes local state, exactly like the built-in `setState` action. */
  setState: (statePath: string, value: unknown) => void;
}

/** A handler for a custom action. */
export type ServerDrivenActionHandler = (
  params: Record<string, unknown>,
  context: ServerDrivenActionContext
) => unknown;

/** Emitted for a custom action that no handler in `actions` claimed. */
export interface ServerDrivenActionEvent {
  /** The action name, e.g. `submitOrder`. */
  action: string;
  /** Resolved action params. */
  params: Record<string, unknown>;
  /** The payload of the event that fired the action, if any. */
  event?: unknown;
  /** Current repeat row, when fired from inside a repeat. */
  item?: unknown;
  /** Current repeat index, when fired from inside a repeat. */
  index?: number;
  /** Key of the element that fired the action. */
  elementKey: string;
  /** Local state at the time of the action. */
  state: Record<string, unknown>;
}

/** Emitted whenever local state is written. */
export interface ServerDrivenStateChangeEvent {
  /** Pointer of the value that changed; `""` after a reset. */
  statePath: string;
  /** The new value at that path. */
  value: unknown;
  /** The whole local state after the change. */
  state: Record<string, unknown>;
}

/** Imperative handle exposed through `ref`. */
export interface ServerDrivenViewHandle {
  /** The current local state. */
  getState: () => Record<string, unknown>;
  /** Writes local state at `statePath` and fires `onStateChange`. */
  setState: (statePath: string, value: unknown) => void;
  /** Drops every local edit, re-seeding state from the spec and `data`. */
  resetState: () => void;
  /** Runs an API operation; resolves with its data. */
  request: (operation: string, params?: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Props for ServerDrivenView.
 * common -> serverdrivenview
 */
export interface ServerDrivenViewProps extends CommonWidgetProps {
  /**
   * The UI to render: a flat {@link ServerDrivenSpec}, a
   * {@link ServerDrivenNestedSpec}, a bare {@link ServerDrivenNode}, or any of
   * them as a JSON string — so it can be bound to a variable and served from a
   * backend or an LLM. A Studio wrapper (`{ dataSet: spec }`) is unwrapped. An
   * unparseable spec renders nothing.
   */
  spec?: ServerDrivenSpec | ServerDrivenNestedSpec | ServerDrivenNode | string | null;
  /**
   * Bound data the spec reads with `$data` — typically a Studio variable's
   * `dataSet`, or an object combining several. Read-only from the spec's
   * side; updates re-render live.
   */
  data?: unknown;
  /**
   * Extra or overriding catalog components, by type name. Only types in the
   * catalog ever render, so a spec cannot reach arbitrary components.
   */
  components?: Record<string, ServerDrivenComponent>;
  /** Handlers for custom actions, by name. Unhandled ones fire `onAction`. */
  actions?: Record<string, ServerDrivenActionHandler>;
  /**
   * The style spec ({@link ServerDrivenStyleSpec}), or it as a JSON string —
   * colors, spacing, typography, component and class styles, modes.
   */
  theme?: ServerDrivenStyleSpec | string | null;
  /**
   * Which `modes` entry of the theme applies: `light`, `dark`, `system`
   * (follows the device) or any mode the theme defines.
   * @default 'light'
   */
  themeMode?: string;
  /**
   * The APIs the spec may call ({@link ServerDrivenApiSchema}), or it as a
   * JSON string. Only listed operations can be reached.
   */
  api?: ServerDrivenApiSchema | string | null;
  /**
   * Called for a custom action with no handler in `actions` and no API
   * operation. Returning a promise defers the binding's `onSuccess`/`onError`.
   */
  onAction?: (event: ServerDrivenActionEvent) => unknown;
  /** Called after every write to local state. */
  onStateChange?: (event: ServerDrivenStateChangeEvent) => void;
}
