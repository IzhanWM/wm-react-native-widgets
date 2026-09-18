import type { DatasetWidgetProps } from '../widget-props/common';
import type { WidgetRow } from '../utils/dataset';

/** Direction a card left the deck in. */
export type SwipeDirection = 'left' | 'right';

/** Shape a card row is read as. */
export interface SwipeCard extends WidgetRow {
  /** Stable identity; falls back to the deck position for the React key. */
  id?: string | number;
  /** Headline text, read via `titleField`. */
  title?: string;
  /** Secondary text under the title, read via `subtitleField`. */
  subtitle?: string;
  /** Image URL drawn across the top of the card, read via `imageField`. */
  image?: string;
}

/** Emitted when a card is committed past the swipe threshold. */
export interface SwipeEvent {
  /** The bound row behind the card that left the deck. */
  card: SwipeCard;
  /** Position of the card in the original dataset. */
  index: number;
  /** Direction the card travelled. */
  direction: SwipeDirection;
}

/**
 * Props for SwipeDeck.
 * common -> dataset -> swipedeck
 */
export interface SwipeDeckProps extends DatasetWidgetProps {
  /**
   * Row field shown as the card title.
   * @default 'title'
   */
  titleField?: string;
  /**
   * Row field shown under the title.
   * @default 'subtitle'
   */
  subtitleField?: string;
  /**
   * Row field holding the card image URL.
   * @default 'image'
   */
  imageField?: string;
  /**
   * Height in pixels of the image band at the top of each card.
   * @default 180
   */
  imageHeight?: number;
  /**
   * Card width in pixels.
   * @default 300
   */
  cardWidth?: number;
  /**
   * Card height in pixels.
   * @default 380
   */
  cardHeight?: number;
  /**
   * Pixels each card behind the top one is offset by, producing the stack.
   * @default 12
   */
  stackOffset?: number;
  /**
   * How many cards are drawn behind the top card.
   * @default 2
   */
  stackDepth?: number;
  /**
   * Horizontal drag distance in pixels that commits a swipe. Below it the card
   * springs back.
   * @default 120
   */
  swipeThreshold?: number;
  /**
   * Card background color.
   * @default '#FFFFFF'
   */
  cardColor?: string;
  /**
   * Whether dragging is accepted. Set `false` to freeze the deck.
   * @default true
   */
  enabled?: boolean;
  /**
   * Called when a card is swiped right (the accept gesture).
   */
  onSwipeRight?: (event: SwipeEvent) => void;
  /**
   * Called when a card is swiped left (the reject gesture).
   */
  onSwipeLeft?: (event: SwipeEvent) => void;
  /**
   * Called once after the last card leaves the deck.
   */
  onDeckEmpty?: () => void;
}
