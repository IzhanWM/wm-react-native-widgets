import type { StoryObj } from '@storybook/react';
import meta from './meta';
import { CURRENT_USER, RECENT_ORDERS } from '../sample-data';
import { ACCOUNT_SPEC } from './serverdrivenview.specs';

export default { ...meta, title: 'UI Widgets/Server Driven View', tags: ['autodocs'] };
type Story = StoryObj<typeof meta>;

/**
 * An account screen described in JSON. `data` carries two bound variables —
 * a model variable for the user and a live variable for the orders — and the
 * spec reads them with `$data`, `$template` and a `dataPath` repeat.
 */
export const Default: Story = {
  args: {
    spec: ACCOUNT_SPEC,
    data: { user: CURRENT_USER, orders: RECENT_ORDERS },
  },
  parameters: {
    source:
      '<ServerDrivenView\n  spec={Variables.accountScreen.dataSet}\n  data={{ user: Variables.currentUser.dataSet, orders: Variables.recentOrders }}\n  onAction={handleAction}\n/>',
  },
};

/** The same spec before any variable has loaded: no crash, just empty slots. */
export const UnresolvedData: Story = {
  args: {
    spec: ACCOUNT_SPEC,
    data: undefined,
  },
  parameters: {
    note: 'data is undefined: text renders blank and the empty-orders line shows.',
  },
};

/** A spec that does not parse renders an empty box instead of throwing. */
export const InvalidSpec: Story = {
  args: {
    spec: '{ "root": "oops"',
  },
  parameters: {
    note: 'spec is a truncated JSON string.',
  },
};
