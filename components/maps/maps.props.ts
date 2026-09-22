import type { CommonWidgetProps } from '../widget-props/common';
import type { WidgetDataset, WidgetRow } from '../utils/dataset';

/** Map style the camera renders through. */
export type MapType = 'standard' | 'satellite' | 'hybrid' | 'terrain';

/** A point on the map. */
export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Shape a marker row is read as. Field names are configurable, so the keys below
 * are the defaults; `color`, `imageUrl` and `radius` are always read by name.
 */
export interface MapMarkerRow extends WidgetRow {
  /** Read via `latitudeField`. */
  latitude?: number;
  /** Read via `longitudeField`. */
  longitude?: number;
  /** Read via `titleField`, shown as the callout title. */
  title?: string;
  /** Read via `descriptionField`, shown as the callout subtitle (Android only). */
  description?: string;
  /** Tints this pin, overriding `markerColor`. */
  color?: string;
  /** Image drawn in place of this pin, overriding `markerIcon`. */
  imageUrl?: string;
  /** Meters of coverage drawn around this pin, overriding `markerRadius`. */
  radius?: number;
}

/** Emitted once the camera settles after a pan, zoom, rotate or tilt. */
export interface MapRegionEvent extends MapCoordinate {
  /** Latitude span of the visible region. */
  latitudeDelta?: number;
  /** Longitude span of the visible region. */
  longitudeDelta?: number;
  /** Zoom level the camera came to rest at. */
  zoom?: number;
  /** Camera tilt in degrees. */
  tilt?: number;
  /** Camera bearing in degrees. */
  bearing?: number;
}

/**
 * Props for Maps (common -> maps). Markers and routePath are Studio datasets
 * normalized via `utils/dataset` — array, JSON string, or dataSet/content/data wrapper.
 */
export interface MapsProps extends CommonWidgetProps {
  /**
   * Map style. Apple Maps has no terrain style and falls back to standard.
   * @default 'standard'
   */
  mapType?: MapType | string;
  /**
   * Google Maps style array as a JSON string, used to restyle roads, labels and
   * terrain. Android only; ignored when it does not parse.
   */
  customMapStyle?: string;
  /**
   * Latitude the map is centered on. Rebinding it recenters the map.
   * @default 12.9716
   */
  latitude?: number;
  /**
   * Longitude the map is centered on. Rebinding it recenters the map.
   * @default 77.5946
   */
  longitude?: number;
  /**
   * Camera zoom. 0 is the whole world, 12 a city, 16 a street, 20 a building.
   * @default 12
   */
  zoom?: number;
  /** Rows to drop as pins. */
  markers?: WidgetDataset;
  /**
   * Row field holding the latitude, in both `markers` and `routePath`.
   * @default 'latitude'
   */
  latitudeField?: string;
  /**
   * Row field holding the longitude, in both `markers` and `routePath`.
   * @default 'longitude'
   */
  longitudeField?: string;
  /**
   * Marker row field shown as the callout title.
   * @default 'title'
   */
  titleField?: string;
  /**
   * Marker row field shown as the callout subtitle (Android only).
   * @default 'description'
   */
  descriptionField?: string;
  /**
   * Pin color used when a row has no `color`; Android only tints the radius circle.
   * @default '#EF4444'
   */
  markerColor?: string;
  /**
   * Image drawn in place of the default pin; a row's `imageUrl` overrides it.
   * Restyles pins on Android.
   */
  markerIcon?: string;
  /**
   * Meters of coverage drawn as a tinted circle around each pin; 0 draws none.
   * @default 0
   */
  markerRadius?: number;
  /** Ordered points drawn as a line, read with the same latitude/longitude fields. */
  routePath?: WidgetDataset;
  /**
   * Stroke color of the route line.
   * @default '#2563EB'
   */
  routeColor?: string;
  /**
   * Shows device location and recenter button; needs location permission via
   * expo-maps, stays off if it is denied. @default false
   */
  showsUserLocation?: boolean;
  /**
   * Zoom to fit every marker and route point instead of `latitude`/`longitude`/`zoom`.
   * @default false
   */
  fitToData?: boolean;
  /**
   * Allow pan/zoom/rotate/tilt gestures; turn off inside a scrolling page. Android only.
   * @default true
   */
  interactive?: boolean;
  /**
   * Map height: dp, a percentage, or 'fill'. Falls back to `style`, then
   * fills its parent.
   */
  height?: number | string;
  /** Called once the map surface is laid out and ready. */
  onMapReady?: () => void;
  /** Called with the new region once the camera settles. */
  onRegionChange?: (event: MapRegionEvent) => void;
  /** Called with the coordinate that was tapped. */
  onMapPress?: (coordinate: MapCoordinate) => void;
  /** Called with the coordinate that was long pressed. Android only. */
  onLongPress?: (coordinate: MapCoordinate) => void;
  /**
   * Called with the row behind the tapped pin. On Apple Maps this needs
   * iOS 18 or later.
   */
  onMarkerPress?: (row: MapMarkerRow) => void;
}
