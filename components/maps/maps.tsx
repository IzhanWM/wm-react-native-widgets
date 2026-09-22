import { Image, type ImageRef } from 'expo-image';
import {
  AppleMaps,
  GoogleMaps,
  requestPermissionsAsync,
  type CameraMoveEvent,
  type Coordinates,
} from 'expo-maps';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { toRows } from '../utils/dataset';
import type { MapMarkerRow, MapsProps } from './maps.props';

export type {
  MapsProps,
  MapType,
  MapCoordinate,
  MapMarkerRow,
  MapRegionEvent,
} from './maps.props';

const FIT_PADDING = 48;
const ANIMATION_DURATION = 500;
const DEFAULT_ZOOM = 12;
const SINGLE_POINT_ZOOM = 16;
const MAX_ZOOM = 20;
// Web Mercator tile size. The world is TILE_SIZE * 2^zoom points across, which is
// what lets a bounding box be turned back into a zoom level.
const TILE_SIZE = 256;
const MERCATOR_LIMIT = 85.05112878;

type MarkerPoint = {
  id: string;
  row: MapMarkerRow;
  coordinates: Coordinates;
  title?: string;
  snippet?: string;
  tint: string;
  iconUrl?: string;
  radius: number;
};

type Size = { width: number; height: number };

const toNumber = (value: unknown, fallback = NaN): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toText = (value: unknown): string | undefined =>
  value === undefined || value === null || value === '' ? undefined : String(value);

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

const mercatorY = (latitude: number): number => {
  const clamped = Math.min(Math.max(latitude, -MERCATOR_LIMIT), MERCATOR_LIMIT);
  const sin = Math.sin((clamped * Math.PI) / 180);
  return Math.log((1 + sin) / (1 - sin)) / 2;
};

// expo-maps has no fitToCoordinates, so the bounding box is projected back into a
// camera the same way Google Maps derives zoom from a viewport.
const cameraForPoints = (points: Coordinates[], size: Size) => {
  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;
  points.forEach(({ latitude = 0, longitude = 0 }) => {
    north = Math.max(north, latitude);
    south = Math.min(south, latitude);
    east = Math.max(east, longitude);
    west = Math.min(west, longitude);
  });

  const coordinates = { latitude: (north + south) / 2, longitude: (east + west) / 2 };
  const usableWidth = Math.max(size.width - FIT_PADDING * 2, 1);
  const usableHeight = Math.max(size.height - FIT_PADDING * 2, 1);
  const latFraction = (mercatorY(north) - mercatorY(south)) / (2 * Math.PI);
  const rawLngSpan = east - west;
  const lngFraction = (rawLngSpan < 0 ? rawLngSpan + 360 : rawLngSpan) / 360;

  // A single pin, or several stacked on the same spot, has no span to fit.
  if (latFraction <= 0 && lngFraction <= 0) {
    return { coordinates, zoom: SINGLE_POINT_ZOOM };
  }

  const latZoom = latFraction > 0 ? Math.log2(usableHeight / TILE_SIZE / latFraction) : MAX_ZOOM;
  const lngZoom = lngFraction > 0 ? Math.log2(usableWidth / TILE_SIZE / lngFraction) : MAX_ZOOM;
  const zoom = Math.min(latZoom, lngZoom, MAX_ZOOM);
  return { coordinates, zoom: Number.isFinite(zoom) ? Math.max(zoom, 0) : DEFAULT_ZOOM };
};

// The Android map tears itself down if the location layer comes up without
// permission, so it is requested first and the layer stays off unless granted.
const useLocationPermission = (enabled: boolean): boolean => {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setGranted(false);
      return undefined;
    }
    let active = true;
    requestPermissionsAsync()
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

