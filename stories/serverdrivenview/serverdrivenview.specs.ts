/**
 * UI specs the ServerDrivenView stories render. Each is plain JSON — the same
 * value a Studio page would bind from a variable or receive from a backend.
 */
import type { ServerDrivenNestedSpec, ServerDrivenSpec } from '@components/serverdrivenview';

/**
 * Account screen bound to two variables: `data.user` (a model variable) and
 * `data.orders` (a live variable, still wrapped in `dataSet`).
 */
export const ACCOUNT_SPEC: ServerDrivenSpec = {
  root: 'screen',
  elements: {
    screen: { type: 'Column', props: { gap: 16 }, children: ['profile', 'ordersCard'] },
    profile: { type: 'Card', children: ['identity', 'loyalty'] },
    identity: { type: 'Row', props: { gap: 12 }, children: ['avatar', 'names', 'tier'] },
    avatar: { type: 'Image', props: { src: { $data: '/user/avatar' }, width: 56, height: 56, radius: 28 } },
    names: { type: 'Column', props: { gap: 2, flex: 1 }, children: ['fullName', 'email'] },
    fullName: {
      type: 'Text',
      props: { variant: 'title', text: { $template: '${$data/user/firstName} ${$data/user/lastName}' } },
    },
    email: { type: 'Text', props: { variant: 'caption', text: { $data: '/user/email' } } },
    tier: {
      type: 'Badge',
      props: {
        text: { $cond: { $data: '/user/tier', eq: 'gold' }, $then: 'Gold', $else: 'Member' },
        color: { $cond: { $data: '/user/tier', eq: 'gold' }, $then: '#B45309', $else: '#6B7280' },
      },
    },
    loyalty: { type: 'Column', props: { gap: 6 }, children: ['pointsLabel', 'pointsBar'] },
    pointsLabel: {
      type: 'Text',
      props: {
        variant: 'caption',
        text: { $template: '${$data/user/points} of ${$data/user/nextTierPoints} points to the next tier' },
      },
    },
    pointsBar: {
      type: 'ProgressBar',
      props: { value: { $data: '/user/points' }, max: { $data: '/user/nextTierPoints' } },
    },
    ordersCard: { type: 'Card', props: { title: 'Recent orders' }, children: ['orderList', 'noOrders', 'refresh'] },
    orderList: {
      type: 'Column',
      props: { gap: 0 },
      repeat: { dataPath: '/orders', key: 'id' },
      children: ['order'],
    },
    order: {
      type: 'ListItem',
      props: {
        title: { $item: 'item' },
        subtitle: { $template: '${$item/id} · ${$item/status}' },
        imageUrl: { $item: 'image' },
        trailing: { $template: '$${$item/total}' },
        chevron: true,
      },
      on: { press: { action: 'openOrder', params: { orderId: { $item: 'id' } } } },
    },
    noOrders: {
      type: 'Text',
      props: { variant: 'caption', text: 'No orders yet.' },
      visible: { $data: '/orders/dataSet', not: true },
    },
    refresh: {
      type: 'Button',
      props: { label: 'Refresh', variant: 'outline' },
      on: { press: { action: 'refreshOrders' } },
    },
  },
};

/**
 * Edit-profile form. State is seeded from `data` with `$data`, so the fields
 * fill in when the variable loads; inputs write back with `$bindState`.
 */
