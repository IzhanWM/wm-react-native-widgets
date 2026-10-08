import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import {
  buildRequest,
  hasOperation,
  normalizeApi,
  sendRequest,
  toFailure,
  type ApiRequest,
} from './serverdrivenview.api';
import { createTheme, resolveThemeProps } from './serverdrivenview.theme';
import { SERVER_DRIVEN_COMPONENTS } from './serverdrivenview.catalog';
import {
  addWrite,
  applyWrites,
  evaluateCondition,
  getIn,
  isPlainObject,
  isTruthy,
  normalizeSpec,
  parsePath,
  repeatKey,
  repeatRows,
  resolveValue,
  setIn,
  toPointer,
  type Path,
  type Scope,
  type StateWrite,
} from './serverdrivenview.engine';
import type {
  ServerDrivenActionBinding,
  ServerDrivenApiResult,
  ServerDrivenElement,
  ServerDrivenViewHandle,
  ServerDrivenViewProps,
} from './serverdrivenview.props';

export type * from './serverdrivenview.props';

/** Deepest element nesting rendered; guards a spec whose children loop. */
const MAX_DEPTH = 64;

const NO_WRITES: StateWrite[] = [];

type State = Record<string, unknown>;

/** A stored operation result; `key` is the request it answers. */
interface ApiEntry extends ServerDrivenApiResult {
  key?: string;
}

function toBindings(value: unknown): ServerDrivenActionBinding[] {
  const list = Array.isArray(value) ? value : value != null ? [value] : [];
  return list.filter(
    (binding): binding is ServerDrivenActionBinding =>
      isPlainObject(binding) && typeof binding.action === 'string'
  );
}

function stringify(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '';
  }
}

