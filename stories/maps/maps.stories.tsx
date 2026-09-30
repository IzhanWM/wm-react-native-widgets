import type { StoryObj } from '@storybook/react';
import meta from './meta';
import { DELIVERY_ROUTE, OUTLETS, STUDIO_OUTLETS } from '../sample-data';

export default { ...meta, title: 'UI Widgets/Maps', tags: ['autodocs'] };
type Story = StoryObj<typeof meta>;

/** Pins from a dataset, framed with `fitToData`. Tap a pin for its callout. */
export const Default: Story = {
  args: {
    markers: OUTLETS,
    fitToData: true,
  },
  parameters: {
    note: 'Needs a Web API Key; without one the box stays empty.',
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

/** A Studio variable: `{ dataSet }` wrapper, custom column names, string coordinates. */
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
    note: 'Seven rows, five pins: rows without valid coordinates are skipped.',
    source:
      '<Maps markers={Variables.outlets} latitudeField="lat" longitudeField="lng" titleField="name" descriptionField="address" fitToData />',
  },
};
