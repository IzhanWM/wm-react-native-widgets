import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import type { MapsProps } from './maps.props';

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

// Same sizing rules as the native file, so a page that reserves space for the map
// reserves the same space on web.
const toHeightStyle = (height?: number | string): ViewStyle | undefined => {
  const value = typeof height === 'string' ? height.trim() : height;
  if (value === undefined || value === null || value === '') return undefined;
  if (value === 'fill') return styles.fill;
  if (typeof value === 'string' && value.endsWith('%')) return { height: value as any };
  const dp = Number(value);
  return Number.isFinite(dp) ? { height: dp } : undefined;
};

/**
 * Web stand-in: `react-native-maps` has no web implementation, so this keeps the
 * native module out of the bundle. Renders an empty box; widget is published
 * `webSupport: false`.
 */
const MapsWebComponent = ({ height, style }: MapsProps) => {
  const heightStyle = useMemo(() => {
    const explicit = toHeightStyle(height);
    if (explicit) return explicit;
    const themed = StyleSheet.flatten(style) as ViewStyle | undefined;
    const sized = themed?.height !== undefined || themed?.flex !== undefined;
    return sized ? undefined : styles.fill;
  }, [height, style]);

  return <View style={[styles.root, style, heightStyle]} />;
};

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  fill: { flex: 1, minHeight: 240 },
});

export const Maps = Object.assign(MapsWebComponent, {
  displayName: 'Maps',
});
