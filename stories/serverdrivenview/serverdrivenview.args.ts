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
  theme: {
    control: 'object',
    description:
      'The style spec: colors, space, radii, fonts, typography, per-component part styles with variants, classes and modes, merged over the defaults.',
  },
  themeMode: {
    control: 'text',
    description: 'Which theme mode applies: light, dark, system, or any mode the theme defines. Default: light',
  },
  api: {
    control: 'object',
    description:
      'The API schema: baseUrl, headers and named operations. A spec calls an operation by its name as an action and reads results with { "$api": "/name/data" }.',
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