// expo-maps wants marker icons as loaded image refs, not sources, so icons are
// loaded imperatively here and cached by url instead of via a per-marker hook.
const useMarkerIcons = (urls: string[]): Record<string, ImageRef> => {
  const [icons, setIcons] = useState<Record<string, ImageRef>>({});
  const key = urls.join('|');

  useEffect(() => {
    let active = true;
    const pending = urls.filter((url) => !icons[url]);
    if (!pending.length) return undefined;
    Promise.all(
      pending.map((url) =>
        Image.loadAsync(url)
          .then((ref) => [url, ref] as const)
          .catch(() => null)
      )
    ).then((loaded) => {
      const resolved = loaded.filter(Boolean) as (readonly [string, ImageRef])[];
      if (!active || !resolved.length) return;
      setIcons((current) => {
        const next = { ...current };
        resolved.forEach(([url, ref]) => {
          next[url] = ref;
        });
        return next;
      });
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return icons;
};

/**
 * Native map on `expo-maps` (Google on Android, Apple on iOS); `maps.web.tsx`
 * stands in on web since expo-maps ships no web build.
 */
const MapsComponent = ({
  mapType = 'standard',
  customMapStyle,
  latitude = 12.9716,
  longitude = 77.5946,
  zoom = DEFAULT_ZOOM,
  markers,
  latitudeField = 'latitude',
  longitudeField = 'longitude',
  titleField = 'title',
  descriptionField = 'description',
  markerColor = '#EF4444',
  markerIcon,
  markerRadius = 0,
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
  style,
}: MapsProps) => {
  const mapRef = useRef<any>(null);
  const readyRef = useRef(false);
  const firstMoveRef = useRef(true);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const markerPoints = useMemo<MarkerPoint[]>(
    () =>
      toRows(markers)
        .map((row, index) => {
          const lat = toNumber(row?.[latitudeField]);
          const lng = toNumber(row?.[longitudeField]);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return {
            // Index keeps ids unique even when rows share an id, and the
            // click events hand back an id rather than the row itself.
            id: `marker-${index}`,
            row,
            coordinates: { latitude: lat, longitude: lng },
            title: toText(row?.[titleField]),
            snippet: toText(row?.[descriptionField]),
            tint: row?.color || markerColor,
            iconUrl: toText(row?.imageUrl) || toText(markerIcon),
            radius: toNumber(row?.radius, toNumber(markerRadius, 0)),
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
    ]
  );

  const routeCoordinates = useMemo<Coordinates[]>(
    () =>
      toRows(routePath)
        .map((row) => ({
          latitude: toNumber(row?.[latitudeField]),
          longitude: toNumber(row?.[longitudeField]),
        }))
        .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude)),
    [routePath, latitudeField, longitudeField]
  );

  const iconUrls = useMemo(() => {
    const unique = new Set<string>();
    markerPoints.forEach((point) => {
      if (point.iconUrl) unique.add(point.iconUrl);
    });
    return Array.from(unique);
  }, [markerPoints]);
  const icons = useMarkerIcons(iconUrls);

  // Falls back to false until the permission is granted, so the layer is never
  // switched on ahead of it.
  const userLocationEnabled = useLocationPermission(showsUserLocation);

  const camera = useMemo(
    () => ({
      coordinates: { latitude: toNumber(latitude, 0), longitude: toNumber(longitude, 0) },
      zoom: toNumber(zoom, DEFAULT_ZOOM),
    }),
    [latitude, longitude, zoom]
  );
  const cameraSignature = `${camera.coordinates.latitude},${camera.coordinates.longitude},${camera.zoom}`;
  // Seeded with the mount value: `cameraPosition` already placed the camera there,
  // so only later changes to the props should move it.
  const appliedCameraRef = useRef(cameraSignature);

  const mapStyleJson = useMemo(() => {
    if (!customMapStyle) return undefined;
    const json = typeof customMapStyle === 'string' ? customMapStyle : JSON.stringify(customMapStyle);
    try {
      JSON.parse(json);
      return json;
    } catch {
      return undefined;
    }
  }, [customMapStyle]);

  const moveCamera = useCallback((next: { coordinates: Coordinates; zoom: number }) => {
    const map = mapRef.current;
    if (!map?.setCameraPosition) return;
    // Only the Google view animates; the Apple view ignores a duration.
    map.setCameraPosition(
      Platform.OS === 'android' ? { ...next, duration: ANIMATION_DURATION } : next
    );
  }, []);

  const fitCamera = useCallback(() => {
    if (!fitToData || !size.width || !size.height) return;
    const points = [...markerPoints.map((point) => point.coordinates), ...routeCoordinates];
    if (!points.length) return;
    moveCamera(cameraForPoints(points, size));
  }, [fitToData, size, markerPoints, routeCoordinates, moveCamera]);

  useEffect(() => {
    if (!ready) return;
    fitCamera();
  }, [ready, fitCamera]);

  useEffect(() => {
    if (!ready || fitToData) return;
    if (appliedCameraRef.current === cameraSignature) return;
    appliedCameraRef.current = cameraSignature;
    moveCamera(camera);
  }, [ready, fitToData, cameraSignature, camera, moveCamera]);

  const handleReady = useCallback(() => {
    if (readyRef.current) return;
    readyRef.current = true;
    setReady(true);
    onMapReady?.();
  }, [onMapReady]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height: laidOut } = event.nativeEvent.layout;
    setSize((current) =>
      current.width === width && current.height === laidOut ? current : { width, height: laidOut }
    );
  }, []);

  const handleCameraMove = useCallback(
    (event: CameraMoveEvent) => {
      // iOS has no map-loaded event, so the first camera move stands in for it.
      handleReady();
      if (firstMoveRef.current) {
        // expo-maps replays the starting viewport on mount, which the widget
        // reports as readiness rather than as the user moving the map.
        firstMoveRef.current = false;
        return;
      }
      onRegionChange?.({
        latitude: event.coordinates?.latitude as number,
        longitude: event.coordinates?.longitude as number,
        latitudeDelta: event.latitudeDelta,
        longitudeDelta: event.longitudeDelta,
        zoom: event.zoom,
        tilt: event.tilt,
        bearing: event.bearing,
      });
    },
    [handleReady, onRegionChange]
  );

  const handleMarkerClick = useCallback(
    (event: { id?: string }) => {
      const point = markerPoints.find((candidate) => candidate.id === event?.id);
      if (point) onMarkerPress?.(point.row);
    },
    [markerPoints, onMarkerPress]
  );

  const circles = useMemo(
    () =>
      markerPoints
        .filter((point) => point.radius > 0)
        .map((point) => ({
          id: `radius-${point.id}`,
          center: point.coordinates,
          radius: point.radius,
          color: withAlpha(point.tint, 0.15),
          lineColor: point.tint,
          lineWidth: 1.5,
        })),
    [markerPoints]
  );

  const polylines = useMemo(
    () =>
      routeCoordinates.length > 1
        ? [{ id: 'route', coordinates: routeCoordinates, color: routeColor, width: 4 }]
        : [],
    [routeCoordinates, routeColor]
  );

  const heightStyle = useMemo(() => {
    const explicit = toHeightStyle(height);
    if (explicit) return explicit;
    const themed = StyleSheet.flatten(style) as ViewStyle | undefined;
    const sized = themed?.height !== undefined || themed?.flex !== undefined;
    return sized ? undefined : styles.fill;
  }, [height, style]);

  const renderMap = () => {
    if (Platform.OS === 'android') {
      return (
        <GoogleMaps.View
          ref={mapRef}
          style={styles.map}
          cameraPosition={camera}
          markers={markerPoints.map((point) => ({
            id: point.id,
            coordinates: point.coordinates,
            title: point.title,
            snippet: point.snippet,
            showCallout: true,
            icon: point.iconUrl ? icons[point.iconUrl] : undefined,
          }))}
          polylines={polylines}
          circles={circles}
          properties={{
            isMyLocationEnabled: userLocationEnabled,
            mapType: GOOGLE_MAP_TYPES[mapType] ?? GoogleMaps.MapType.NORMAL,
            mapStyleOptions: mapStyleJson ? { json: mapStyleJson } : undefined,
          }}
          uiSettings={{
            myLocationButtonEnabled: userLocationEnabled,
            scrollGesturesEnabled: interactive,
            zoomGesturesEnabled: interactive,
            rotationGesturesEnabled: interactive,
            tiltGesturesEnabled: interactive,
          }}
          onMapLoaded={handleReady}
          onCameraMove={handleCameraMove}
          onMarkerClick={handleMarkerClick}
          onMapClick={(event) => onMapPress?.(event.coordinates as any)}
          onMapLongClick={(event) => onLongPress?.(event.coordinates as any)}
        />
      );
    }

    if (Platform.OS === 'ios') {
      // An Apple marker cannot carry an image, so rows with a loaded icon are
      // drawn as annotations and the rest stay as tinted markers.
      const withIcon = markerPoints.filter((point) => point.iconUrl && icons[point.iconUrl]);
      const withoutIcon = markerPoints.filter((point) => !point.iconUrl || !icons[point.iconUrl]);
      return (
        <AppleMaps.View
          ref={mapRef}
          style={styles.map}
          cameraPosition={camera}
          markers={withoutIcon.map((point) => ({
            id: point.id,
            coordinates: point.coordinates,
            title: point.title,
            tintColor: point.tint,
          }))}
          annotations={withIcon.map((point) => ({
            id: point.id,
            coordinates: point.coordinates,
            title: point.title,
            backgroundColor: point.tint,
            icon: icons[point.iconUrl as string],
          }))}
          polylines={polylines}
          circles={circles}
          properties={{
            isMyLocationEnabled: userLocationEnabled,
            mapType: APPLE_MAP_TYPES[mapType] ?? AppleMaps.MapType.STANDARD,
          }}
          uiSettings={{ myLocationButtonEnabled: userLocationEnabled }}
          onCameraMove={handleCameraMove}
          onMarkerClick={handleMarkerClick}
          onMapClick={(event) => onMapPress?.(event.coordinates as any)}
        />
      );
    }

    return null;
  };

  return (
    <View style={[styles.root, style, heightStyle]} onLayout={handleLayout}>
      {renderMap()}
    </View>
  );
};

const GOOGLE_MAP_TYPES: Record<string, GoogleMaps.MapType> = {
  standard: GoogleMaps.MapType.NORMAL,
  normal: GoogleMaps.MapType.NORMAL,
  satellite: GoogleMaps.MapType.SATELLITE,
  hybrid: GoogleMaps.MapType.HYBRID,
  terrain: GoogleMaps.MapType.TERRAIN,
};

// Apple Maps has no terrain style, so it falls back to the standard street map.
const APPLE_MAP_TYPES: Record<string, AppleMaps.MapType> = {
  standard: AppleMaps.MapType.STANDARD,
  normal: AppleMaps.MapType.STANDARD,
  satellite: AppleMaps.MapType.IMAGERY,
  hybrid: AppleMaps.MapType.HYBRID,
  terrain: AppleMaps.MapType.STANDARD,
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
