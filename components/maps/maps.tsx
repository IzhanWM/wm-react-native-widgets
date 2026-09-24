import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, View, ViewStyle } from 'react-native';
import MapView, {
  Circle,
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
  type Details,
  type LatLng,
  type MapPressEvent,
  type Region,
  type UserLocationChangeEvent,
} from 'react-native-maps';
import { toRows } from '../utils/dataset';
import type { MapMarkerRow, MapsProps } from './maps.props';

export type {
  MapsProps,
  MapType,
  MapProvider,
  MapCoordinate,
  MapMarkerRow,
  MapRegionEvent,
  MapUserLocation,
  MapMarkerDragEvent,
} from './maps.props';

const DEFAULT_LATITUDE = 12.9716;
const DEFAULT_LONGITUDE = 77.5946;
const FIT_PADDING = 48;
const ANIMATION_DURATION = 500;
const DEFAULT_ZOOM = 12;
const SINGLE_POINT_ZOOM = 16;
const MAX_ZOOM = 20;
// Web Mercator tile size. The world is TILE_SIZE * 2^zoom points across, which is
// what converts between a zoom level and the region span Apple Maps works in.
const TILE_SIZE = 256;
// Stands in for the view size before the first layout pass reports it.
const FALLBACK_SIZE = { width: 360, height: 240 };

// expo-location is an optional peer, so a host app that never shows the user
// location does not have to install it.
let Location: typeof import('expo-location') | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Location = require('expo-location');
} catch {
  Location = undefined;
}

// Google Maps on iOS needs the Google SDK linked, which the react-native-maps
// config plugin only does when it gets `iosGoogleMapsApiKey`. react-native-maps
// renders the Google view without checking, so the widget reads the same plugin
// entry from the app config that expo-constants embeds, and stays on Apple Maps
// without it.
const hasIosGoogleMaps = (): boolean => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants').default;
    const plugins: unknown[] = Constants?.expoConfig?.plugins ?? [];
    return plugins.some(
      (plugin) =>
        Array.isArray(plugin) &&
        plugin[0] === 'react-native-maps' &&
        !!(plugin[1] as { iosGoogleMapsApiKey?: string } | undefined)?.iosGoogleMapsApiKey
    );
  } catch {
    return false;
  }
};

const GOOGLE_AVAILABLE = Platform.OS === 'android' || (Platform.OS === 'ios' && hasIosGoogleMaps());

type MarkerPoint = {
  key: string;
  row: MapMarkerRow;
  coordinate: LatLng;
  title?: string;
  description?: string;
  tint: string;
  iconUrl?: string;
  radius: number;
  draggable: boolean;
};

type Size = { width: number; height: number };

// Number(null) and Number('') are 0, which would pin a row with a missing
// coordinate at 0,0 instead of dropping it.
const toNumber = (value: unknown, fallback = NaN): number => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toText = (value: unknown): string | undefined =>
  value === undefined || value === null || value === '' ? undefined : String(value);

const toBoolean = (value: unknown, fallback: boolean): boolean =>
  value === undefined || value === null ? fallback : value === true || value === 'true';

