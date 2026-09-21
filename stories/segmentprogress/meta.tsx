import type { Meta, Decorator } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { SegmentProgress } from '@components/segmentprogress/segmentprogress';
import { widgetDecorator } from '../widget-decorator';
import { segmentProgressArgTypes } from './segmentprogress.args';

/** The bar measures its parent, so stories need a bounded width to lay out. */
const widthDecorator: Decorator = (Story) => (
  <View style={{ width: 420, maxWidth: '100%' }}>
    <Story />
  </View>
);

export default {
  title: 'UI Widgets/Segment Progress/Appearance',
  component: SegmentProgress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    ...segmentProgressArgTypes,
  },
  decorators: [widthDecorator, widgetDecorator()],
} satisfies Meta<typeof SegmentProgress>;
