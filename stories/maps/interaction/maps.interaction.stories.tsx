import { Maps } from '@components/maps/maps';
import type { StoryObj } from '@storybook/react';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import meta from '../meta';
import { OUTLETS } from '../../sample-data';

export default { ...meta, title: 'UI Widgets/Maps/Interaction' };
type Story = StoryObj<typeof meta>;

const styles = StyleSheet.create({
  log: {
    padding: 12,
    gap: 4,
    minHeight: 132,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  logEmpty: { fontSize: 12, color: '#64748B' },
  logLine: { fontSize: 12, color: '#1E3A8A', fontFamily: 'ui-monospace, monospace' },
});

const round = (_key: string, value: unknown) =>
  typeof value === 'number' ? Math.round(value * 1e4) / 1e4 : value;

/** Keeps the last few events with their payloads, newest first. */
const useEventLog = () => {
  const [lines, setLines] = useState<string[]>([]);
  const log = useCallback(
    (name: string) => (payload?: unknown) =>
      setLines((current) =>
        [`${name} ${payload === undefined ? '' : JSON.stringify(payload, round)}`, ...current].slice(0, 6)
      ),
    []
  );
  return { lines, log };
};

const EventLog = ({ lines }: { lines: string[] }) => (
  <View style={styles.log}>
    {lines.length ? (
      lines.map((line, index) => (
        <Text key={`${index}-${line}`} style={styles.logLine} numberOfLines={1}>
          {line}
        </Text>
      ))
    ) : (
      <Text style={styles.logEmpty}>Pan, tap, right-click, or drag a pin. Events print here.</Text>
    )}
  </View>
);

/**
 * Every event with its payload. Pins are draggable; tap one for its callout and
 * tap the callout for `onCalloutPress`. On web, a right click is the long press.
 */
export const Events: Story = {
  render: (args) => {
    const { lines, log } = useEventLog();
    return (
      <View>
        <Maps
          {...args}
          markers={OUTLETS}
          draggable
          fitToData
          onMapReady={log('onMapReady')}
          onRegionChange={log('onRegionChange')}
          onMapPress={log('onMapPress')}
          onLongPress={log('onLongPress')}
          onMarkerPress={(row) => log('onMarkerPress')({ title: row.title })}
          onCalloutPress={(row) => log('onCalloutPress')({ title: row.title })}
          onMarkerDragEnd={(event) =>
            log('onMarkerDragEnd')({ title: event.row.title, coordinate: event.coordinate })
          }
        />
        <EventLog lines={lines} />
      </View>
    );
  },
};

/** The browser asks for the location, then the blue dot follows it. */
export const UserLocation: Story = {
  render: (args) => {
    const { lines, log } = useEventLog();
    return (
      <View>
        <Maps {...args} showsUserLocation onUserLocationChange={log('onUserLocationChange')} />
        <EventLog lines={lines} />
      </View>
    );
  },
};
