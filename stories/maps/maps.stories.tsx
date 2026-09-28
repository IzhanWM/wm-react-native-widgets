import type { StoryObj } from '@storybook/react';
import meta from './meta';
import { DELIVERY_ROUTE, OUTLETS, STUDIO_OUTLETS } from '../sample-data';

export default { ...meta, title: 'UI Widgets/Maps', tags: ['autodocs'] };
type Story = StoryObj<typeof meta>;

/**
 * Pins from a dataset, framed with `fitToData`. Tap a pin for its callout.
 *
 * Storybook runs the **web** implementation, Google Maps through the Maps
 * JavaScript API, with the key from `STORYBOOK_MAPS_KEY`; paste a key into the
 * Web API Key control to use your own. On device the same props render `react-native-maps`.
 */
export const Default: Story = {
  args: {
    markers: OUTLETS,
    fitToData: true,
  },
  parameters: {
    note: 'Web preview on the Google Maps JavaScript API. Without a Web API Key the box stays empty.',
    source: '<Maps webApiKey={key} markers={outlets} fitToData height={380} />',
  },
};

/** A route line through the outlets, with the camera fitted to both. */
export const Route: Story = {
  args: {
    markers: OUTLETS,
    routePath: DELIVERY_ROUTE,
    routeColor: '#0E7C86',
    fitToData: true,
  },
};

/** A fixed camera from latitude, longitude and zoom, with gestures off. */
export const FixedCamera: Story = {
  args: {
    markers: OUTLETS,
    latitude: 12.9716,
    longitude: 77.5946,
    zoom: 13,
    interactive: false,
  },
};

/**
 * Markers bound the way a Studio live variable delivers them: a `{ dataSet }`
 * wrapper, the page's own column names mapped through the `*Field` props, and
 * coordinates as strings. The two rows with unresolved coordinates are dropped
 * rather than pinned at 0,0.
 */
export const StudioBinding: Story = {
  args: {
    markers: STUDIO_OUTLETS,
    latitudeField: 'lat',
    longitudeField: 'lng',
    titleField: 'name',
    descriptionField: 'address',
    fitToData: true,
  },
  parameters: {
    note: 'Seven rows in the dataSet; five pins. The two rows with null / "n/a" coordinates are skipped.',
    source:
      '<Maps markers={Variables.outlets} latitudeField="lat" longitudeField="lng" titleField="name" descriptionField="address" fitToData />',
  },
};
