/**
 * Fixtures shared across the UI widget stories, so every story shows the same
 * data shapes a Studio page would bind.
 */

/** Members for AvatarStack. Images come from a deterministic avatar service. */
export const TEAM_MEMBERS = [
  { id: 1, name: 'Ava Johnson', imageUrl: 'https://i.pravatar.cc/150?img=1', status: 'online' },
  { id: 2, name: 'Liam Smith', imageUrl: 'https://i.pravatar.cc/150?img=2', status: 'online' },
  { id: 3, name: 'Sophia Brown', imageUrl: 'https://i.pravatar.cc/150?img=3', status: 'away' },
  { id: 4, name: 'Noah Williams', imageUrl: 'https://i.pravatar.cc/150?img=4', status: 'offline' },
  { id: 5, name: 'Emma Davis', imageUrl: 'https://i.pravatar.cc/150?img=5', status: 'online' },
  { id: 6, name: 'Oliver Wilson', imageUrl: 'https://i.pravatar.cc/150?img=6', status: 'away' },
  { id: 7, name: 'Mia Taylor', imageUrl: 'https://i.pravatar.cc/150?img=7', status: 'online' },
  { id: 8, name: 'James Anderson', imageUrl: 'https://i.pravatar.cc/150?img=8', status: 'offline' },
];

/** Members with no images, so the initials fallback is visible. */
export const TEAM_MEMBERS_NO_IMAGES = TEAM_MEMBERS.map(({ imageUrl, ...rest }) => rest);

/** Storage breakdown for SegmentProgress. */
export const STORAGE_SEGMENTS = [
  { id: 'docs', label: 'Documents', value: 34, color: '#2563EB' },
  { id: 'media', label: 'Media', value: 22, color: '#10B981' },
  { id: 'backups', label: 'Backups', value: 16, color: '#F59E0B' },
  { id: 'other', label: 'Other', value: 8, color: '#8B5CF6' },
];

/** Segments with no colors, so the built-in palette is visible. */
export const UNCOLORED_SEGMENTS = STORAGE_SEGMENTS.map(({ color, ...rest }) => rest);

/** Blobs for SkiaEffect. */
export const GLOW_BLOBS = [
  { id: 1, color: '#F43F5E', radius: 0.34 },
  { id: 2, color: '#3B82F6', radius: 0.34 },
  { id: 3, color: '#22D3EE', radius: 0.34 },
];

/** A warmer blob set. */
export const SUNSET_BLOBS = [
  { id: 1, color: '#FB7185', radius: 0.38 },
  { id: 2, color: '#FBBF24', radius: 0.32 },
  { id: 3, color: '#F97316', radius: 0.3 },
  { id: 4, color: '#A855F7', radius: 0.26 },
];
