import { ServerDrivenView } from '@components/serverdrivenview/serverdrivenview';
import type {
  ServerDrivenActionEvent,
  ServerDrivenStateChangeEvent,
  ServerDrivenViewHandle,
} from '@components/serverdrivenview';
import type { StoryObj } from '@storybook/react';
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import meta from '../meta';
import { Readout } from '../readout';
import { CURRENT_USER, RECENT_ORDERS } from '../../sample-data';
import { ACCOUNT_SPEC, PROFILE_FORM_SPEC, TODO_SPEC } from '../serverdrivenview.specs';

/** State, actions and events. */
export default { ...meta, title: 'UI Widgets/Server Driven View/Interaction' };
type Story = StoryObj<typeof meta>;

/** Custom actions the spec names reach the page through `onAction`. */
export const OnAction: Story = {
  render: (args) => {
    const [event, setEvent] = useState<ServerDrivenActionEvent>();
    return (
      <View>
        <ServerDrivenView {...args} onAction={setEvent} />
        <Readout label="onAction" value={event && { action: event.action, params: event.params, elementKey: event.elementKey }} />
      </View>
    );
  },
  args: { spec: ACCOUNT_SPEC, data: { user: CURRENT_USER, orders: RECENT_ORDERS } },
  parameters: {
    note: 'Tap an order or Refresh. In Studio, handle the event and invoke a variable or navigate.',
  },
};

/**
 * Two-way binding: inputs write local state with `$bindState`, every write
 * fires `onStateChange`, and Save hands the form to the page. The page drives
 * the spinner back through the `ref` handle.
 */
export const TwoWayForm: Story = {
  // No args: a ref'd element built from args trips Storybook's source snippet on React 19.
  render: () => {
    const view = useRef<ServerDrivenViewHandle>(null);
    const [change, setChange] = useState<ServerDrivenStateChangeEvent>();
    const [action, setAction] = useState<ServerDrivenActionEvent>();
    return (
      <View>
        <ServerDrivenView
          spec={PROFILE_FORM_SPEC}
          data={CURRENT_USER}
          ref={view}
          onStateChange={setChange}
          onAction={(event) => {
            setAction(event);
            if (event.action !== 'saveProfile') return;
            view.current?.setState('/saving', true);
            setTimeout(() => view.current?.setState('/saving', false), 1200);
          }}
        />
        <Readout label="onStateChange" value={change && { statePath: change.statePath, value: change.value }} />
        <Readout label="onAction" value={action && { action: action.action, params: action.params }} />
      </View>
    );
  },
};

/**
 * A list held in local state: `pushState` adds, `removeState` deletes, and
 * `$bindItem` ticks a row inside a `statePath` repeat.
 */
export const LocalStateList: Story = {
  render: (args) => {
    const [change, setChange] = useState<ServerDrivenStateChangeEvent>();
    return (
      <View>
        <ServerDrivenView {...args} onStateChange={setChange} />
        <Readout label="onStateChange" value={change && { statePath: change.statePath, value: change.value }} />
      </View>
    );
  },
  args: { spec: TODO_SPEC },
};

/**
 * The `actions` prop claims an action in code, so it never reaches
 * `onAction`. Here `refreshOrders` reloads the bound variable.
 */
export const ActionsProp: Story = {
  render: (args) => {
    const [orders, setOrders] = useState(RECENT_ORDERS);
    const [event, setEvent] = useState<ServerDrivenActionEvent>();
    return (
      <View>
        <ServerDrivenView
          {...args}
          data={{ user: CURRENT_USER, orders }}
          actions={{
            refreshOrders: () =>
              setOrders((current) => ({ dataSet: [...current.dataSet.slice(1), current.dataSet[0]] })),
          }}
          onAction={setEvent}
        />
        <Readout label="onAction" value={event && { action: event.action, params: event.params }} />
      </View>
    );
  },
  args: { spec: ACCOUNT_SPEC },
  parameters: {
    note: 'Refresh is handled in code (the rows rotate); tapping an order still reaches onAction.',
  },
};
