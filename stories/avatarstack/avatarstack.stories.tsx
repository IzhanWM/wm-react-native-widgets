import type { StoryObj } from '@storybook/react';
import meta from './meta';
import { TEAM_MEMBERS, TEAM_MEMBERS_NO_IMAGES } from '../sample-data';

export default { ...meta, title: 'UI Widgets/Avatar Stack', tags: ['autodocs'] };
type Story = StoryObj<typeof meta>;

/** Default stack: four avatars, then a +N bubble for the rest. */
export const Default: Story = {
  args: {
    dataset: TEAM_MEMBERS,
  },
  parameters: {
    source: '<AvatarStack dataset={members} />',
  },
};

/** Rows without an image fall back to the first letter of the name. */
export const InitialsFallback: Story = {
  args: {
    dataset: TEAM_MEMBERS_NO_IMAGES,
  },
  parameters: {
    note: 'No imageUrl on any row, so every avatar renders its initial.',
  },
};

/** A dataset that fits entirely shows no overflow bubble. */
export const NoOverflow: Story = {
  args: {
    dataset: TEAM_MEMBERS.slice(0, 3),
    maxVisible: 4,
  },
};

/** An unresolved or empty dataset renders nothing rather than erroring. */
export const EmptyDataset: Story = {
  args: {
    dataset: [],
  },
  parameters: {
    note: 'An empty dataset renders an empty row — the widget never throws on unbound data.',
  },
};

/** A JSON string is parsed, matching how Studio may bind a static dataset. */
export const JsonStringDataset: Story = {
  args: {
    dataset: JSON.stringify(TEAM_MEMBERS.slice(0, 5)),
  },
  parameters: {
    note: 'dataset is a JSON string here; toRows parses it before rendering.',
  },
};
