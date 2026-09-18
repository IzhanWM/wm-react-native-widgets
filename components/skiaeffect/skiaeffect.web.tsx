import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { EffectBlob, SkiaEffectProps } from './skiaeffect.props';
import { rowKey, toRows } from '../utils/dataset';

export type {
  SkiaEffectProps,
  EffectBlob,
  EffectBlendMode,
} from './skiaeffect.props';

/** Blob radius, as a fraction of canvas size, when a row does not specify one. */
const DEFAULT_RADIUS_RATIO = 0.3;

/**
 * Web implementation of the Skia effect.
 *
 * `@shopify/react-native-skia` runs on web only after the host app has loaded the
 * CanvasKit WASM bundle (`LoadSkiaWeb` / `WithSkiaWeb`). Importing it
 * unconditionally breaks any web build that has not done that setup, which is why
 * this file exists: the platform resolver picks it on web, so the Skia module is
 * never pulled into the web bundle at all.
 *
 * The composition is reproduced with CSS instead — `filter: blur()` for the
 * Gaussian and `mix-blend-mode` for the compositing, both of which map one-to-one
 * onto the Skia `Blur` and `blendMode` used natively. Where a browser or an older
 * `react-native-web` ignores those properties the blobs still render, just flat
 * and unblended, so the widget degrades rather than disappears.
 */
const SkiaEffectWebComponent = ({
  dataset,
  size = 200,
  blurAmount = 24,
  blendMode = 'screen',
  spread = 0.18,
  backgroundColor = 'transparent',
  style,
}: SkiaEffectProps) => {
  const rows = useMemo(() => toRows(dataset) as EffectBlob[], [dataset]);

  const blobs = useMemo(
    () =>
      rows.map((row, index) => {
        const ratio = Number(row?.radius);
        const radius = (Number.isFinite(ratio) ? ratio : DEFAULT_RADIUS_RATIO) * size;
        const angle = (index / Math.max(rows.length, 1)) * Math.PI * 2;
        return {
          key: rowKey(row, index),
          radius,
          // Skia positions circles by center; CSS positions boxes by their
          // top-left corner, so shift by one radius.
          left: size / 2 + Math.cos(angle) * size * spread - radius,
          top: size / 2 + Math.sin(angle) * size * spread - radius,
          color: typeof row?.color === 'string' ? row.color : '#2563EB',
        };
      }),
    [rows, size, spread]
  );

  // `filter` and `mixBlendMode` are web-only style properties. They are cast
  // because React Native's ViewStyle does not declare them across every version
  // this package supports; react-native-web forwards them straight to CSS.
  const canvasStyle = {
    width: size,
    height: size,
    filter: `blur(${blurAmount}px)`,
  } as any;

  const blobStyle = (blob: (typeof blobs)[number]) =>
    ({
      position: 'absolute',
      left: blob.left,
      top: blob.top,
      width: blob.radius * 2,
      height: blob.radius * 2,
      borderRadius: blob.radius,
      backgroundColor: blob.color,
      mixBlendMode: blendMode,
    }) as any;

  return (
    <View style={[styles.root, { backgroundColor }, style]}>
      <View style={[styles.canvas, canvasStyle]}>
        {blobs.map((blob) => (
          <View key={blob.key} style={blobStyle(blob)} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  canvas: { alignSelf: 'center', overflow: 'hidden', position: 'relative' },
});

export const SkiaEffect = Object.assign(SkiaEffectWebComponent, {
  displayName: 'SkiaEffect',
});
