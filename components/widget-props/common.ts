import type { StyleProp, ViewStyle } from 'react-native';
import type { WidgetDataset } from '../utils/dataset';

/**
 * Props shared by every UI widget.
 * common -> dataset-backed widgets add {@link DatasetWidgetProps}
 */
export interface CommonWidgetProps {
  /**
   * Style applied to the widget's outermost container.
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Props shared by widgets that render a bound collection.
 * Accepts an array, a JSON string, or a Studio dataset wrapper
 * (`{ dataSet }`, `{ content }` or `{ data }`) — see `utils/dataset`.
 */
export interface DatasetWidgetProps extends CommonWidgetProps {
  /**
   * Rows to render. Array, JSON string, or Studio dataset wrapper.
   * An unresolved or unparseable value renders the widget's empty state.
   */
  dataset?: WidgetDataset;
}

/**
 * Platform reach of a widget, reported by `WIDGET_PLATFORM_SUPPORT`.
 *
 * - `universal` — one implementation runs on iOS, Android and web.
 * - `web-fallback` — web loads a separate implementation that keeps the same
 *   public contract; see the widget's docs for what differs.
 */
export type WidgetPlatformSupport = 'universal' | 'web-fallback';
