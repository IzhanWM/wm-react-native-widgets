import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  APIProvider,
  Circle,
  InfoWindow,
  Map as GoogleMap,
  Marker,
  Polyline,
  useMap,
  useMarkerRef,
  type MapEvent,
  type MapMouseEvent,
} from '@vis.gl/react-google-maps';
import type { MapCoordinate, MapMarkerRow, MapsProps, MapUserLocation } from './maps.props';
import {
  DEFAULT_LATITUDE,
  DEFAULT_LONGITUDE,
  DEFAULT_ZOOM,
  FIT_PADDING,
  MAX_ZOOM,
  SINGLE_POINT_ZOOM,
  isSinglePoint,
  toText,
  useCameraTarget,
  useFitPoints,
  useHeightStyle,
  useMarkerPoints,
  useRouteCoordinates,
  type MarkerPoint,
} from './maps.utils';

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

const MAP_TYPE_IDS: Record<string, string> = {
  standard: 'roadmap',
  normal: 'roadmap',
  satellite: 'satellite',
  hybrid: 'hybrid',
  terrain: 'terrain',
};

const toLatLng = (point: MapCoordinate): google.maps.LatLngLiteral => ({
  lat: point.latitude,
  lng: point.longitude,
});

// Pins are vector symbols so markerColor tints them without a Map ID, which
// would switch customMapStyle off.
const PIN_PATH = 'M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 34 12 34s12-13.2 12-22.1C24 5.3 18.6 0 12 0z';

const pinIcon = (tint: string): google.maps.Symbol => ({
  path: PIN_PATH,
  fillColor: tint,
  fillOpacity: 1,
  strokeColor: '#FFFFFF',
  strokeWeight: 1.5,
  anchor: new google.maps.Point(12, 34),
});

const userLocationIcon = (): google.maps.Symbol => ({
  path: google.maps.SymbolPath.CIRCLE,
  scale: 7,
  fillColor: '#4285F4',
  fillOpacity: 1,
  strokeColor: '#FFFFFF',
  strokeWeight: 2,
});

// The browser asks for the location permission itself, so there is no
// expo-location step on web. A denial leaves the dot off.
const useBrowserLocation = (
  enabled: boolean,
  onChange?: (location: MapUserLocation) => void
): MapUserLocation | null => {
  const [location, setLocation] = useState<MapUserLocation | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const geolocation = typeof navigator === 'undefined' ? undefined : navigator.geolocation;
    if (!enabled || !geolocation) {
      setLocation(null);
      return undefined;
    }
    const watchId = geolocation.watchPosition(
      ({ coords, timestamp }) => {
        const next: MapUserLocation = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          altitude: coords.altitude ?? undefined,
          accuracy: coords.accuracy,
          heading: coords.heading ?? undefined,
          speed: coords.speed ?? undefined,
          timestamp,
        };
        setLocation(next);
        onChangeRef.current?.(next);
      },
      () => setLocation(null),
      { enableHighAccuracy: true }
    );
    return () => geolocation.clearWatch(watchId);
  }, [enabled]);

  return enabled ? location : null;
};

type WebMarkerProps = {
  point: MarkerPoint;
  open: boolean;
  onOpen: (key: string) => void;
  onMarkerPress?: (row: MapMarkerRow) => void;
  onCalloutPress?: (row: MapMarkerRow) => void;
  onMarkerDragEnd?: MapsProps['onMarkerDragEnd'];
};

// A pin tap opens its callout, as on device; a tap on the callout body is the
// callout press, and a tap on the map closes it.
const WebMarker = ({
  point,
  open,
  onOpen,
  onMarkerPress,
  onCalloutPress,
  onMarkerDragEnd,
}: WebMarkerProps) => {
  const [markerRef, marker] = useMarkerRef();
  const icon = useMemo(
    () => point.iconUrl ?? pinIcon(point.tint),
    [point.iconUrl, point.tint]
  );
  // As on device, only a row with a title gets a callout.
  const hasCallout = !!point.title;

  return (
    <>
      <Marker
        ref={markerRef}
        position={toLatLng(point.coordinate)}
        icon={icon}
        draggable={point.draggable}
        onClick={() => {
          onMarkerPress?.(point.row);
          if (hasCallout) onOpen(point.key);
        }}
        onDragEnd={(event) => {
          if (!event.latLng) return;
          onMarkerDragEnd?.({
            row: point.row,
            coordinate: { latitude: event.latLng.lat(), longitude: event.latLng.lng() },
          });
        }}
      />
      {open && hasCallout ? (
        <InfoWindow anchor={marker} headerDisabled>
          <div
            onClick={() => onCalloutPress?.(point.row)}
            style={{ cursor: onCalloutPress ? 'pointer' : 'default', maxWidth: 240 }}>
            <div style={callout.title}>{point.title}</div>
            {point.description ? <div style={callout.description}>{point.description}</div> : null}
          </div>
        </InfoWindow>
      ) : null}
    </>
  );
};

