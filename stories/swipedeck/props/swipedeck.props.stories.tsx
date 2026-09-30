import type { StoryObj } from '@storybook/react';
import meta from '../meta';
import { PROFILE_CARDS } from '../../sample-data';

/** The props that visibly change the deck, one per story. */
export default { ...meta, title: 'UI Widgets/Swipe Deck/Props' };
type Story = StoryObj<typeof meta>;

/** `cardWidth` / `cardHeight` — a compact card. */
export const CardSize: Story = {
  args: { dataset: PROFILE_CARDS, cardWidth: 240, cardHeight: 300, imageHeight: 150 },
  parameters: { source: '<SwipeDeck dataset={profiles} cardWidth={240} cardHeight={300} imageHeight={150} />' },
};

/** `imageHeight` — the photo fills most of the card. */
export const ImageHeight: Story = {
  args: { dataset: PROFILE_CARDS, imageHeight: 300 },
  parameters: { source: '<SwipeDeck dataset={profiles} imageHeight={300} />' },
};

/** `stackOffset` — the cards behind fan out further. */
export const StackOffset: Story = {
  args: { dataset: PROFILE_CARDS, stackOffset: 28 },
  parameters: { source: '<SwipeDeck dataset={profiles} stackOffset={28} />' },
};

/** `stackDepth` — four cards visible behind the top one. */
export const StackDepth: Story = {
  args: { dataset: PROFILE_CARDS, stackDepth: 4 },
  parameters: { source: '<SwipeDeck dataset={profiles} stackDepth={4} />' },
};

/** `cardColor` — a tinted card body. */
export const CardColor: Story = {
  args: { dataset: PROFILE_CARDS, cardColor: '#FEF3C7' },
  parameters: { source: '<SwipeDeck dataset={profiles} cardColor="#FEF3C7" />' },
};
