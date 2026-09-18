import type { DatasetWidgetProps } from '../widget-props/common';
import type { WidgetRow } from '../utils/dataset';

/** Presence state drawn as a colored dot on each avatar. */
export type AvatarStatus = 'online' | 'away' | 'offline';

/** Shape a row is read as. Every field is optional — unknown rows degrade to initials. */
export interface AvatarMember extends WidgetRow {
  /** Stable identity; falls back to the row index for the React key. */
  id?: string | number;
  /** Display name. Its first letter is the initials fallback when no image loads. */
  name?: string;
  /** Avatar image URL. When absent, initials are drawn instead. */
  imageUrl?: string;
  /** Presence state; anything unrecognized is treated as `offline`. */
  status?: AvatarStatus | string;
}

/** Emitted when an avatar is tapped. */
export interface AvatarSelectEvent {
  /** The bound row behind the tapped avatar. */
  member: AvatarMember;
  /** Position of the avatar within the visible (non-overflow) run. */
  index: number;
}

/**
 * Props for AvatarStack.
 * common -> dataset -> avatarstack
 */
export interface AvatarStackProps extends DatasetWidgetProps {
  /**
   * How many avatars render before the remainder collapses into a `+N` bubble.
   * The overflow count is derived from the data, never set directly.
   * @default 4
   */
  maxVisible?: number;
  /**
   * Avatar diameter in pixels. The status dot scales with it.
   * @default 44
   */
  avatarSize?: number;
  /**
   * Pixels each avatar overlaps the one before it.
   * @default 14
   */
  overlap?: number;
  /**
   * Ring drawn around each avatar so overlapping edges stay separated.
   * @default '#FFFFFF'
   */
  borderColor?: string;
  /**
   * Row field holding the display name.
   * @default 'name'
   */
  nameField?: string;
  /**
   * Row field holding the avatar image URL.
   * @default 'imageUrl'
   */
  imageField?: string;
  /**
   * Row field holding the presence state.
   * @default 'status'
   */
  statusField?: string;
  /**
   * Whether to draw the presence dot on each avatar.
   * @default true
   */
  showStatus?: boolean;
  /**
   * Called when the user taps an avatar. The overflow bubble is not tappable.
   */
  onMemberSelect?: (event: AvatarSelectEvent) => void;
}
