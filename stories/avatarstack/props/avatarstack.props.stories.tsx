import type { StoryObj } from '@storybook/react';
import meta from '../meta';
import { TEAM_MEMBERS } from '../../sample-data';

/** The props that visibly change the stack, one per story. */
export default { ...meta, title: 'UI Widgets/Avatar Stack/Props' };
type Story = StoryObj<typeof meta>;

/** `maxVisible` — two faces, then the rest collapse into a +6 bubble. */
export const MaxVisible: Story = {
  args: { dataset: TEAM_MEMBERS, maxVisible: 2 },
  parameters: { source: '<AvatarStack dataset={members} maxVisible={2} />' },
};

/** `avatarSize` — larger avatars; the status dot grows with them. */
export const AvatarSize: Story = {
  args: { dataset: TEAM_MEMBERS, avatarSize: 72 },
  parameters: { source: '<AvatarStack dataset={members} avatarSize={72} />' },
};

/** `overlap` — avatars tucked further behind each other. */
export const Overlap: Story = {
  args: { dataset: TEAM_MEMBERS, overlap: 28 },
  parameters: { source: '<AvatarStack dataset={members} overlap={28} />' },
};

/** `borderColor` — a colored ring around each avatar. */
export const BorderColor: Story = {
  args: { dataset: TEAM_MEMBERS, borderColor: '#2563EB' },
  parameters: { source: '<AvatarStack dataset={members} borderColor="#2563EB" />' },
};

/** `showStatus` — presence dots turned off. */
export const StatusHidden: Story = {
  args: { dataset: TEAM_MEMBERS, showStatus: false },
  parameters: { source: '<AvatarStack dataset={members} showStatus={false} />' },
};