function parseData(data: unknown): unknown {
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function actionList(element: ServerDrivenElement, event: string): ServerDrivenActionBinding[] {
  return toBindings(element.on?.[event]);
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return value != null && typeof (value as PromiseLike<unknown>).then === 'function';
}

function isDev(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

/**
 * Renders a JSON UI spec — json-render's flat `root` + `elements` format, or a
 * nested tree — through a fixed catalog of React Native components. Props read
 * bound Studio variables (`$data`) and local UI state (`$state`), inputs write
 * state back (`$bindState`), and element events fire built-in state actions or
 * custom ones that reach the page through `onAction`.
 */
const ServerDrivenViewComponent = forwardRef<ServerDrivenViewHandle, ServerDrivenViewProps>(
  function ServerDrivenView(
    { spec, data, theme, themeMode = 'light', api, components, actions, onAction, onStateChange, style },
    ref
  ) {
    const deviceScheme = useColorScheme();
    const mode = themeMode === 'system' ? (deviceScheme === 'dark' ? 'dark' : 'light') : themeMode;
    const themeKey = stringify(theme);
    const resolvedTheme = useMemo(() => createTheme(themeKey, mode), [themeKey, mode]);

    const apiKey = stringify(api);
    const schema = useMemo(() => normalizeApi(apiKey), [apiKey]);
    const [apiStore, setApiStore] = useState<Record<string, ApiEntry>>({});
    // What `$api` reads, minus request keys. State seeds and `load` requests
    // read this; rendering reads it with pending loads marked.
    const apiData = useMemo(() => {
      const out: Record<string, ServerDrivenApiResult> = {};
      for (const name of Object.keys(schema?.operations ?? {})) {
        const { key: _key, ...entry } = apiStore[name] ?? { loading: false };
        out[name] = entry;
      }
      return out;
    }, [schema, apiStore]);

    // A Studio page can hand over a freshly built spec object on every render;
    // keying on its content keeps the parse — and the user's edits — stable.
    const specKey = stringify(spec);
    const normalized = useMemo(() => normalizeSpec(specKey), [specKey]);
    const boundData = useMemo(() => parseData(data), [data]);

    // State is the spec's seed (which may read `$data`) with the user's edits
    // replayed on top, so a variable that loads late still fills the fields
    // nobody has touched yet.
    const base = useMemo<State>(() => {
      const seeded = resolveValue(normalized?.state ?? {}, { data: boundData, state: {}, api: apiData });
      return isPlainObject(seeded) ? seeded : {};
    }, [normalized, boundData, apiData]);

    // Edits belong to one spec; a new spec starts from its own seed.
    const [log, setLog] = useState<{ specKey: string; writes: StateWrite[] }>({ specKey, writes: NO_WRITES });
    const writes = log.specKey === specKey ? log.writes : NO_WRITES;
    const state = useMemo(() => applyWrites(base, writes), [base, writes]);

    // Event handlers read the latest values from here, so several actions in
    // one event each see the writes of the ones before them.
    const live = useRef({ specKey, base, writes, state });
    const handlers = useRef({ actions, onAction, onStateChange });
    const apiRef = useRef({ schema, scope: { data: boundData, state, api: apiData } as Scope });
    useLayoutEffect(() => {
      live.current = { specKey, base, writes, state };
      handlers.current = { actions, onAction, onStateChange };
      apiRef.current = { schema, scope: { data: boundData, state, api: apiData } };
    });

    // One in-flight request per operation; a newer one aborts the older.
    const inFlight = useRef<Record<string, AbortController>>({});
    useEffect(() => {
      const pending = inFlight.current;
      return () => Object.values(pending).forEach((controller) => controller.abort());
    }, []);

    const send = useCallback((name: string, request: ApiRequest): Promise<unknown> => {
      const operation = apiRef.current.schema?.operations[name];
      if (operation == null) return Promise.reject({ message: `Unknown operation "${name}"` });
      inFlight.current[name]?.abort();
      const controller = new AbortController();
      inFlight.current[name] = controller;
      const update = (entry: Partial<ApiEntry>) =>
        setApiStore((store) => ({ ...store, [name]: { ...store[name], ...entry } as ApiEntry }));
      update({ loading: true, key: request.key });
      return sendRequest(request, operation, controller.signal).then(
        (result) => {
          if (!controller.signal.aborted) update({ data: result, loading: false, error: undefined, status: 200 });
          return result;
        },
        (error) => {
          if (controller.signal.aborted) throw error;
          const failure = toFailure(error);
          update({ loading: false, error: failure.message, status: failure.status });
          throw failure;
        }
      );
    }, []);

    const request = useCallback(
      (name: string, params: Record<string, unknown>, scope?: Scope): Promise<unknown> => {
        const { schema: current, scope: liveScope } = apiRef.current;
        if (current == null || !hasOperation(current, name)) {
          return Promise.reject({ message: `Unknown operation "${name}"` });
        }
        const built = buildRequest(current, name, params, scope ?? liveScope);
        if (built == null) return Promise.reject({ message: `Missing path params for "${name}"` });
        return send(name, built);
      },
      [send]
    );

    // `load` operations: built from the current data, state and results, and
    // re-sent whenever the request they resolve to changes.
    const loads = useMemo(() => {
      const out: Record<string, ApiRequest> = {};
      if (schema == null) return out;
      const scope: Scope = { data: boundData, state, api: apiData };
      for (const [name, operation] of Object.entries(schema.operations)) {
        if (!isPlainObject(operation) || operation.load !== true) continue;
        const built = buildRequest(schema, name, {}, scope);
        if (built != null) out[name] = built;
      }
      return out;
    }, [schema, boundData, state, apiData]);
    const loadSignature = Object.entries(loads)
      .map(([name, built]) => `${name}=${built.key}`)
      .join('\n');
    useEffect(() => {
      const timers: ReturnType<typeof setTimeout>[] = [];
      for (const [name, built] of Object.entries(loads)) {
        if (apiStore[name]?.key === built.key) continue;
        const run = () =>
          send(name, built).catch(() => {
            // The failure is in `$api/<name>/error`; nothing else listens.
          });
        // The first load goes out at once; later changes (typing) wait `debounce` ms.
        const wait = Number(schema?.operations[name]?.debounce) || 0;
        if (wait > 0 && apiStore[name] != null) timers.push(setTimeout(run, wait));
        else run();
      }
      return () => timers.forEach(clearTimeout);
      // Keyed on the signature: `loads` is a new object on every state change.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadSignature]);

    const apiView = useMemo(() => {
      const out: Record<string, ServerDrivenApiResult> = { ...apiData };
      for (const [name, built] of Object.entries(loads)) {
        if (apiStore[name]?.key !== built.key) out[name] = { ...out[name], loading: true };
      }
      return out;
    }, [apiData, loads, apiStore]);

    const write = useCallback((path: Path, value: unknown) => {
      const current = live.current;
      const nextWrites = addWrite(current.writes, path, value);
      const next = setIn(current.state, path, value);
      const nextState = isPlainObject(next) ? next : {};
      live.current = { ...current, writes: nextWrites, state: nextState };
      setLog({ specKey: current.specKey, writes: nextWrites });
      handlers.current.onStateChange?.({ statePath: toPointer(path), value, state: nextState });
    }, []);

    const reset = useCallback(() => {
      const current = live.current;
      live.current = { ...current, writes: NO_WRITES, state: current.base };
      setLog({ specKey: current.specKey, writes: NO_WRITES });
      handlers.current.onStateChange?.({ statePath: '', value: current.base, state: current.base });
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        getState: () => live.current.state,
        setState: (statePath: string, value: unknown) => write(parsePath(statePath), value),
        resetState: reset,
        request: (operation: string, params?: Record<string, unknown>) => request(operation, params ?? {}),
      }),
      [write, reset, request]
    );

    /** Runs one action; returns its result, or a promise of it. */
    const runAction = useCallback(
      (name: string, params: Record<string, any>, scope: Scope, elementKey: string): unknown => {
        const path = parsePath(params.statePath ?? params.path);
        const list = () => {
          const value = getIn(live.current.state, path);
          return Array.isArray(value) ? value : [];
        };

        switch (name) {
          case 'setState':
            return write(path, params.value);
          case 'pushState':
            return write(path, [...list(), params.value]);
          case 'removeState': {
            const index = Number(params.index);
            if (Number.isInteger(index)) write(path, list().filter((_, i) => i !== index));
            return undefined;
          }
          case 'toggleState':
            return write(path, !isTruthy(getIn(live.current.state, path)));
          case 'resetState':
            return reset();
        }

        const context = {
          event: scope.event,
          item: scope.item,
          index: scope.index,
          elementKey,
          state: live.current.state,
        };
        const handler = handlers.current.actions?.[name];
        if (handler != null) {
          return handler(params, { ...context, setState: (statePath, value) => write(parsePath(statePath), value) });
        }
        if (hasOperation(apiRef.current.schema, name)) return request(name, params, scope);
        return handlers.current.onAction?.({ action: name, params, ...context });
      },
      [write, reset, request]
    );

    const dispatch = useCallback(
      (bindings: ServerDrivenActionBinding[], elementKey: string, payload: unknown, scope: Scope) => {
        for (const binding of bindings) {
          // Re-read state per action: an earlier one in the list may have written it.
          const actionScope: Scope = { ...scope, state: live.current.state, api: apiRef.current.scope.api, event: payload };
          const params = isPlainObject(binding.params) ? resolveValue(binding.params, actionScope) : {};
          const settle = (key: 'onSuccess' | 'onError', result: unknown) => {
            const next = toBindings(binding[key]);
            if (next.length > 0) dispatch(next, elementKey, result, scope);
            else if (key === 'onError') console.warn(`[ServerDrivenView] action "${binding.action}" failed`, result);
          };
          let result: unknown;
          try {
            result = runAction(binding.action, params, actionScope, elementKey);
          } catch (error) {
            settle('onError', toFailure(error));
            continue;
          }
          if (isThenable(result)) {
            result.then(
              (value) => settle('onSuccess', value),
              (error) => {
                if ((error as Error)?.name !== 'AbortError') settle('onError', toFailure(error));
              }
            );
          } else {
            settle('onSuccess', result);
          }
        }
      },
      [runAction]
    );

    const registry = useMemo(() => ({ ...SERVER_DRIVEN_COMPONENTS, ...components }), [components]);
    const rootStyle = [{ backgroundColor: resolvedTheme.colors.background }, style];
    if (normalized == null) return <View style={rootStyle} />;
    const { root, elements } = normalized;

    const renderChildren = (keys: string[], scope: Scope, ancestors: string[]): ReactNode[] => {
      const seen = new Map<string, number>();
      return keys.map((childKey) => {
        const count = seen.get(childKey) ?? 0;
        seen.set(childKey, count + 1);
        return renderElement(childKey, scope, ancestors, count === 0 ? childKey : `${childKey}#${count}`);
      });
    };

    const renderElement = (key: string, scope: Scope, ancestors: string[], reactKey: string): ReactNode => {
      const element = Object.prototype.hasOwnProperty.call(elements, key) ? elements[key] : undefined;
      if (!isPlainObject(element) || typeof element.type !== 'string') return null;
      if (ancestors.length >= MAX_DEPTH || ancestors.includes(key)) return null;
      if (element.visible !== undefined && !evaluateCondition(element.visible, scope)) return null;

      const Component = Object.prototype.hasOwnProperty.call(registry, element.type)
        ? registry[element.type]
        : undefined;
      if (Component == null) {
        return isDev() ? (
          <View key={reactKey} style={styles.unknown}>
            <Text style={styles.unknownText}>{`Unknown component "${element.type}" (${key})`}</Text>
          </View>
        ) : null;
      }

      const rawProps = isPlainObject(element.props) ? element.props : {};
      const props = resolveThemeProps(resolvedTheme, resolveValue(rawProps, scope));

      const bindings: Record<string, (value: unknown) => void> = {};
      for (const [prop, raw] of Object.entries(rawProps)) {
        if (!isPlainObject(raw)) continue;
        if ('$bindState' in raw) {
          const path = parsePath(raw.$bindState);
          bindings[prop] = (value) => write(path, value);
        } else if ('$bindItem' in raw && scope.itemStatePath != null && scope.index != null) {
          const path = [...scope.itemStatePath, String(scope.index), ...parsePath(raw.$bindItem)];
          bindings[prop] = (value) => write(path, value);
        }
      }

      const childKeys = Array.isArray(element.children)
        ? element.children.filter((child): child is string => typeof child === 'string')
        : [];
      const nextAncestors = [...ancestors, key];
      let children: ReactNode;
      if (element.repeat != null) {
        const { rows, statePath } = repeatRows(element.repeat, scope);
        children = rows.map((row, index) => (
          <React.Fragment key={repeatKey(row, index, element.repeat?.key)}>
            {renderChildren(childKeys, { ...scope, item: row, index, itemStatePath: statePath }, nextAncestors)}
          </React.Fragment>
        ));
      } else if (childKeys.length > 0) {
        children = renderChildren(childKeys, scope, nextAncestors);
      }

      return (
        <Component
          key={reactKey}
          props={props}
          bindings={bindings}
          emit={(event, payload) => dispatch(actionList(element, event), key, payload, scope)}
          handles={(event) => actionList(element, event).length > 0}
          element={element}
          elementKey={key}
          theme={resolvedTheme}
        >
          {children}
        </Component>
      );
    };

    return <View style={rootStyle}>{renderElement(root, { data: boundData, state, api: apiView }, [], root)}</View>;
  }
);

ServerDrivenViewComponent.displayName = 'ServerDrivenView';

const styles = StyleSheet.create({
  unknown: {
    padding: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DC2626',
    borderRadius: 6,
  },
  unknownText: { fontSize: 12, color: '#DC2626' },
});

export const ServerDrivenView = ServerDrivenViewComponent;
