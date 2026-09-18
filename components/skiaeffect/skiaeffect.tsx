import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Blur, Canvas, Circle, Group } from '@shopify/react-native-skia';
import type { GroupProps } from '@shopify/react-native-skia';
import type { EffectBlendMode, EffectBlob, SkiaEffectProps } from './skiaeffect.props';
import { rowKey, toRows } from '../utils/dataset';

/**
 * Skia's `blendMode` prop takes its `BlendMode` enum keys, uncapitalized
 * (e.g. `colorDodge`, `srcOver`) — not the CSS `mix-blend-mode` keywords
 * `EffectBlendMode` uses to stay web-compatible, so the two need mapping.
 */
const SKIA_BLEND_MODE: Record<EffectBlendMode, GroupProps['blendMode']> = {
  normal: 'srcOver',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  darken: 'darken',
  lighten: 'lighten',
  'color-dodge': 'colorDodge',
  'color-burn': 'colorBurn',
  'hard-light': 'hardLight',
  'soft-light': 'softLight',
  difference: 'difference',
  exclusion: 'exclusion',
  hue: 'hue',
  saturation: 'saturation',
  color: 'color',
  luminosity: 'luminosity',
};

export type {
  SkiaEffectProps,
  EffectBlob,
  EffectBlendMode,
} from './skiaeffect.props';

/** Blob radius, as a fraction of canvas size, when a row does not specify one. */
const DEFAULT_RADIUS_RATIO = 0.3;

/**
 * Per-pixel canvas for blend modes and blur that `react-native-svg` cannot reach.
 *
 * On iOS and Android this draws through Skia directly. Skia on web needs the
 * CanvasKit WASM bundle loaded by the host app before first render, which not
 * every host does — so `skiaeffect.web.tsx` renders the same composition with
 * CSS `filter` and `mix-blend-mode` instead, and no WASM is required.
 */
const SkiaEffectComponent = ({
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
        const angle = (index / Math.max(rows.length, 1)) * Math.PI * 2;
        return {
          key: rowKey(row, index),
          radius: (Number.isFinite(ratio) ? ratio : DEFAULT_RADIUS_RATIO) * size,
          cx: size / 2 + Math.cos(angle) * size * spread,
          cy: size / 2 + Math.sin(angle) * size * spread,
          color: typeof row?.color === 'string' ? row.color : '#2563EB',
        };
      }),
    [rows, size, spread]
  );

  return (
    <View style={[styles.root, { backgroundColor }, style]}>
      <Canvas style={[styles.canvas, { width: size, height: size }]}>
        <Group blendMode={SKIA_BLEND_MODE[blendMode]}>
          {blobs.map((blob) => (
            <Circle
              key={blob.key}
              cx={blob.cx}
              cy={blob.cy}
              r={blob.radius}
              color={blob.color}
            />
          ))}
          <Blur blur={blurAmount} />
        </Group>
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  canvas: { alignSelf: 'center' },
});

export const SkiaEffect = Object.assign(SkiaEffectComponent, {
  displayName: 'SkiaEffect',
});
