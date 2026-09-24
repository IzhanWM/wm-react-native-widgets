import type { CommonWidgetProps } from '../widget-props/common';
import type { WidgetDataset, WidgetRow } from '../utils/dataset';

/** Map style the camera renders through. */
export type MapType = 'standard' | 'satellite' | 'hybrid' | 'terrain';

/**
 * Map SDK to render with. Android always renders Google Maps. On iOS, `google`
 * renders Google Maps when the app is built with an iOS Google Maps key (the
 * `react-native-maps` config plugin's `iosGoogleMapsApiKey`) and Apple Maps when
 * it is not; `default` always renders Apple Maps.
 */
export type MapProvider = 'default' | 'google';

/** A point on the map. */
export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Shape a marker row is read as. Field names are configurable, so the keys below
 * are the defaults; `color`, `imageUrl`, `radius` and `draggable` are always read
 * by name.
 */
export interface MapMarkerRow extends WidgetRow {
  /** Read via `latitudeField`. */
  latitude?: number;
  /** Read via `longitudeField`. */
  longitude?: number;
  /** Read via `titleField`, shown as the callout title. */
  title?: string;
  /** Read via `descriptionField`, shown as the callout subtitle. */
  description?: string;
  /** Tints this pin, overriding `markerColor`. */
  color?: string;
  /** Image drawn in place of this pin, overriding `markerIcon`. */
  imageUrl?: string;
  /** Meters of coverage drawn around this pin, overriding `markerRadius`. */
  radius?: number;
  /** Lets this pin be dragged, overriding `draggable`. */
  draggable?: boolean;
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
  /** True when a user gesture moved the camera, false for programmatic moves. */
  isGesture?: boolean;
}

/** Device position reported by `onUserLocationChange`. */
export interface MapUserLocation extends MapCoordinate {
  /** Meters above sea level. */
  altitude?: number;
  /** Horizontal accuracy in meters. */
  accuracy?: number;
  /** Direction of travel in degrees. */
  heading?: number;
  /** Speed in meters per second. */
  speed?: number;
  /** Fix time in milliseconds since the epoch. */
  timestamp?: number;
}

/** Emitted when a dragged pin is dropped. */
export interface MapMarkerDragEvent {
  /** The row behind the pin, as it was before the drag. */
  row: MapMarkerRow;
  /** Where the pin was dropped. */
  coordinate: MapCoordinate;
}

/**
 * Props for Maps (common -> maps). Markers and routePath are Studio datasets
 * normalized via `utils/dataset` — array, JSON string, or dataSet/content/data wrapper.
 */
export interface MapsProps extends CommonWidgetProps {
  /**
   * Map SDK on iOS. `google` uses Google Maps when the app has an iOS Google Maps
   * key and falls back to Apple Maps without one; `default` is always Apple Maps.
   * Android always renders Google Maps.
   * @default 'google'
   */
  provider?: MapProvider | string;
  /**
   * Map style. Apple Maps has no terrain style and falls back to standard.
   * @default 'standard'
   */
  mapType?: MapType | string;
  /**
   * Google Maps style array as a JSON string, used to restyle roads, labels and
   * terrain. Google Maps only; ignored on Apple Maps and when it does not parse.
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
   * Marker row field shown as the callout subtitle.
   * @default 'description'
   */
  descriptionField?: string;
  /**
   * Pin color used when a row has no `color`. Google Maps keeps only the hue.
   * @default '#EF4444'
   */
  markerColor?: string;
  /** Image URL drawn in place of the default pin; a row's `imageUrl` overrides it. */
  markerIcon?: string;
  /**
   * Meters of coverage drawn as a tinted circle around each pin; 0 draws none.
   * @default 0
   */
  markerRadius?: number;
  /**
   * Lets pins be dragged with a long press; a row's `draggable` overrides it.
   * @default false
   */
  draggable?: boolean;
  /** Ordered points drawn as a line, read with the same latitude/longitude fields. */
  routePath?: WidgetDataset;
  /**
   * Stroke color of the route line.
   * @default '#2563EB'
   */
  routeColor?: string;
  /**
   * Shows the device location. The widget asks for permission through
   * `expo-location` when it is installed, and stays off if it is denied. The
   * recenter button is Google Maps only. @default false
   */
  showsUserLocation?: boolean;
  /**
   * Zoom to fit every marker and route point instead of `latitude`/`longitude`/`zoom`.
   * @default false
   */
  fitToData?: boolean;
  /**
   * Allow pan/zoom/rotate/tilt gestures; turn off inside a scrolling page.
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
  /** Called with the coordinate that was long pressed. */
  onLongPress?: (coordinate: MapCoordinate) => void;
  /** Called with the row behind the tapped pin. */
  onMarkerPress?: (row: MapMarkerRow) => void;
  /** Called with the row whose callout bubble was tapped. */
  onCalloutPress?: (row: MapMarkerRow) => void;
  /** Called with the device position as it updates while `showsUserLocation` is on. */
  onUserLocationChange?: (location: MapUserLocation) => void;
  /** Called when a dragged pin is dropped, with its row and new coordinate. */
  onMarkerDragEnd?: (event: MapMarkerDragEvent) => void;
}
