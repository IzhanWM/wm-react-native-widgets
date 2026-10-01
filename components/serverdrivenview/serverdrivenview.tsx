import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  ServerDrivenElement,
  ServerDrivenTheme,
  ServerDrivenViewHandle,
  ServerDrivenViewProps,
} from './serverdrivenview.props';

export type * from './serverdrivenview.props';

const DEFAULT_ACCENT = '#2563EB';

/** Deepest element nesting rendered; guards a spec whose children loop. */
const MAX_DEPTH = 64;

const NO_WRITES: StateWrite[] = [];

type State = Record<string, unknown>;

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
  const bound = element.on?.[event];
  const list = Array.isArray(bound) ? bound : bound != null ? [bound] : [];
  return list.filter(
    (binding): binding is ServerDrivenActionBinding =>
      isPlainObject(binding) && typeof binding.action === 'string'
  );
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
    { spec, data, components, actions, accentColor = DEFAULT_ACCENT, onAction, onStateChange, style },
    ref
  ) {
    // A Studio page can hand over a freshly built spec object on every render;
    // keying on its content keeps the parse — and the user's edits — stable.
    const specKey = stringify(spec);
    const normalized = useMemo(() => normalizeSpec(specKey), [specKey]);
    const boundData = useMemo(() => parseData(data), [data]);

    // State is the spec's seed (which may read `$data`) with the user's edits
    // replayed on top, so a variable that loads late still fills the fields
    // nobody has touched yet.
    const base = useMemo<State>(() => {
      const seeded = resolveValue(normalized?.state ?? {}, { data: boundData, state: {} });
      return isPlainObject(seeded) ? seeded : {};
    }, [normalized, boundData]);

    // Edits belong to one spec; a new spec starts from its own seed.
    const [log, setLog] = useState<{ specKey: string; writes: StateWrite[] }>({ specKey, writes: NO_WRITES });
    const writes = log.specKey === specKey ? log.writes : NO_WRITES;
    const state = useMemo(() => applyWrites(base, writes), [base, writes]);

    // Event handlers read the latest values from here, so several actions in
    // one event each see the writes of the ones before them.
    const live = useRef({ specKey, base, writes, state });
    const handlers = useRef({ actions, onAction, onStateChange });
    useLayoutEffect(() => {
      live.current = { specKey, base, writes, state };
      handlers.current = { actions, onAction, onStateChange };
    });

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
      }),
      [write, reset]
    );

    const runAction = useCallback(
      (name: string, params: Record<string, any>, scope: Scope, elementKey: string) => {
        const path = parsePath(params.statePath ?? params.path);
        const list = () => {
          const value = getIn(live.current.state, path);
          return Array.isArray(value) ? value : [];
        };

        switch (name) {
          case 'setState':
            write(path, params.value);
            return;
          case 'pushState':
            write(path, [...list(), params.value]);
            return;
          case 'removeState': {
            const index = Number(params.index);
            if (Number.isInteger(index)) write(path, list().filter((_, i) => i !== index));
            return;
          }
          case 'toggleState':
            write(path, !isTruthy(getIn(live.current.state, path)));
            return;
          case 'resetState':
            reset();
            return;
        }

        const context = {
          event: scope.event,
          item: scope.item,
          index: scope.index,
          elementKey,
          state: live.current.state,
        };
        const handler = handlers.current.actions?.[name];
        if (handler == null) {
          handlers.current.onAction?.({ action: name, params, ...context });
          return;
        }
        const warn = (error: unknown) => console.warn(`[ServerDrivenView] action "${name}" failed`, error);
        try {
          const result = handler(params, {
            ...context,
            setState: (statePath, value) => write(parsePath(statePath), value),
          });
          if (result != null && typeof result.then === 'function') result.catch(warn);
        } catch (error) {
          warn(error);
        }
      },
      [write, reset]
    );

    const dispatch = useCallback(
      (element: ServerDrivenElement, elementKey: string, event: string, payload: unknown, scope: Scope) => {
        for (const binding of actionList(element, event)) {
          // Re-read state per action: an earlier one in the list may have written it.
          const actionScope: Scope = { ...scope, state: live.current.state, event: payload };
          const params = isPlainObject(binding.params) ? resolveValue(binding.params, actionScope) : {};
          runAction(binding.action, params, actionScope, elementKey);
        }
      },
      [runAction]
    );

    const registry = useMemo(() => ({ ...SERVER_DRIVEN_COMPONENTS, ...components }), [components]);
    const theme = useMemo<ServerDrivenTheme>(() => ({ accentColor }), [accentColor]);

    if (normalized == null) return <View style={style} />;
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
      const props = resolveValue(rawProps, scope) as Record<string, any>;

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
          emit={(event, payload) => dispatch(element, key, event, payload, scope)}
          handles={(event) => actionList(element, event).length > 0}
          element={element}
          elementKey={key}
          theme={theme}
        >
          {children}
        </Component>
      );
    };

    return <View style={style}>{renderElement(root, { data: boundData, state }, [], root)}</View>;
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
