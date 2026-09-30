import { SwipeDeck } from '@components/swipedeck/swipedeck';
import type { SwipeEvent } from '@components/swipedeck';
import type { StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import meta from '../meta';
import { PROFILE_CARDS } from '../../sample-data';

export default { ...meta, title: 'UI Widgets/Swipe Deck/Interaction' };
type Story = StoryObj<typeof meta>;

const styles = StyleSheet.create({
  readout: {
    marginTop: 16,
    padding: 12,
    gap: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  readoutText: { fontSize: 13, color: '#1E3A8A' },
  button: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});

const describe = (event: SwipeEvent) =>
  `${event.direction === 'right' ? 'Accepted' : 'Rejected'} ${String(event.card.title)} (index ${event.index}).`;

/** Swipe right to accept, left to reject. The last card also fires `onDeckEmpty`. */
export const OnSwipe: Story = {
  render: (args) => {
    const [lines, setLines] = useState<string[]>([]);
    // Remounting with a new key is how a page refills an emptied deck.
    const [deckKey, setDeckKey] = useState(0);
    const push = (line: string) => setLines((current) => [line, ...current].slice(0, 5));
    return (
      <View>
        <SwipeDeck
          key={deckKey}
          {...args}
          onSwipeRight={(event) => push(`onSwipeRight — ${describe(event)}`)}
          onSwipeLeft={(event) => push(`onSwipeLeft — ${describe(event)}`)}
          onDeckEmpty={() => push('onDeckEmpty — no cards left.')}
        />
        <View style={styles.readout}>
          {lines.length ? (
            lines.map((line, index) => (
              <Text key={`${index}-${line}`} style={styles.readoutText}>
                {line}
              </Text>
            ))
          ) : (
            <Text style={styles.readoutText}>Swipe a card left or right.</Text>
          )}
        </View>
        <Pressable
          style={styles.button}
          onPress={() => {
            setDeckKey((key) => key + 1);
            setLines([]);
          }}>
          <Text style={styles.buttonText}>Reset deck</Text>
        </Pressable>
      </View>
    );
  },
  args: {
    dataset: PROFILE_CARDS.slice(0, 3),
  },
};

/** A short threshold commits a swipe after a small flick. */
export const LowSwipeThreshold: Story = {
  args: { dataset: PROFILE_CARDS, swipeThreshold: 40 },
  parameters: {
    note: 'swipeThreshold is 40 instead of 120.',
  },
};

/** `enabled={false}` freezes the deck: the top card ignores drags. */
export const Frozen: Story = {
  args: { dataset: PROFILE_CARDS, enabled: false },
  parameters: {
    note: 'Try dragging the top card — it stays put.',
  },
};
