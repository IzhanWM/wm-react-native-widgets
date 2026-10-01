import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  readout: {
    marginTop: 16,
    padding: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(37,99,235,0.08)',
    gap: 4,
  },
  label: { fontSize: 11, fontWeight: '600', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: 0.5 },
  text: { fontSize: 12, color: '#1E3A8A', fontFamily: 'ui-monospace, monospace' },
});

/** What the page received: the latest event, as JSON. */
export function Readout({ label, value }: { label: string; value: unknown }) {
  return (
    <View style={styles.readout}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.text} testID={`readout-${label}`}>
        {value === undefined ? '—' : JSON.stringify(value, null, 2)}
      </Text>
    </View>
  );
}
