import type { StoryObj } from '@storybook/react';
import meta from '../meta';
import { TEAM_MEMBERS } from '../../sample-data';

export default { ...meta, title: 'UI Widgets/Avatar Stack/Overflow' };
type Story = StoryObj<typeof meta>;

/** Two visible avatars; the remaining five collapse into +5. */
export const TwoVisible: Story = {
  args: { dataset: TEAM_MEMBERS, maxVisible: 2 },
};

/** Six visible avatars leaves a +1 bubble. */
export const SixVisible: Story = {
  args: { dataset: TEAM_MEMBERS, maxVisible: 6 },
};

/** maxVisible above the row count shows every avatar and no bubble. */
export const ShowAll: Story = {
  args: { dataset: TEAM_MEMBERS, maxVisible: 20 },
  parameters: {
    note: 'The overflow count is derived from the data, so it disappears once everything fits.',
  },
};