// Pins are colored with a hex from the Studio color picker, so a radius circle can
// reuse that color at low alpha instead of asking for a fill color of its own.
const withAlpha = (color: string, alpha: number): string => {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(color).trim());
  if (!match) return `rgba(37,99,235,${alpha})`;
  const hex =
    match[1].length === 3
      ? match[1]
          .split('')
          .map((part) => part + part)
          .join('')
      : match[1];
  const value = parseInt(hex, 16);
  // eslint-disable-next-line no-bitwise
  return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`;
};

// A map has no content height of its own: the height prop wins, then the Studio
// style panel's height, and otherwise it fills the space the page gives it.
const toHeightStyle = (height?: number | string): ViewStyle | undefined => {
  const value = typeof height === 'string' ? height.trim() : height;
  if (value === undefined || value === null || value === '') return undefined;
  if (value === 'fill') return styles.fill;
  if (typeof value === 'string' && value.endsWith('%')) return { height: value as any };
  const dp = toNumber(value);
  return Number.isFinite(dp) ? { height: dp } : undefined;
};

const clampZoom = (zoom: number) => Math.min(Math.max(zoom, 0), MAX_ZOOM);

// Camera zoom is Google Maps only in react-native-maps, so Apple Maps is driven by
// the region span a zoom level shows across a view of this size.
const regionForZoom = (center: LatLng, zoom: number, size: Size): Region => {
  const longitudeDelta = Math.min((360 * size.width) / (TILE_SIZE * 2 ** zoom), 360);
  const latitudeScale = Math.cos((center.latitude * Math.PI) / 180) || 1;
  const latitudeDelta = Math.min(longitudeDelta * (size.height / size.width) * latitudeScale, 180);
  return { ...center, latitudeDelta, longitudeDelta };
};

const zoomForRegion = (region: Region, width: number): number =>
  clampZoom(Math.log2((360 * width) / (TILE_SIZE * Math.max(region.longitudeDelta, 1e-9))));

// The Android map tears itself down if the location layer comes up without
// permission, so it is requested first and the layer stays off unless granted.
// Without expo-location the flag goes straight to the map.
const useLocationPermission = (enabled: boolean): boolean => {
  const [granted, setGranted] = useState(!Location);

  useEffect(() => {
    if (!enabled || !Location) return undefined;
    let active = true;
    Location.requestForegroundPermissionsAsync()
      .then((result) => {
        if (active) setGranted(result?.status === 'granted');
      })
      .catch(() => {
        if (active) setGranted(false);
      });
    return () => {
      active = false;
    };
  }, [enabled]);

  return enabled && granted;
};

const GOOGLE_MAP_TYPES: Record<string, 'standard' | 'satellite' | 'hybrid' | 'terrain'> = {
  standard: 'standard',
  normal: 'standard',
  satellite: 'satellite',
  hybrid: 'hybrid',
  terrain: 'terrain',
};

// Apple Maps has no terrain style, so it falls back to the standard street map.
const APPLE_MAP_TYPES: Record<string, 'standard' | 'satellite' | 'hybrid'> = {
  standard: 'standard',
  normal: 'standard',
  satellite: 'satellite',
  hybrid: 'hybrid',
  terrain: 'standard',
};

/**
 * Native map on `react-native-maps`: Google Maps on Android, and on iOS when the
 * app is built with an iOS Google Maps key; Apple Maps otherwise or with
 * `provider="default"`. `maps.web.tsx` stands in on web.
 */
const MapsComponent = ({
  provider = 'google',
  mapType = 'standard',
  customMapStyle,
  latitude = DEFAULT_LATITUDE,
  longitude = DEFAULT_LONGITUDE,
  zoom = DEFAULT_ZOOM,
  markers,
  latitudeField = 'latitude',
  longitudeField = 'longitude',
  titleField = 'title',
  descriptionField = 'description',
  markerColor = '#EF4444',
  markerIcon,
  markerRadius = 0,
  draggable = false,
  routePath,
  routeColor = '#2563EB',
  showsUserLocation = false,
  fitToData = false,
  interactive = true,
  height,
  onMapReady,
  onRegionChange,
  onMapPress,
  onLongPress,
  onMarkerPress,
  onCalloutPress,
  onUserLocationChange,
  onMarkerDragEnd,
  style,
}: MapsProps) => {
  const mapRef = useRef<MapView | null>(null);
  const [ready, setReady] = useState(false);
  const [layout, setLayout] = useState<Size | null>(null);
  // A zero-sized layout has no span to convert zoom against, so it counts as unmeasured.
  const size = layout && layout.width > 0 && layout.height > 0 ? layout : null;
  const isGoogle = Platform.OS === 'android' || (provider === 'google' && GOOGLE_AVAILABLE);

  const markerPoints = useMemo<MarkerPoint[]>(
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

  const routeCoordinates = useMemo<LatLng[]>(
    () =>
      toRows(routePath)
        .map((row) => ({
          latitude: toNumber(row?.[latitudeField]),
          longitude: toNumber(row?.[longitudeField]),
        }))
        .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude)),
    [routePath, latitudeField, longitudeField]
  );

  const userLocationEnabled = useLocationPermission(showsUserLocation);

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
  // Seeded with the mount value: the initial camera already placed the map there,
  // so only later changes to the props should move it.
  const appliedCameraRef = useRef(cameraSignature);
  // The map reports its starting viewport once on load; that is not a user move.
  const initialCenterRef = useRef<LatLng | null>(camera.center);

  const mapStyle = useMemo(() => {
    if (!customMapStyle || !isGoogle) return undefined;
    try {
      const parsed =
        typeof customMapStyle === 'string' ? JSON.parse(customMapStyle) : customMapStyle;
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }, [customMapStyle, isGoogle]);

  const moveCamera = useCallback(
    (center: LatLng, nextZoom: number) => {
      const map = mapRef.current;
      if (!map) return;
      if (isGoogle) {
        map.animateCamera({ center, zoom: nextZoom }, { duration: ANIMATION_DURATION });
      } else {
        map.animateToRegion(regionForZoom(center, nextZoom, size ?? FALLBACK_SIZE), ANIMATION_DURATION);
      }
    },
    [isGoogle, size]
  );

  // Keyed on the coordinates rather than the row arrays, so a page that rebuilds
  // its dataset on every render does not keep snapping the camera back.
  const fitPoints = useMemo(
    () => [...markerPoints.map((point) => point.coordinate), ...routeCoordinates],
    [markerPoints, routeCoordinates]
  );
  const fitSignature = fitPoints.map((p) => `${p.latitude},${p.longitude}`).join('|');

  useEffect(() => {
    if (!ready || !fitToData || !fitPoints.length) return;
    const first = fitPoints[0];
    const samePoint = fitPoints.every(
      (p) => p.latitude === first.latitude && p.longitude === first.longitude
    );
    // A single pin, or several stacked on one spot, has no span to fit and
    // would otherwise zoom all the way in.
    if (samePoint) {
      moveCamera(first, SINGLE_POINT_ZOOM);
      return;
    }
    mapRef.current?.fitToCoordinates(fitPoints, {
      edgePadding: { top: FIT_PADDING, right: FIT_PADDING, bottom: FIT_PADDING, left: FIT_PADDING },
      animated: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, fitToData, fitSignature, size, moveCamera]);

  useEffect(() => {
    if (!ready || fitToData) return;
    if (appliedCameraRef.current === cameraSignature) return;
    appliedCameraRef.current = cameraSignature;
    moveCamera(camera.center, camera.zoom);
  }, [ready, fitToData, cameraSignature, camera, moveCamera]);

  const handleReady = useCallback(() => {
    setReady(true);
    onMapReady?.();
  }, [onMapReady]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height: laidOut } = event.nativeEvent.layout;
    setLayout((current) =>
      current && current.width === width && current.height === laidOut
        ? current
        : { width, height: laidOut }
    );
  }, []);

  const handleRegionChange = useCallback(
    (region: Region, details?: Details) => {
      const initial = initialCenterRef.current;
      if (initial) {
        initialCenterRef.current = null;
        const replay =
          Math.abs(region.latitude - initial.latitude) < 1e-4 &&
          Math.abs(region.longitude - initial.longitude) < 1e-4;
        if (replay) return;
      }
      if (!onRegionChange) return;
      const width = (size ?? FALLBACK_SIZE).width;
      const emit = (cameraZoom?: number, tilt?: number, bearing?: number) =>
        onRegionChange({
          latitude: region.latitude,
          longitude: region.longitude,
          latitudeDelta: region.latitudeDelta,
          longitudeDelta: region.longitudeDelta,
          zoom: cameraZoom ?? zoomForRegion(region, width),
          tilt,
          bearing,
          isGesture: details?.isGesture,
        });
      const map = mapRef.current;
      if (!map) {
        emit();
        return;
      }
      map
        .getCamera()
        .then((current) => emit(isGoogle ? current.zoom : undefined, current.pitch, current.heading))
        .catch(() => emit());
    },
    [onRegionChange, size, isGoogle]
  );

  const handleMapPress = useCallback(
    (event: MapPressEvent) => {
      // Android also reports a pin tap as a map press; that belongs to onMarkerPress.
      if (event.nativeEvent.action === 'marker-press') return;
      onMapPress?.(event.nativeEvent.coordinate);
    },
    [onMapPress]
  );

  const handleUserLocation = useCallback(
    (event: UserLocationChangeEvent) => {
      const coordinate = event.nativeEvent.coordinate;
      if (!coordinate || !onUserLocationChange) return;
      onUserLocationChange({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        altitude: coordinate.altitude,
        accuracy: coordinate.accuracy,
        heading: coordinate.heading,
        speed: coordinate.speed,
        timestamp: coordinate.timestamp,
      });
    },
    [onUserLocationChange]
  );

  const heightStyle = useMemo(() => {
    const explicit = toHeightStyle(height);
    if (explicit) return explicit;
    const themed = StyleSheet.flatten(style) as ViewStyle | undefined;
    const sized = themed?.height !== undefined || themed?.flex !== undefined;
    return sized ? undefined : styles.fill;
  }, [height, style]);

  const resolvedMapType = isGoogle
    ? (GOOGLE_MAP_TYPES[mapType] ?? 'standard')
    : (APPLE_MAP_TYPES[mapType] ?? 'standard');

  // The first camera depends on the view size on Apple Maps, so that map waits for
  // the first layout pass. It still mounts when that pass reports zero size (a
  // container that grows later), falling back to a typical size for the region.
  const renderMap = () => {
    if (!isGoogle && !layout) return null;
    const initialCamera = isGoogle
      ? { center: camera.center, zoom: camera.zoom, heading: 0, pitch: 0 }
      : undefined;
    const initialRegion = isGoogle
      ? undefined
      : regionForZoom(camera.center, camera.zoom, size ?? FALLBACK_SIZE);

    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={isGoogle ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialCamera={initialCamera}
        initialRegion={initialRegion}
        mapType={resolvedMapType}
        customMapStyle={mapStyle}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        showsUserLocation={userLocationEnabled}
        showsMyLocationButton={userLocationEnabled}
        onMapReady={handleReady}
        onRegionChangeComplete={handleRegionChange}
        onPress={handleMapPress}
        onLongPress={(event) => onLongPress?.(event.nativeEvent.coordinate)}
        onUserLocationChange={handleUserLocation}>
        {markerPoints
          .filter((point) => point.radius > 0)
          .map((point) => (
            <Circle
              key={`radius-${point.key}`}
              center={point.coordinate}
              radius={point.radius}
              fillColor={withAlpha(point.tint, 0.15)}
              strokeColor={point.tint}
              strokeWidth={1.5}
            />
          ))}

        {routeCoordinates.length > 1 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={routeColor}
            strokeWidth={4}
            lineCap="round"
          />
        ) : null}

        {markerPoints.map((point) => (
          <Marker
            key={point.key}
            coordinate={point.coordinate}
            title={point.title}
            description={point.description}
            pinColor={point.tint}
            image={point.iconUrl ? { uri: point.iconUrl } : undefined}
            draggable={point.draggable}
            onPress={() => onMarkerPress?.(point.row)}
            onCalloutPress={() => onCalloutPress?.(point.row)}
            onDragEnd={(event) =>
              onMarkerDragEnd?.({ row: point.row, coordinate: event.nativeEvent.coordinate })
            }
          />
        ))}
      </MapView>
    );
  };

  return (
    <View style={[styles.root, style, heightStyle]} onLayout={handleLayout}>
      {renderMap()}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  // minHeight is the floor for a page that scrolls, where flex has nothing to fill.
  fill: { flex: 1, minHeight: 240 },
  map: { flex: 1 },
});

export const Maps = Object.assign(MapsComponent, {
  displayName: 'Maps',
});