export const PROFILE_FORM_SPEC: ServerDrivenSpec = {
  root: 'form',
  state: {
    form: {
      firstName: { $data: '/firstName' },
      email: { $data: '/email' },
      newsletter: { $data: '/newsletter' },
    },
    saving: false,
  },
  elements: {
    form: { type: 'Card', props: { title: 'Edit profile', gap: 12 }, children: ['loading', 'firstName', 'email', 'newsletter', 'emailWarning', 'actions'] },
    loading: { type: 'Row', visible: { $data: '/email', not: true }, children: ['spinner', 'loadingText'] },
    spinner: { type: 'Spinner' },
    loadingText: { type: 'Text', props: { variant: 'caption', text: 'Loading the user variable…' } },
    firstName: {
      type: 'TextInput',
      props: { label: 'First name', value: { $bindState: '/form/firstName' }, placeholder: 'First name' },
    },
    email: {
      type: 'TextInput',
      props: {
        label: 'Email',
        value: { $bindState: '/form/email' },
        placeholder: 'name@example.com',
        keyboardType: 'email-address',
        autoCapitalize: 'none',
      },
    },
    newsletter: { type: 'Switch', props: { label: 'Monthly newsletter', value: { $bindState: '/form/newsletter' } } },
    emailWarning: {
      type: 'Text',
      props: { variant: 'caption', color: '#B45309', text: 'The email is changing from the saved one.' },
      visible: [{ $state: '/form/email' }, { $state: '/form/email', neq: { $data: '/email' } }],
    },
    actions: { type: 'Row', props: { justify: 'end' }, children: ['reset', 'save'] },
    reset: { type: 'Button', props: { label: 'Reset', variant: 'ghost' }, on: { press: { action: 'resetState' } } },
    save: {
      type: 'Button',
      props: { label: 'Save', loading: { $state: '/saving' } },
      on: { press: { action: 'saveProfile', params: { profile: { $state: '/form' } } } },
    },
  },
};

/**
 * A to-do list held entirely in local state: `pushState` adds, `removeState`
 * deletes, `$bindItem` ticks a row, and the repeat reads `statePath`.
 */
export const TODO_SPEC: ServerDrivenSpec = {
  root: 'card',
  state: {
    draft: '',
    todos: [
      { id: 1, text: 'Bind the spec to a variable', done: true },
      { id: 2, text: 'Handle onAction in the page', done: false },
    ],
  },
  elements: {
    card: { type: 'Card', props: { title: 'To-do', gap: 12 }, children: ['composer', 'list', 'empty', 'summary'] },
    composer: { type: 'Row', children: ['draft', 'add'] },
    draft: {
      type: 'TextInput',
      props: { value: { $bindState: '/draft' }, placeholder: 'Add a task', style: { flex: 1 } },
      on: {
        submit: [
          { action: 'pushState', params: { statePath: '/todos', value: { text: { $state: '/draft' }, done: false } } },
          { action: 'setState', params: { statePath: '/draft', value: '' } },
        ],
      },
    },
    add: {
      type: 'Button',
      props: { label: 'Add', disabled: { $cond: { $state: '/draft' }, $then: false, $else: true } },
      on: {
        press: [
          { action: 'pushState', params: { statePath: '/todos', value: { text: { $state: '/draft' }, done: false } } },
          { action: 'setState', params: { statePath: '/draft', value: '' } },
        ],
      },
    },
    list: { type: 'Column', props: { gap: 4 }, repeat: { statePath: '/todos' }, children: ['todo'] },
    todo: { type: 'Row', children: ['check', 'remove'] },
    check: {
      type: 'Checkbox',
      props: { label: { $item: 'text' }, checked: { $bindItem: 'done' }, strikeWhenChecked: true, style: { flex: 1 } },
    },
    remove: {
      type: 'Button',
      props: { label: 'Remove', variant: 'ghost', color: '#DC2626' },
      on: { press: { action: 'removeState', params: { statePath: '/todos', index: { $index: true } } } },
    },
    empty: { type: 'Text', props: { variant: 'caption', text: 'Nothing left to do.' }, visible: { $state: '/todos', not: true } },
    summary: {
      type: 'Text',
      props: { variant: 'caption', text: { $template: '${/todos/length} tasks' } },
      visible: { $state: '/todos' },
    },
  },
};

/** The same kind of screen written as a nested tree, the easier form to hand-write. */
export const NESTED_SPEC: ServerDrivenNestedSpec = {
  state: { liked: false },
  root: {
    type: 'Card',
    props: { title: 'Nested format', subtitle: 'Children are elements, not keys' },
    children: [
      'A bare string child renders as Text.',
      {
        type: 'Row',
        children: [
          {
            type: 'Button',
            key: 'like',
            props: { label: { $cond: { $state: '/liked' }, $then: 'Liked', $else: 'Like' } },
            on: { press: { action: 'toggleState', params: { statePath: '/liked' } } },
          },
          {
            type: 'Text',
            props: { variant: 'caption', text: 'Thanks!' },
            visible: { $state: '/liked' },
          },
        ],
      },
    ],
  },
};

