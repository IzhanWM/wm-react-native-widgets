/**
 * ArgTypes for SwipeDeck (common + dataset + swipedeck).
 * common -> dataset -> swipedeck
 */
import { datasetWidgetArgTypes } from '../args/widget-common';

const swipeDeckOnlyArgTypes = {
  titleField: { control: 'text', description: 'Row field shown as the card title. Default: title' },
  subtitleField: { control: 'text', description: 'Row field shown under the title. Default: subtitle' },
  imageField: { control: 'text', description: 'Row field holding the card image URL. Default: image' },
  imageHeight: {
    control: { type: 'range', min: 0, max: 320, step: 10 },
    description: 'Height of the image band at the top of each card. Default: 180',
  },
  cardWidth: {
    control: { type: 'range', min: 200, max: 400, step: 10 },
    description: 'Card width in pixels. Default: 300',
  },
  cardHeight: {
    control: { type: 'range', min: 240, max: 520, step: 10 },
    description: 'Card height in pixels. Default: 380',
  },
  stackOffset: {
    control: { type: 'range', min: 0, max: 32, step: 2 },
    description: 'Pixels each card behind the top one is offset by. Default: 12',
  },
  stackDepth: {
    control: { type: 'range', min: 0, max: 4, step: 1 },
    description: 'How many cards are drawn behind the top card. Default: 2',
  },
  swipeThreshold: {
    control: { type: 'range', min: 40, max: 240, step: 10 },
    description: 'Drag distance that commits a swipe; shorter drags spring back. Default: 120',
  },
  cardColor: { control: 'color', description: 'Card background color. Default: #FFFFFF' },
  enabled: { control: 'boolean', description: 'Whether dragging is accepted. Default: true' },
  onSwipeRight: { control: false, description: 'Called when a card is swiped right (accept).' },
  onSwipeLeft: { control: false, description: 'Called when a card is swiped left (reject).' },
  onDeckEmpty: { control: false, description: 'Called once after the last card leaves the deck.' },
} as const;

export const swipeDeckArgTypes = {
  ...datasetWidgetArgTypes,
  ...swipeDeckOnlyArgTypes,
} as const;
