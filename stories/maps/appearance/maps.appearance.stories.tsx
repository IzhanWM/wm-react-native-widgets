import type { StoryObj } from '@storybook/react';
import meta from '../meta';
import { DELIVERY_ROUTE, MUTED_MAP_STYLE, OUTLETS } from '../../sample-data';

export default { ...meta, title: 'UI Widgets/Maps/Appearance' };
type Story = StoryObj<typeof meta>;

/** Satellite imagery with labels. */
export const Hybrid: Story = {
  args: {
    markers: OUTLETS,
    mapType: 'hybrid',
    fitToData: true,
  },
};

/** Terrain shading. Apple Maps has no terrain style and shows standard instead. */
export const Terrain: Story = {
  args: {
    latitude: 13.37,
    longitude: 77.68,
    zoom: 11,
    mapType: 'terrain',
  },
};

/** Google style JSON restyles the base map. Ignored on Apple Maps. */
export const CustomStyle: Story = {
  args: {
    markers: OUTLETS,
    routePath: DELIVERY_ROUTE,
    customMapStyle: MUTED_MAP_STYLE,
    markerColor: '#0E7C86',
    routeColor: '#0E7C86',
    fitToData: true,
  },
};

/** One tint for every pin, with a coverage circle around each. The last row overrides both. */
export const ColorAndRadius: Story = {
  args: {
    markers: OUTLETS,
    markerColor: '#7C3AED',
    markerRadius: 600,
    fitToData: true,
  },
};

/** An image in place of the pin, drawn at its own size and anchored at its bottom center. */
export const MarkerIcon: Story = {
  args: {
    markers: OUTLETS,
    markerIcon: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png',
    fitToData: true,
  },
};
