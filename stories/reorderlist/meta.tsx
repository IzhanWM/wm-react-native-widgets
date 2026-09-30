import type { Meta, Decorator } from '@storybook/react';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ReorderList } from '@components/reorderlist/reorderlist';
import { widgetDecorator } from '../widget-decorator';
import { reorderListArgTypes } from './reorderlist.args';

/**
 * The list virtualises and scrolls itself, so it needs a bounded box, and its drag
 * gesture needs a GestureHandlerRootView ancestor, on web too.
 */
const frameDecorator: Decorator = (Story) => (
  <GestureHandlerRootView
    style={{
      flex: 0,
      width: 380,
      maxWidth: '100%',
      height: 360,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
    <Story />
  </GestureHandlerRootView>
);

export default {
  title: 'UI Widgets/Reorder List/Appearance',
  component: ReorderList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    ...reorderListArgTypes,
  },
  decorators: [frameDecorator, widgetDecorator()],
} satisfies Meta<typeof ReorderList>;
