import type { Meta, Decorator } from '@storybook/react';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SwipeDeck } from '@components/swipedeck/swipedeck';
import { widgetDecorator } from '../widget-decorator';
import { swipeDeckArgTypes } from './swipedeck.args';

/**
 * The deck's pan gesture needs a GestureHandlerRootView ancestor, on web too.
 * Padding leaves room for the top card to tilt while it is dragged.
 */
const gestureRootDecorator: Decorator = (Story) => (
  <GestureHandlerRootView style={{ flex: 0, padding: 24 }}>
    <Story />
  </GestureHandlerRootView>
);

export default {
  title: 'UI Widgets/Swipe Deck/Appearance',
  component: SwipeDeck,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    ...swipeDeckArgTypes,
  },
  decorators: [gestureRootDecorator, widgetDecorator()],
} satisfies Meta<typeof SwipeDeck>;
