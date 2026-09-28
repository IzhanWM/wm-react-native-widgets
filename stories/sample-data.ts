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

/** Outlets around central Bengaluru for Maps. The last row overrides color and radius. */
export const OUTLETS = [
  { id: 1, title: 'MG Road', description: '12 MG Road, Ashok Nagar', latitude: 12.9756, longitude: 77.6066 },
  { id: 2, title: 'Indiranagar', description: '100 Feet Road, HAL 2nd Stage', latitude: 12.9719, longitude: 77.6412 },
  { id: 3, title: 'Koramangala', description: '80 Feet Road, 4th Block', latitude: 12.9352, longitude: 77.6245 },
  { id: 4, title: 'Jayanagar', description: '11th Main, 4th Block', latitude: 12.925, longitude: 77.5938 },
  { id: 5, title: 'Malleshwaram', description: 'Sampige Road, 8th Cross', latitude: 13.0035, longitude: 77.5709, color: '#0E7C86', radius: 900 },
];

/** Delivery route through the outlets, in order. */
export const DELIVERY_ROUTE = [
  { latitude: 13.0035, longitude: 77.5709 },
  { latitude: 12.9756, longitude: 77.6066 },
  { latitude: 12.9719, longitude: 77.6412 },
  { latitude: 12.9352, longitude: 77.6245 },
  { latitude: 12.925, longitude: 77.5938 },
];

/** Muted Google Maps style JSON for Maps' customMapStyle. */
export const MUTED_MAP_STYLE = JSON.stringify([
  { elementType: 'geometry', stylers: [{ color: '#F1F3F4' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5F6368' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#C9DDE3' }] },
]);

/**
 * Outlets as a Studio live variable hands them over: wrapped in `dataSet`, with
 * the page's own column names, and two rows whose coordinates did not resolve.
 */
export const STUDIO_OUTLETS = {
  dataSet: [
    ...OUTLETS.map(({ title, description, latitude, longitude }) => ({
      name: title,
      address: description,
      lat: String(latitude),
      lng: String(longitude),
    })),
    { name: 'Pending survey', address: 'No coordinates yet', lat: null, lng: '' },
    { name: 'Bad import', address: 'Garbled row', lat: 'n/a', lng: 'n/a' },
  ],
};
