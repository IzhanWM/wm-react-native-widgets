/**
 * ArgTypes shared by every UI widget.
 * common -> dataset-backed widgets add {@link datasetWidgetArgTypes}
 */
export const commonWidgetArgTypes = {
  style: {
    control: 'object',
    description: "Style applied to the widget's outermost container.",
  },
} as const;

/** ArgTypes for widgets that render a bound collection. */
export const datasetWidgetArgTypes = {
  ...commonWidgetArgTypes,
  dataset: {
    control: 'object',
    description:
      'Rows to render. Accepts an array, a JSON string, or a Studio dataset wrapper ({ dataSet }, { content } or { data }). An unresolved value renders the empty state.',
  },
} as const;
