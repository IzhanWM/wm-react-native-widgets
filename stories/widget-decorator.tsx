import type { Decorator } from '@storybook/react';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 8,
  },
  sourceContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  sourceLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    color: 'rgba(0,0,0,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceCode: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    color: 'rgba(0,0,0,0.85)',
  },
  note: {
    marginBottom: 12,
    fontSize: 13,
    color: 'rgba(0,0,0,0.55)',
  },
});

/**
 * Padded container plus the optional copy-paste source snippet, matching the
 * chart story decorators.
 */
export function widgetDecorator(): Decorator {
  const WidgetDecorator: Decorator = (Story, context) => (
    <View style={styles.container}>
      {context.parameters?.note != null && (
        <Text style={styles.note}>{String(context.parameters.note)}</Text>
      )}
      <Story />
      {context.parameters?.source != null && (
        <View style={styles.sourceContainer}>
          <Text style={styles.sourceLabel}>React Native</Text>
          <Text style={styles.sourceCode}>{String(context.parameters.source)}</Text>
        </View>
      )}
    </View>
  );
  return WidgetDecorator;
}
