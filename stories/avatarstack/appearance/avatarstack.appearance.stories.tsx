import type { StoryObj } from '@storybook/react';
import meta from '../meta';
import { TEAM_MEMBERS } from '../../sample-data';

export default { ...meta, title: 'UI Widgets/Avatar Stack/Appearance' };
type Story = StoryObj<typeof meta>;

/** Compact avatars for dense toolbars. */
export const Compact: Story = {
  args: { dataset: TEAM_MEMBERS, avatarSize: 28, overlap: 10 },
};

/** Large avatars for a profile header. */
export const Large: Story = {
  args: { dataset: TEAM_MEMBERS, avatarSize: 72, overlap: 24 },
};

/** No overlap lays the avatars out as a plain row. */
export const NoOverlap: Story = {
  args: { dataset: TEAM_MEMBERS, overlap: 0 },
};

/** A tinted ring separates avatars on a colored surface. */
export const TintedBorder: Story = {
  args: { dataset: TEAM_MEMBERS, borderColor: '#1E293B' },
};

/** Presence dots hidden. */
export const WithoutStatus: Story = {
  args: { dataset: TEAM_MEMBERS, showStatus: false },
};
