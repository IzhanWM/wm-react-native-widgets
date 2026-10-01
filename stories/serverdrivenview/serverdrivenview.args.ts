/**
 * ArgTypes for ServerDrivenView (common + serverdrivenview).
 * common -> serverdrivenview
 */
import { commonWidgetArgTypes } from '../args/widget-common';

const serverDrivenViewOnlyArgTypes = {
  spec: {
    control: 'object',
    description:
      'The UI to render: json-render\'s flat { root, elements } format, a nested tree, or either as a JSON string. Bind it to a variable to serve the UI from a backend.',
  },
  data: {
    control: 'object',
    description:
      'Bound variables the spec reads with { "$data": "/path" }. Read-only from the spec; updates re-render live.',
  },
  accentColor: {
    control: 'color',
    description: 'Primary color of the built-in components. Default: #2563EB',
  },
  components: {
    control: false,
    description: 'Extra or overriding catalog components, by type name.',
  },
  actions: {
    control: false,
    description: 'Handlers for custom actions, by name. Unhandled ones fire onAction.',
  },
  onAction: {
    control: false,
    description: 'Called for a custom action with no handler in actions.',
  },
  onStateChange: {
    control: false,
    description: 'Called after every write to local state.',
  },
} as const;

export const serverDrivenViewArgTypes = {
  ...commonWidgetArgTypes,
  ...serverDrivenViewOnlyArgTypes,
} as const;
