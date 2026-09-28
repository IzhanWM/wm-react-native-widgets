import type { StoryObj } from '@storybook/react';
import React, { useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SkiaEffect } from '@components/skiaeffect/skiaeffect';
import type { SkiaEffectProps } from '@components/skiaeffect';
import meta from './meta';
import { GLOW_BLOBS, SUNSET_BLOBS } from '../sample-data';

export default { ...meta, title: 'UI Widgets/Skia Effect', tags: ['autodocs'] };
type Story = StoryObj<typeof meta>;

/**
 * Default effect: three blobs, screen-blended and blurred.
 *
 * Storybook runs the **web** implementation. Skia on web needs the CanvasKit
 * WASM bundle loaded by the host before first render, so `skiaeffect.web.tsx`
 * reproduces the composition with CSS `filter` and `mix-blend-mode` instead —
 * the Skia module never enters the web bundle.
 */
export const Default: Story = {
  args: {
    dataset: GLOW_BLOBS,
  },
  parameters: {
    note: 'On iOS and Android this paints through Skia; here on web it is the CSS filter + mix-blend-mode equivalent, so no WASM is needed.',
    source: '<SkiaEffect dataset={blobs} blendMode="screen" blurAmount={24} />',
  },
};

/** A warmer, four-blob palette. */
export const Sunset: Story = {
  args: {
    dataset: SUNSET_BLOBS,
    size: 260,
  },
};

/** A single blob reads as a soft glow. */
export const SingleGlow: Story = {
  args: {
    dataset: [{ id: 1, color: '#38BDF8', radius: 0.4 }],
    blurAmount: 36,
  },
};

/** An empty dataset renders an empty canvas rather than erroring. */
export const EmptyDataset: Story = {
  args: {
    dataset: [],
  },
};

/** Blend modes need a backdrop to composite against. */
export const OnDarkBackground: Story = {
  args: {
    dataset: GLOW_BLOBS,
    backgroundColor: '#0B1020',
    size: 260,
  },
  parameters: {
    note: 'screen is additive, so it shows its character against a dark ground.',
  },
};

// ---------------------------------------------------------------------------
// Use case: a payment card whose number and CVV stay blurred until revealed.
// ---------------------------------------------------------------------------

const INK = '#15171A';
const SILVER = '#E4E7EB';
const MUTED = 'rgba(228,231,235,0.55)';

/** Cool steel tones — a soft, uneven glare like light on a laminated card. */
const GLARE_BLOBS = [
  { id: 1, color: '#9AA3AE', radius: 0.3 },
  { id: 2, color: '#5E6671', radius: 0.26 },
  { id: 3, color: '#C9CFD6', radius: 0.2 },
];

const CARD = {
  groups: ['5301', '8846', '2190', '4417'],
  holder: 'NOOR HADDAD',
  expiry: '09/29',
  cvv: '382',
};

/** ISO ID-1 proportions (85.60 × 53.98 mm). */
const CARD_WIDTH = 340;
const CARD_HEIGHT = 214;

/** Blur radius, in px, of a hidden field. Enough that no digit can be made out. */
const MASK_BLUR = 6;

/** Shown blurred in place of a hidden value, so the real digits never render. */
const DECOY = '7294618305';

type GlareLook = Pick<SkiaEffectProps, 'dataset' | 'blurAmount' | 'blendMode'>;

// `filter` and `backgroundImage` are web-only style properties; react-native-web
// forwards them straight to CSS. They are cast because React Native's style types
// do not declare them across every version this package supports.
const blur = (value: string | Animated.AnimatedInterpolation<string>) => ({ filter: value }) as any;
const gradient = (value: string) => ({ backgroundImage: value }) as any;

/**
 * A sensitive field shown blurred. While hidden, only a decoy of the same length
 * is rendered — blurred, so it reads as the real value out of focus — and the real
 * value reaches neither the DOM nor a screen reader until the viewer reveals it.
 * Revealing pulls the real value into focus as the decoy fades out.
 */
