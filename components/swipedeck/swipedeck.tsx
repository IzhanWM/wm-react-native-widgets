import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { SwipeCard, SwipeDeckProps, SwipeDirection } from './swipedeck.props';
import { rowField, rowKey, rowsSignature, toRows } from '../utils/dataset';

export type {
  SwipeDeckProps,
  SwipeCard,
  SwipeEvent,
  SwipeDirection,
} from './swipedeck.props';

/** Duration of the fly-off animation once a swipe is committed. */
const FLY_OFF_MS = 180;
/** Extra travel past the card edge so it fully clears the viewport. */
const FLY_OFF_OVERSHOOT = 200;
/** Drag distance that maps to a full rotation step, in pixels per degree. */
const ROTATION_DIVISOR = 20;

/**
 * Card deck with pan physics and a stacked rest state. Drag the top card past
 * `swipeThreshold` to commit it; release short of the threshold and it springs back.
 *
 * Built directly on `react-native-gesture-handler` and `react-native-reanimated`,
 * both of which support web — so the deck runs on iOS, Android and web. The host
 * app must render a `GestureHandlerRootView` above this widget (on web too).
 */
const SwipeDeckComponent = ({
  dataset,
  titleField = 'title',
  subtitleField = 'subtitle',
  imageField = 'image',
  imageHeight = 180,
  cardWidth = 300,
  cardHeight = 380,
  stackOffset = 12,
  stackDepth = 2,
  swipeThreshold = 120,
  cardColor = '#FFFFFF',
  enabled = true,
  onSwipeRight,
  onSwipeLeft,
  onDeckEmpty,
  style,
}: SwipeDeckProps) => {
  const rows = useMemo(() => toRows(dataset) as SwipeCard[], [dataset]);

  const [index, setIndex] = useState(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Callbacks live in a ref so the gesture does not need rebuilding when the
  // page re-renders with new handler identities.
  const handlersRef = useRef({ onSwipeRight, onSwipeLeft, onDeckEmpty });
  handlersRef.current = { onSwipeRight, onSwipeLeft, onDeckEmpty };

  // Restart the deck when the rows actually change. Keying this on the array's
  // identity would snap a half-dragged card back on every parent re-render.
  const signature = useMemo(() => rowsSignature(rows), [rows]);
  useEffect(() => {
    setIndex(0);
    translateX.value = 0;
    translateY.value = 0;
  }, [signature, translateX, translateY]);

  const commit = useCallback(
    (direction: SwipeDirection) => {
      translateX.value = 0;
      translateY.value = 0;

      setIndex((current) => {
        const card = rows[current];
        if (card === undefined) return current;

        const next = current + 1;
        const event = { card, index: current, direction };
        const handlers = handlersRef.current;

        if (direction === 'right') handlers.onSwipeRight?.(event);
        else handlers.onSwipeLeft?.(event);

        if (next >= rows.length) handlers.onDeckEmpty?.();
        return next;
      });
    },
    [rows, translateX, translateY]
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled && index < rows.length)
        .onUpdate((event) => {
          translateX.value = event.translationX;
          translateY.value = event.translationY;
        })
        .onEnd((event) => {
          if (Math.abs(event.translationX) > swipeThreshold) {
            const direction: SwipeDirection = event.translationX > 0 ? 'right' : 'left';
            const target =
              (direction === 'right' ? 1 : -1) * (cardWidth + FLY_OFF_OVERSHOOT);
            translateX.value = withTiming(target, { duration: FLY_OFF_MS }, () => {
              runOnJS(commit)(direction);
            });
          } else {
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
          }
        }),
    [enabled, index, rows.length, swipeThreshold, cardWidth, commit, translateX, translateY]
  );

  const topCardStyle = useAnimatedStyle(() => ({
    // Annotated because RN does not narrow a mixed transform-object array.
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${(translateX.value / ROTATION_DIVISOR).toFixed(2)}deg` },
    ] as ViewStyle['transform'],
  }));

  // remaining[0] is the live card; higher indices sit further back in the stack.
  const remaining = useMemo(
    () => rows.slice(index, index + Math.max(1, stackDepth + 1)),
    [rows, index, stackDepth]
  );

  const renderBody = (card: SwipeCard) => {
    const imageUri = rowField(card, imageField, 'image', 'imageUrl');
    const title = rowField(card, titleField, 'title', 'name');
    const subtitle = rowField(card, subtitleField, 'subtitle', 'description');

    return (
      <>
        {imageUri != null && imageUri !== '' ? (
          <Image
            source={{ uri: String(imageUri) }}
            style={[styles.image, { height: imageHeight }]}
            resizeMode="cover"
          />
        ) : null}
        <View style={styles.cardBody}>
          <Text style={styles.title} numberOfLines={2}>
            {title != null ? String(title) : ''}
          </Text>
          <Text style={styles.subtitle} numberOfLines={3}>
            {subtitle != null ? String(subtitle) : ''}
          </Text>
        </View>
      </>
    );
  };

  return (
    <View style={[styles.root, { width: cardWidth, height: cardHeight }, style]}>
      {remaining
        // Paint the deepest card first so the live card ends up on top.
        .map((card, depth) => ({ card, depth }))
        .reverse()
        .map(({ card, depth }) => {
          const base = [
            styles.card,
            {
              width: cardWidth,
              height: cardHeight,
              backgroundColor: cardColor,
              top: depth * stackOffset,
              zIndex: remaining.length - depth,
            },
          ];

          return depth === 0 ? (
            <GestureDetector key={rowKey(card, index)} gesture={pan}>
              <Animated.View style={[base, topCardStyle]}>{renderBody(card)}</Animated.View>
            </GestureDetector>
          ) : (
            <View key={rowKey(card, index + depth)} style={base}>
              {renderBody(card)}
            </View>
          );
        })}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { alignSelf: 'center' },
  card: {
    position: 'absolute',
    left: 0,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    padding: 20,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardBody: { gap: 6 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#6B7280' },
});

export const SwipeDeck = Object.assign(SwipeDeckComponent, {
  displayName: 'SwipeDeck',
});
