import type { StoryObj } from '@storybook/react';
import meta from './meta';
import { PROFILE_CARDS } from '../sample-data';

export default { ...meta, title: 'UI Widgets/Swipe Deck', tags: ['autodocs'] };
type Story = StoryObj<typeof meta>;

/** Drag the top card sideways to swipe it. Needs a `GestureHandlerRootView` above it. */
export const Default: Story = {
  args: {
    dataset: PROFILE_CARDS,
  },
  parameters: {
    note: 'Drag the top card sideways.',
    source: '<GestureHandlerRootView>\n  <SwipeDeck dataset={profiles} />\n</GestureHandlerRootView>',
  },
};

/** A Studio variable: `{ dataSet }` wrapper with custom column names. */
export const StudioBinding: Story = {
  args: {
    dataset: {
      dataSet: PROFILE_CARDS.map(({ id, title, subtitle, image }) => ({ id, name: title, role: subtitle, photo: image })),
    },
    titleField: 'name',
    subtitleField: 'role',
    imageField: 'photo',
  },
  parameters: {
    source: '<SwipeDeck dataset={Variables.people} titleField="name" subtitleField="role" imageField="photo" />',
  },
};

/** Rows without an image draw text-only cards. */
export const TextOnly: Story = {
  args: {
    dataset: PROFILE_CARDS.map(({ image, ...row }) => row),
    cardHeight: 200,
  },
};

/** No rows: an empty box of the card size. */
export const EmptyDataset: Story = {
  args: {
    dataset: [],
  },
};