const Blurred = ({
  value,
  label,
  progress,
  masked,
  textStyle,
}: {
  value: string;
  label: string;
  progress: Animated.Value;
  masked: boolean;
  textStyle: object;
}) => {
  const decoy = DECOY.repeat(Math.ceil(value.length / DECOY.length)).slice(0, value.length);
  return (
    <View accessible accessibilityLabel={masked ? `${label} hidden` : `${label} ${value}`}>
      <Animated.Text
        aria-hidden
        style={[
          textStyle,
          blur(`blur(${MASK_BLUR}px)`),
          { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
        ]}
      >
        {decoy}
      </Animated.Text>
      {masked ? null : (
        <Animated.Text
          style={[
            textStyle,
            styles.overlay,
            { opacity: progress },
            blur(
              progress.interpolate({
                inputRange: [0, 1],
                outputRange: [`blur(${MASK_BLUR}px)`, 'blur(0px)'],
              })
            ),
          ]}
        >
          {value}
        </Animated.Text>
      )}
    </View>
  );
};

/** EMV chip: gold contact plate with its pad divisions, drawn from plain views. */
const Chip = () => (
  <View style={[styles.chip, gradient(CHIP_GOLD)]}>
    <View style={[styles.chipRule, { top: 11 }]} />
    <View style={[styles.chipRule, { top: 22 }]} />
    <View style={[styles.chipColumn, { left: 14 }]} />
    <View style={[styles.chipColumn, { right: 14 }]} />
    <View style={styles.chipPad} />
  </View>
);

/** Contactless mark: three nested arcs opening to the right. */
const Contactless = () => (
  <View style={styles.contactless}>
    {[6, 11, 16].map((r) => (
      <View
        key={r}
        style={[styles.arc, { width: r * 2, height: r * 2, borderRadius: r, marginTop: -r, left: -r }]}
      />
    ))}
  </View>
);

const Field = ({ label, children, end }: { label: string; children: React.ReactNode; end?: boolean }) => (
  <View style={end && styles.alignEnd}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const Button = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
      styles.button,
      hovered && styles.buttonHover,
      pressed && styles.buttonPressed,
    ]}
  >
    <Text style={styles.buttonText}>{title}</Text>
  </Pressable>
);

const CreditCard = ({ look, initiallyRevealed = false }: { look: GlareLook; initiallyRevealed?: boolean }) => {
  const [revealed, setRevealed] = useState(initiallyRevealed);
  // Real values stay mounted until the hide animation finishes, so they blur back
  // out of focus instead of snapping straight to the decoy.
  const [masked, setMasked] = useState(!initiallyRevealed);
  const reveal = useRef(new Animated.Value(initiallyRevealed ? 1 : 0)).current;

  const toggleReveal = () => {
    const next = !revealed;
    setRevealed(next);
    if (next) setMasked(false);
    Animated.timing(reveal, {
      toValue: next ? 1 : 0,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !next) setMasked(true);
    });
  };

  const hidden = { progress: reveal, masked };

  return (
    <View style={styles.stage}>
      {/* Tapping the card toggles its details, the same as the button below it. */}
      <Pressable
        onPress={toggleReveal}
        accessibilityRole="button"
        accessibilityHint={revealed ? 'Hides the card details' : 'Reveals the card details'}
        style={({ pressed }) => [styles.card, gradient(CARD_METAL), pressed && styles.cardPressed]}
      >
        <View style={styles.glare} pointerEvents="none">
          <SkiaEffect
            dataset={look.dataset}
            blurAmount={look.blurAmount}
            blendMode={look.blendMode}
            size={360}
            spread={0.2}
          />
        </View>
        <View style={styles.edgeLight} pointerEvents="none" />

        <View style={styles.topRow}>
          <Text style={styles.brand}>BrightBank</Text>
          <Text style={styles.tier}>DEBIT</Text>
        </View>

        <View style={styles.chipRow}>
          <Chip />
          <Contactless />
        </View>

        <View style={styles.numberRow}>
          {CARD.groups.map((group, index) =>
            index === CARD.groups.length - 1 ? (
              <Text key={index} style={styles.digits}>
                {group}
              </Text>
            ) : (
              <Blurred
                key={index}
                value={group}
                label={`Card number group ${index + 1}`}
                textStyle={styles.digits}
                {...hidden}
              />
            )
          )}
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.holder}>
            <Field label="CARD HOLDER">
              <Text style={styles.value} numberOfLines={1}>
                {CARD.holder}
              </Text>
            </Field>
          </View>
          <Field label="VALID THRU">
            <Text style={styles.value}>{CARD.expiry}</Text>
          </Field>
          <Field label="CVV" end>
            <Blurred value={CARD.cvv} label="CVV" textStyle={styles.value} {...hidden} />
          </Field>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Button title={revealed ? 'Hide details' : 'Reveal details'} onPress={toggleReveal} />
      </View>
    </View>
  );
};

const note =
  'Card number and CVV share the front of the card and sit blurred until revealed — tap the card or the button. While hidden only a same-length decoy is rendered, so the real digits never reach the DOM. The soft glare across the graphite face is a SkiaEffect — the controls restyle it live.';

