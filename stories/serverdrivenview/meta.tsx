import type { Decorator, Meta } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { ServerDrivenView } from '@components/serverdrivenview/serverdrivenview';
import { widgetDecorator } from '../widget-decorator';
import { serverDrivenViewArgTypes } from './serverdrivenview.args';

/** Specs lay out like a phone screen, so stories get a phone-sized column. */
const widthDecorator: Decorator = (Story) => (
  <View style={{ width: 380, maxWidth: '100%' }}>
    <Story />
  </View>
);

export default {
  title: 'UI Widgets/Server Driven View/Catalog',
  component: ServerDrivenView,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    ...serverDrivenViewArgTypes,
  },
  decorators: [widthDecorator, widgetDecorator()],
} satisfies Meta<typeof ServerDrivenView>;