const GoogleMapView = ({
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
  onMapReady,
  onRegionChange,
  onMapPress,
  onLongPress,
  onMarkerPress,
  onCalloutPress,
  onUserLocationChange,
  onMarkerDragEnd,
}: MapsProps) => {
  const map = useMap();
  const [ready, setReady] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const markerPoints = useMarkerPoints({
    markers,
    latitudeField,
    longitudeField,
    titleField,
    descriptionField,
    markerColor,
    markerIcon,
    markerRadius,
    draggable,
  });
  const routeCoordinates = useRouteCoordinates(routePath, latitudeField, longitudeField);
  const routeLatLngs = useMemo(() => routeCoordinates.map(toLatLng), [routeCoordinates]);
  const { fitPoints, fitSignature } = useFitPoints(markerPoints, routeCoordinates);
  const userLocation = useBrowserLocation(showsUserLocation, onUserLocationChange);

  const { camera, cameraSignature } = useCameraTarget(latitude, longitude, zoom);
  // Seeded with the mount value: the default camera already placed the map there,
  // so only later changes to the props should move it.
  const appliedCameraRef = useRef(cameraSignature);
  const [initialCamera] = useState(camera);

  // Google reports every settle the same way, so a move counts as a gesture when
  // the user touched the map since the last one, and the widget's own camera
  // moves clear the flag.
  const gestureRef = useRef(false);

  useEffect(() => {
    const container = map?.getDiv();
    if (!container) return undefined;
    const markGesture = () => {
      gestureRef.current = true;
    };
    const events = ['pointerdown', 'wheel', 'keydown'] as const;
    events.forEach((type) =>
      container.addEventListener(type, markGesture, { capture: true, passive: true })
    );
    return () =>
      events.forEach((type) => container.removeEventListener(type, markGesture, { capture: true }));
  }, [map]);

  const mapStyles = useMemo(() => {
    if (!customMapStyle) return undefined;
    try {
      const parsed =
        typeof customMapStyle === 'string' ? JSON.parse(customMapStyle) : customMapStyle;
      return Array.isArray(parsed) ? (parsed as google.maps.MapTypeStyle[]) : undefined;
    } catch {
      return undefined;
    }
  }, [customMapStyle]);

  const moveCamera = useCallback(
    (center: MapCoordinate, nextZoom: number) => {
      if (!map) return;
      gestureRef.current = false;
      map.panTo(toLatLng(center));
      map.setZoom(nextZoom);
    },
    [map]
  );

  useEffect(() => {
    if (!map || !ready || !fitToData || !fitPoints.length) return;
    if (isSinglePoint(fitPoints)) {
      moveCamera(fitPoints[0], SINGLE_POINT_ZOOM);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    fitPoints.forEach((point) => bounds.extend(toLatLng(point)));
    gestureRef.current = false;
    map.fitBounds(bounds, FIT_PADDING);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, ready, fitToData, fitSignature, moveCamera]);

  useEffect(() => {
    if (!ready || fitToData) return;
    if (appliedCameraRef.current === cameraSignature) return;
    appliedCameraRef.current = cameraSignature;
    moveCamera(camera.center, camera.zoom);
  }, [ready, fitToData, cameraSignature, camera, moveCamera]);

  // The first settle is the map coming up at its default camera, not a move.
  const handleIdle = useCallback(
    (event: MapEvent) => {
      if (!ready) {
        gestureRef.current = false;
        setReady(true);
        onMapReady?.();
        return;
      }
      const isGesture = gestureRef.current;
      gestureRef.current = false;
      const center = event.map.getCenter();
      if (!center || !onRegionChange) return;
      const span = event.map.getBounds()?.toSpan();
      onRegionChange({
        latitude: center.lat(),
        longitude: center.lng(),
        latitudeDelta: span?.lat(),
        longitudeDelta: span?.lng(),
        zoom: event.map.getZoom(),
        tilt: event.map.getTilt() ?? 0,
        bearing: event.map.getHeading() ?? 0,
        isGesture,
      });
    },
    [ready, onMapReady, onRegionChange]
  );

  const handleClick = useCallback(
    (event: MapMouseEvent) => {
      setOpenKey(null);
      const latLng = event.detail.latLng;
      if (latLng) onMapPress?.({ latitude: latLng.lat, longitude: latLng.lng });
    },
    [onMapPress]
  );

  // Browsers raise contextmenu for a right click, and for a long press on touch.
  const handleContextmenu = useCallback(
    (event: MapMouseEvent) => {
      const latLng = event.detail.latLng;
      if (latLng) onLongPress?.({ latitude: latLng.lat, longitude: latLng.lng });
    },
    [onLongPress]
  );

  return (
    <GoogleMap
      style={mapBox}
      defaultCenter={toLatLng(initialCamera.center)}
      defaultZoom={initialCamera.zoom}
      maxZoom={MAX_ZOOM}
      mapTypeId={MAP_TYPE_IDS[mapType] ?? 'roadmap'}
      styles={mapStyles}
      gestureHandling={interactive ? 'greedy' : 'none'}
      keyboardShortcuts={interactive}
      disableDefaultUI
      zoomControl={interactive}
      clickableIcons={false}
      onIdle={handleIdle}
      onClick={handleClick}
      onContextmenu={handleContextmenu}>
      {markerPoints
        .filter((point) => point.radius > 0)
        .map((point) => (
          <Circle
            key={`radius-${point.key}`}
            center={toLatLng(point.coordinate)}
            radius={point.radius}
            fillColor={point.tint}
            fillOpacity={0.15}
            strokeColor={point.tint}
            strokeWeight={1.5}
            clickable={false}
          />
        ))}

      {routeLatLngs.length > 1 ? (
        <Polyline path={routeLatLngs} strokeColor={routeColor} strokeWeight={4} clickable={false} />
      ) : null}

      {markerPoints.map((point) => (
        <WebMarker
          key={point.key}
          point={point}
          open={openKey === point.key}
          onOpen={setOpenKey}
          onMarkerPress={onMarkerPress}
          onCalloutPress={onCalloutPress}
          onMarkerDragEnd={onMarkerDragEnd}
        />
      ))}

      {userLocation ? (
        <>
          {userLocation.accuracy ? (
            <Circle
              center={toLatLng(userLocation)}
              radius={userLocation.accuracy}
              fillColor="#4285F4"
              fillOpacity={0.12}
              strokeWeight={0}
              clickable={false}
            />
          ) : null}
          <Marker
            position={toLatLng(userLocation)}
            icon={userLocationIcon()}
            clickable={false}
            zIndex={google.maps.Marker.MAX_ZINDEX + 1}
          />
        </>
      ) : null}
    </GoogleMap>
  );
};

/**
 * Web map on the Google Maps JavaScript API via `@vis.gl/react-google-maps`, so
 * web preview matches the Google Maps the widget renders on Android. Needs
 * `webApiKey`; without it the box is reserved and left empty.
 */
const MapsWebComponent = (props: MapsProps) => {
  const heightStyle = useHeightStyle(props.height, props.style);
  const apiKey = toText(props.webApiKey)?.trim();

  return (
    <View style={[styles.root, props.style, heightStyle]}>
      {apiKey ? (
        <APIProvider apiKey={apiKey}>
          <GoogleMapView {...props} />
        </APIProvider>
      ) : null}
    </View>
  );
};

const mapBox: React.CSSProperties = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 };

const callout: Record<'title' | 'description', React.CSSProperties> = {
  title: { fontSize: 14, fontWeight: 600, color: '#202124' },
  description: { fontSize: 12, color: '#5F6368', marginTop: 2 },
};

const styles = StyleSheet.create({
  root: { overflow: 'hidden', alignSelf: 'stretch' },
});

export const Maps = Object.assign(MapsWebComponent, {
  displayName: 'Maps',
});
