import type { StoryObj } from '@storybook/react';
import meta from '../meta';
import { DELIVERY_ROUTE, MUTED_MAP_STYLE, OUTLETS } from '../../sample-data';

/**
 * The props that visibly change the map, one per story. The stories under
 * UI Widgets/Maps, Appearance and Interaction are the combined examples.
 *
 * Autodocs is off here: a docs page would mount every map at once. Each story's
 * description is its `note`, shown above the map.
 */
export default { ...meta, title: 'UI Widgets/Maps/Props', tags: ['!autodocs'] };
type Story = StoryObj<typeof meta>;

const PIN_ICON = 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png';

/** Outlets that each carry their own color, and one its own icon and coverage radius. */
const STYLED_OUTLETS = OUTLETS.map((row, index) => ({
  ...row,
  color: ['#DC2626', '#2563EB', '#16A34A', '#D97706', '#7C3AED'][index],
  ...(index === 1 && { imageUrl: PIN_ICON }),
  ...(index === 2 && { radius: 1200 }),
}));

// ---------------------------------------------------------------------------
// Base map
// ---------------------------------------------------------------------------

export const Satellite: Story = {
  args: { markers: OUTLETS, mapType: 'satellite', fitToData: true },
  parameters: {
    note: 'Aerial imagery, no labels.',
    source: '<Maps markers={outlets} mapType="satellite" fitToData />',
  },
};

export const Hybrid: Story = {
  args: { markers: OUTLETS, mapType: 'hybrid', fitToData: true },
  parameters: {
    note: 'Aerial imagery with labels.',
    source: '<Maps markers={outlets} mapType="hybrid" fitToData />',
  },
};

export const Terrain: Story = {
  args: { latitude: 13.37, longitude: 77.68, zoom: 11, mapType: 'terrain' },
  parameters: {
    note: 'Shaded hills. Apple Maps shows standard instead.',
    source: '<Maps latitude={13.37} longitude={77.68} zoom={11} mapType="terrain" />',
  },
};

export const CustomMapStyle: Story = {
  args: { markers: OUTLETS, customMapStyle: MUTED_MAP_STYLE, fitToData: true },
  parameters: {
    note: 'A muted Google style. Ignored on Apple Maps.',
    source: '<Maps markers={outlets} customMapStyle={mutedStyleJson} fitToData />',
  },
};

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

export const MapCenter: Story = {
  args: { markers: OUTLETS, latitude: 13.1989, longitude: 77.7068, zoom: 13 },
  parameters: {
    note: 'latitude + longitude: centered on the airport.',
    source: '<Maps markers={outlets} latitude={13.1989} longitude={77.7068} zoom={13} />',
  },
};

export const Zoom: Story = {
  args: { markers: OUTLETS, latitude: 12.9756, longitude: 77.6066, zoom: 16 },
  parameters: {
    note: 'Street level. 0 is the world, 12 a city.',
    source: '<Maps markers={outlets} latitude={12.9756} longitude={77.6066} zoom={16} />',
  },
};

export const FitToData: Story = {
  args: { markers: OUTLETS, routePath: DELIVERY_ROUTE, latitude: 19.076, longitude: 72.8777, zoom: 12, fitToData: true },
  parameters: {
    note: 'The center is Mumbai, but the camera frames the data.',
    source: '<Maps markers={outlets} routePath={route} latitude={19.076} longitude={72.8777} fitToData />',
  },
};

// ---------------------------------------------------------------------------
// Markers
// ---------------------------------------------------------------------------

export const Markers: Story = {
  args: { markers: OUTLETS, fitToData: true },
  parameters: {
    note: 'One pin per row. Tap a pin for its callout.',
    source: '<Maps markers={outlets} fitToData />',
  },
};

export const MarkerColor: Story = {
  args: { markers: OUTLETS, markerColor: '#7C3AED', fitToData: true },
  parameters: {
    note: 'Purple pins; one row keeps its own teal.',
    source: '<Maps markers={outlets} markerColor="#7C3AED" fitToData />',
  },
};

export const MarkerIcon: Story = {
  args: { markers: OUTLETS, markerIcon: PIN_ICON, fitToData: true },
  parameters: {
    note: 'An image in place of every pin.',
    source: '<Maps markers={outlets} markerIcon={iconUrl} fitToData />',
  },
};

export const MarkerRadius: Story = {
  args: { markers: OUTLETS, markerRadius: 600, fitToData: true },
  parameters: {
    note: 'A 600 m circle around each pin.',
    source: '<Maps markers={outlets} markerRadius={600} fitToData />',
  },
};

export const PerRowMarkerStyle: Story = {
  args: { markers: STYLED_OUTLETS, fitToData: true },
  parameters: {
    note: 'Rows set their own color, imageUrl and radius.',
    source: "<Maps markers={[{ ..., color: '#2563EB', imageUrl, radius: 1200 }]} fitToData />",
  },
};

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const RoutePath: Story = {
  args: { routePath: DELIVERY_ROUTE, fitToData: true },
  parameters: {
    note: 'The route drawn as a line.',
    source: '<Maps routePath={route} fitToData />',
  },
};

export const RouteColor: Story = {
  args: { routePath: DELIVERY_ROUTE, routeColor: '#F97316', fitToData: true },
  parameters: {
    note: 'The route in orange.',
    source: '<Maps routePath={route} routeColor="#F97316" fitToData />',
  },
};

// ---------------------------------------------------------------------------
// Layout and chrome
// ---------------------------------------------------------------------------

export const Height: Story = {
  args: { markers: OUTLETS, fitToData: true, height: 220 },
  parameters: {
    note: '220 instead of 380. Also takes a percentage or "fill".',
    source: '<Maps markers={outlets} fitToData height={220} />',
  },
};

export const Style: Story = {
  args: { markers: OUTLETS, fitToData: true, style: { margin: 16, borderRadius: 24, overflow: 'hidden' } },
  parameters: {
    note: 'Inset, with rounded corners.',
    source: "<Maps markers={outlets} fitToData style={{ margin: 16, borderRadius: 24, overflow: 'hidden' }} />",
  },
};

export const UserLocation: Story = {
  args: { showsUserLocation: true, zoom: 5 },
  parameters: {
    note: 'Allow location access to see the blue dot. The map does not follow it.',
    source: '<Maps showsUserLocation zoom={5} />',
  },
};