const source = `<SkiaEffect
  dataset={[{ color: '#9AA3AE' }, { color: '#5E6671' }, { color: '#C9CFD6' }]}
  blendMode="screen"
  blurAmount={48}
  size={360}
/>`;

/**
 * A payment card whose number and CVV sit blurred until revealed. The
 * `dataset`, `blurAmount` and `blendMode` controls restyle the Skia glare.
 */
export const CreditCardPrivacy: Story = {
  name: 'Credit Card Privacy',
  // The card lays out its own canvas, so the geometry controls would do nothing.
  argTypes: {
    size: { table: { disable: true } },
    spread: { table: { disable: true } },
    backgroundColor: { table: { disable: true } },
  },
  args: {
    dataset: GLARE_BLOBS,
    blurAmount: 48,
    blendMode: 'screen',
  },
  parameters: { note, source },
  render: (args) => (
    <CreditCard look={{ dataset: args.dataset, blurAmount: args.blurAmount, blendMode: args.blendMode }} />
  ),
};

/** The same card with its details already revealed. */
export const CreditCardRevealed: Story = {
  name: 'Credit Card Revealed',
  // The card lays out its own canvas, so the geometry controls would do nothing.
  argTypes: {
    size: { table: { disable: true } },
    spread: { table: { disable: true } },
    backgroundColor: { table: { disable: true } },
  },
  args: {
    dataset: GLARE_BLOBS,
    blurAmount: 48,
    blendMode: 'screen',
  },
  render: (args) => (
    <CreditCard
      initiallyRevealed
      look={{ dataset: args.dataset, blurAmount: args.blurAmount, blendMode: args.blendMode }}
    />
  ),
};

/** Graphite face: fine horizontal brushing over a diagonal light-to-shadow fall-off. */
const CARD_METAL = [
  'repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 3px)',
  'linear-gradient(125deg, #3A3D43 0%, #25272B 38%, #17181B 72%, #101113 100%)',
].join(', ');

const CHIP_GOLD =
  'linear-gradient(135deg, #F3DDA2 0%, #CFA656 38%, #E8CB84 62%, #A7802F 100%)';

const styles = StyleSheet.create({
  stage: { alignItems: 'center' },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    backgroundColor: '#1D1F23',
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    cursor: 'pointer',
  },
  cardPressed: { transform: [{ scale: 0.985 }] },
  glare: { position: 'absolute', left: -150, top: -200, opacity: 0.22 },
  edgeLight: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontWeight: '700', fontSize: 19, color: SILVER, letterSpacing: -0.4 },
  tier: { fontWeight: '600', fontSize: 9, letterSpacing: 2.5, color: MUTED },
  chipRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 12 },
  chip: {
    width: 44,
    height: 33,
    borderRadius: 7,
    backgroundColor: '#CFA656',
    borderWidth: 1,
    borderColor: 'rgba(90,64,20,0.35)',
    overflow: 'hidden',
  },
  chipRule: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(90,64,20,0.4)' },
  chipColumn: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(90,64,20,0.4)' },
  chipPad: {
    position: 'absolute',
    top: 11,
    bottom: 10,
    left: 14,
    right: 14,
    borderRadius: 3,
    backgroundColor: '#DDBB6E',
    borderWidth: 1,
    borderColor: 'rgba(90,64,20,0.4)',
  },
  contactless: { width: 18, height: 34, justifyContent: 'center', overflow: 'hidden' },
  arc: {
    position: 'absolute',
    top: '50%',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRightColor: 'rgba(228,231,235,0.6)',
  },
  numberRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  // A dark drop beneath each glyph reads as embossing on the metal.
  digits: {
    fontVariant: ['tabular-nums'],
    fontSize: 21,
    color: SILVER,
    letterSpacing: 1.5,
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  overlay: { position: 'absolute', top: 0, left: 0 },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 22, marginTop: 'auto' },
  holder: { flex: 1 },
  alignEnd: { alignItems: 'flex-end' },
  label: { fontWeight: '600', fontSize: 7, letterSpacing: 1.8, color: MUTED, marginBottom: 3 },
  value: {
    fontVariant: ['tabular-nums'],
    fontSize: 14,
    color: SILVER,
    letterSpacing: 1,
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: INK,
  },
  buttonHover: { transform: [{ translateY: -1 }] },
  buttonPressed: { transform: [{ scale: 0.97 }], opacity: 0.85 },
  buttonText: { fontWeight: '700', fontSize: 13, color: SILVER, letterSpacing: 0.3 },
});
