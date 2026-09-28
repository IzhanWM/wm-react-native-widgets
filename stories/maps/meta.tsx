import type { Meta, Decorator } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { Maps } from '@components/maps/maps';
import { widgetDecorator } from '../widget-decorator';
import { STORYBOOK_MAPS_KEY, mapsArgTypes } from './maps.args';

/** The map has no width of its own, so stories give it a bounded frame. */
const frameDecorator: Decorator = (Story) => (
  <View
    style={{
      width: 640,
      maxWidth: '100%',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
    <Story />
  </View>
);

export default {
  title: 'UI Widgets/Maps/Appearance',
  component: Maps,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    ...mapsArgTypes,
  },
  args: {
    webApiKey: STORYBOOK_MAPS_KEY,
    height: 380,
  },
  decorators: [frameDecorator, widgetDecorator()],
} satisfies Meta<typeof Maps>;
