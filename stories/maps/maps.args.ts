/**
 * ArgTypes for Maps (common + maps).
 * common -> maps
 */
import { commonWidgetArgTypes } from '../args/widget-common';

/**
 * Web key the stories render with, read from the `STORYBOOK_MAPS_KEY` env var
 * (a `.env` file locally, a repo secret in CI). Without it the maps render
 * empty; a key can also be pasted into the Web API Key control.
 */
export const STORYBOOK_MAPS_KEY: string = import.meta.env.STORYBOOK_MAPS_KEY ?? '';

const mapsOnlyArgTypes = {
  webApiKey: {
    control: 'text',
    description:
      'Google Maps JavaScript API key for web. It ships in the page, so restrict it to your domains. Ignored on iOS and Android. Without it, web renders an empty box.',
  },
  provider: {
    control: 'inline-radio',
    options: ['google', 'default'],
    description: 'Map SDK on iOS. Ignored on web and Android, which always render Google Maps. Default: google',
  },
  mapType: {
    control: 'inline-radio',
    options: ['standard', 'satellite', 'hybrid', 'terrain'],
    description: 'Map style. Apple Maps has no terrain style and falls back to standard. Default: standard',
  },
  customMapStyle: {
    control: 'text',
    description: 'Google Maps style array as a JSON string. Ignored on Apple Maps and when it does not parse.',
  },
  latitude: { control: 'number', description: 'Latitude the map is centered on. Default: 12.9716' },
  longitude: { control: 'number', description: 'Longitude the map is centered on. Default: 77.5946' },
  zoom: {
    control: { type: 'range', min: 0, max: 20, step: 1 },
    description: 'Camera zoom. 0 is the whole world, 12 a city, 16 a street. Default: 12',
  },
  markers: { control: 'object', description: 'Rows to drop as pins.' },
  latitudeField: { control: 'text', description: 'Row field holding the latitude. Default: latitude' },
  longitudeField: { control: 'text', description: 'Row field holding the longitude. Default: longitude' },
  titleField: { control: 'text', description: 'Marker row field shown as the callout title. Default: title' },
  descriptionField: {
    control: 'text',
    description: 'Marker row field shown as the callout subtitle. Default: description',
  },
  markerColor: { control: 'color', description: 'Pin color used when a row has no color. Default: #EF4444' },
  markerIcon: { control: 'text', description: 'Image URL drawn in place of the default pin.' },
  markerRadius: {
    control: { type: 'range', min: 0, max: 3000, step: 100 },
    description: 'Meters of coverage drawn around each pin; 0 draws none. Default: 0',
  },
  draggable: { control: 'boolean', description: 'Lets pins be dragged. Default: false' },
  routePath: { control: 'object', description: 'Ordered points drawn as a line.' },
  routeColor: { control: 'color', description: 'Stroke color of the route line. Default: #2563EB' },
  showsUserLocation: {
    control: 'boolean',
    description: 'Shows the device location. The browser asks for permission on web. Default: false',
  },
  fitToData: {
    control: 'boolean',
    description: 'Zoom to fit every marker and route point instead of the center and zoom. Default: false',
  },
  interactive: { control: 'boolean', description: 'Allow pan and zoom gestures. Default: true' },
  height: { control: 'text', description: 'Map height: dp, a percentage, or fill.' },
  onMapReady: { control: false, description: 'Called once the map is laid out and ready.' },
  onRegionChange: { control: false, description: 'Called with the new region once the camera settles.' },
  onMapPress: { control: false, description: 'Called with the coordinate that was tapped.' },
  onLongPress: {
    control: false,
    description: 'Called with the coordinate that was long pressed; on web, right-clicked too.',
  },
  onMarkerPress: { control: false, description: 'Called with the row behind the tapped pin.' },
  onCalloutPress: { control: false, description: 'Called with the row whose callout was tapped.' },
  onUserLocationChange: { control: false, description: 'Called with the device position as it updates.' },
  onMarkerDragEnd: { control: false, description: 'Called with the row and new coordinate of a dropped pin.' },
} as const;

export const mapsArgTypes = {
  ...commonWidgetArgTypes,
  ...mapsOnlyArgTypes,
} as const;
