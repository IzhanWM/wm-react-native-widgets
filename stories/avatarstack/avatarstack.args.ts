/**
 * ArgTypes for AvatarStack (common + dataset + avatarstack).
 * common -> dataset -> avatarstack
 */
import { datasetWidgetArgTypes } from '../args/widget-common';

const avatarStackOnlyArgTypes = {
  maxVisible: {
    control: { type: 'range', min: 1, max: 8, step: 1 },
    description: 'Avatars shown before the +N overflow bubble. Default: 4',
  },
  avatarSize: {
    control: { type: 'range', min: 24, max: 96, step: 2 },
    description: 'Avatar diameter in pixels. Default: 44',
  },
  overlap: {
    control: { type: 'range', min: 0, max: 40, step: 2 },
    description: 'Pixels each avatar overlaps the previous one. Default: 14',
  },
  borderColor: {
    control: 'color',
    description: 'Ring drawn around each avatar. Default: #FFFFFF',
  },
  nameField: {
    control: 'text',
    description: 'Row field holding the display name. Default: name',
  },
  imageField: {
    control: 'text',
    description: 'Row field holding the avatar image URL. Default: imageUrl',
  },
  statusField: {
    control: 'text',
    description: 'Row field holding the presence state. Default: status',
  },
  showStatus: {
    control: 'boolean',
    description: 'Whether to draw the presence dot. Default: true',
  },
  onMemberSelect: {
    control: false,
    description: 'Called when the user taps an avatar.',
  },
} as const;

export const avatarStackArgTypes = {
  ...datasetWidgetArgTypes,
  ...avatarStackOnlyArgTypes,
} as const;