/** One of every built-in layout, content, input and feedback component. */
export const GALLERY_SPEC: ServerDrivenNestedSpec = {
  state: { name: '', agree: true, wifi: false, qty: 2 },
  root: {
    type: 'Column',
    props: { gap: 14 },
    children: [
      { type: 'Heading', props: { text: 'Heading level 1' } },
      { type: 'Heading', props: { text: 'Heading level 3', level: 3 } },
      {
        type: 'Column',
        props: { gap: 2 },
        children: ['title', 'subtitle', 'body', 'caption', 'label'].map((variant) => ({
          type: 'Text',
          props: { variant, text: `Text · ${variant}` },
        })),
      },
      {
        type: 'Row',
        props: { wrap: true },
        children: [
          { type: 'Badge', props: { text: 'Badge' } },
          { type: 'Badge', props: { text: 'Success', color: '#15803D' } },
          { type: 'Badge', props: { text: 'Muted', color: '#E5E7EB', textColor: '#374151' } },
        ],
      },
      {
        type: 'Row',
        props: { wrap: true },
        children: ['primary', 'secondary', 'outline', 'ghost', 'danger'].map((variant) => ({
          type: 'Button',
          props: { label: variant, variant },
        })),
      },
      { type: 'TextInput', props: { label: 'TextInput', placeholder: 'Type here', value: { $bindState: '/name' } } },
      { type: 'Checkbox', props: { label: 'Checkbox', checked: { $bindState: '/agree' } } },
      { type: 'Switch', props: { label: 'Switch', value: { $bindState: '/wifi' } } },
      { type: 'Stepper', props: { label: 'Stepper', value: { $bindState: '/qty' }, min: 0, max: 10 } },
      { type: 'ProgressBar', props: { value: 64, max: 100 } },
      { type: 'Divider' },
      {
        type: 'Row',
        children: [
          { type: 'Spinner' },
          { type: 'Text', props: { variant: 'caption', text: 'Spinner' } },
          { type: 'Spacer' },
          { type: 'Text', props: { variant: 'caption', text: 'Spacer pushes this right' } },
        ],
      },
      {
        type: 'ListItem',
        props: { title: 'ListItem', subtitle: 'With an image, trailing text and a chevron', imageUrl: 'https://i.pravatar.cc/150?img=5', trailing: '42', chevron: true },
      },
      {
        type: 'ScrollView',
        props: { horizontal: true, gap: 8 },
        children: [1, 2, 3, 4, 5, 6].map((n) => ({
          type: 'View',
          props: { width: 72, height: 48, radius: 8, background: '#DBEAFE', align: 'center', justify: 'center' },
          children: [{ type: 'Text', props: { text: `Scroll ${n}`, variant: 'caption' } }],
        })),
      },
    ],
  },
};

/** The three library widgets the catalog exposes, fed from bound data. */
export const WIDGETS_SPEC: ServerDrivenNestedSpec = {
  root: {
    type: 'Column',
    props: { gap: 16 },
    children: [
      { type: 'Text', props: { variant: 'label', text: 'AvatarStack' } },
      {
        type: 'AvatarStack',
        props: { dataset: { $data: '/team' }, maxVisible: 4 },
        on: { select: { action: 'memberSelected', params: { name: { $event: 'member.name' } } } },
      },
      { type: 'Text', props: { variant: 'label', text: 'SegmentProgress' } },
      { type: 'SegmentProgress', props: { dataset: { $data: '/storage' }, total: 128 } },
      { type: 'Text', props: { variant: 'label', text: 'QrCode' } },
      { type: 'QrCode', props: { value: { $data: '/shareUrl' }, size: 120 } },
    ],
  },
};
