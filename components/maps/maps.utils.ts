import { useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { toRows } from '../utils/dataset';
import type { MapCoordinate, MapMarkerRow, MapsProps } from './maps.props';

// Shared by the native and web maps, so a page reads its datasets, camera and
// size the same way on every platform.

export const DEFAULT_LATITUDE = 12.9716;
export const DEFAULT_LONGITUDE = 77.5946;
export const DEFAULT_ZOOM = 12;
export const SINGLE_POINT_ZOOM = 16;
export const MAX_ZOOM = 20;
export const FIT_PADDING = 48;

export type MarkerPoint = {
  key: string;
  row: MapMarkerRow;
  coordinate: MapCoordinate;
  title?: string;
  description?: string;
  tint: string;
  iconUrl?: string;
  radius: number;
  draggable: boolean;
};

// Number(null) and Number('') are 0, which would pin a row with a missing
// coordinate at 0,0 instead of dropping it.
export const toNumber = (value: unknown, fallback = NaN): number => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const toText = (value: unknown): string | undefined =>
  value === undefined || value === null || value === '' ? undefined : String(value);

export const toBoolean = (value: unknown, fallback: boolean): boolean =>
  value === undefined || value === null ? fallback : value === true || value === 'true';

export const clampZoom = (zoom: number) => Math.min(Math.max(zoom, 0), MAX_ZOOM);

type MarkerOptions = Pick<
  MapsProps,
  | 'markers'
  | 'latitudeField'
  | 'longitudeField'
  | 'titleField'
  | 'descriptionField'
  | 'markerColor'
  | 'markerIcon'
  | 'markerRadius'
  | 'draggable'
>;

export const useMarkerPoints = ({
  markers,
  latitudeField = 'latitude',
  longitudeField = 'longitude',
  titleField = 'title',
  descriptionField = 'description',
  markerColor = '#EF4444',
  markerIcon,
  markerRadius = 0,
  draggable = false,
}: MarkerOptions): MarkerPoint[] =>
  useMemo(
    () =>
      toRows(markers)
        .map((row, index) => {
          const lat = toNumber(row?.[latitudeField]);
          const lng = toNumber(row?.[longitudeField]);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return {
            // Index keeps keys unique even when rows share an id.
            key: `marker-${index}`,
            row,
            coordinate: { latitude: lat, longitude: lng },
            title: toText(row?.[titleField]),
            description: toText(row?.[descriptionField]),
            tint: row?.color || markerColor,
            iconUrl: toText(row?.imageUrl) || toText(markerIcon),
            radius: toNumber(row?.radius, toNumber(markerRadius, 0)),
            // Studio can bind the widget prop as the string 'false', which is truthy.
            draggable: toBoolean(row?.draggable, toBoolean(draggable, false)),
          } as MarkerPoint;
        })
        .filter(Boolean) as MarkerPoint[],
    [
      markers,
      latitudeField,
      longitudeField,
      titleField,
      descriptionField,
      markerColor,
      markerIcon,
      markerRadius,
      draggable,
    ]
  );

export const useRouteCoordinates = (
  routePath: MapsProps['routePath'],
  latitudeField = 'latitude',
  longitudeField = 'longitude'
): MapCoordinate[] =>
  useMemo(
    () =>
      toRows(routePath)
        .map((row) => ({
          latitude: toNumber(row?.[latitudeField]),
          longitude: toNumber(row?.[longitudeField]),
        }))
        .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude)),
    [routePath, latitudeField, longitudeField]
  );

/** The camera the props ask for, and a signature that changes only when they do. */
export const useCameraTarget = (latitude: unknown, longitude: unknown, zoom: unknown) => {
  const camera = useMemo(
    () => ({
      center: {
        latitude: toNumber(latitude, DEFAULT_LATITUDE),
        longitude: toNumber(longitude, DEFAULT_LONGITUDE),
      },
      zoom: clampZoom(toNumber(zoom, DEFAULT_ZOOM)),
    }),
    [latitude, longitude, zoom]
  );
  const cameraSignature = `${camera.center.latitude},${camera.center.longitude},${camera.zoom}`;
  return { camera, cameraSignature };
};

// Keyed on the coordinates rather than the row arrays, so a page that rebuilds
// its dataset on every render does not keep snapping the camera back.
export const useFitPoints = (markerPoints: MarkerPoint[], routeCoordinates: MapCoordinate[]) => {
  const fitPoints = useMemo(
    () => [...markerPoints.map((point) => point.coordinate), ...routeCoordinates],
    [markerPoints, routeCoordinates]
  );
  const fitSignature = fitPoints.map((p) => `${p.latitude},${p.longitude}`).join('|');
  return { fitPoints, fitSignature };
};

// A single pin, or several stacked on one spot, has no span to fit and would
// otherwise zoom all the way in.
export const isSinglePoint = (points: MapCoordinate[]): boolean =>
  points.every(
    (p) => p.latitude === points[0].latitude && p.longitude === points[0].longitude
  );

// A map has no content height of its own: the height prop wins, then the Studio
// style panel's height, and otherwise it fills the space the page gives it.
const toHeightStyle = (height?: number | string): ViewStyle | undefined => {
  const value = typeof height === 'string' ? height.trim() : height;
  if (value === undefined || value === null || value === '') return undefined;
  if (value === 'fill') return sizing.fill;
  if (typeof value === 'string' && value.endsWith('%')) return { height: value as any };
  const dp = toNumber(value);
  return Number.isFinite(dp) ? { height: dp } : undefined;
};

export const useHeightStyle = (height: MapsProps['height'], style: MapsProps['style']) =>
  useMemo(() => {
    const explicit = toHeightStyle(height);
    if (explicit) return explicit;
    const themed = StyleSheet.flatten(style) as ViewStyle | undefined;
    const sized = themed?.height !== undefined || themed?.flex !== undefined;
    return sized ? undefined : sizing.fill;
  }, [height, style]);

const sizing = StyleSheet.create({
  // minHeight is the floor for a page that scrolls, where flex has nothing to fill.
  fill: { flex: 1, minHeight: 240 },
});
