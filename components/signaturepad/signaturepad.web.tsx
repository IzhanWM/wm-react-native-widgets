import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { SignaturePadHandle, SignaturePadProps } from './signaturepad.props';

export type {
  SignaturePadProps,
  SignaturePadHandle,
  SignatureEndEvent,
} from './signaturepad.props';

type Point = { x: number; y: number };
type Stroke = Point[];

/** Minimum pointer travel, in pixels, before a new point is recorded. */
const POINT_EPSILON = 1.5;

/** Builds an SVG path command from a stroke, smoothing it with quadratic joins. */
function strokeToPath(stroke: Stroke): string {
  if (stroke.length === 0) return '';
  if (stroke.length === 1) {
    // A tap renders as a dot: a zero-length line with a round cap.
    const { x, y } = stroke[0];
    return `M ${x} ${y} L ${x} ${y}`;
  }

  let d = `M ${stroke[0].x} ${stroke[0].y}`;
  for (let i = 1; i < stroke.length - 1; i++) {
    const midX = (stroke[i].x + stroke[i + 1].x) / 2;
    const midY = (stroke[i].y + stroke[i + 1].y) / 2;
    d += ` Q ${stroke[i].x} ${stroke[i].y} ${midX} ${midY}`;
  }
  const last = stroke[stroke.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/**
 * Rasterizes the strokes to a base64 PNG using a detached 2-D canvas, so the web
 * build returns the same `data:image/png;base64,…` string the native build does.
 * Returns an empty string if the document is unavailable (SSR, snapshot tests).
 */
function strokesToPngDataUri(
  strokes: Stroke[],
  width: number,
  height: number,
  penColor: string,
  backgroundColor: string,
  lineWidth: number
): string {
  if (typeof document === 'undefined' || width <= 0 || height <= 0) return '';

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx == null) return '';

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = penColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    if (stroke.length === 1) {
      ctx.lineTo(stroke[0].x, stroke[0].y);
    } else {
      for (let i = 1; i < stroke.length - 1; i++) {
        const midX = (stroke[i].x + stroke[i + 1].x) / 2;
        const midY = (stroke[i].y + stroke[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, midX, midY);
      }
      const last = stroke[stroke.length - 1];
      ctx.lineTo(last.x, last.y);
    }
    ctx.stroke();
  }

  try {
    return canvas.toDataURL('image/png');
  } catch {
    // A tainted canvas cannot be exported; fail soft rather than throw.
    return '';
  }
}

/**
 * Web signature surface.
 *
 * The native build draws through `react-native-signature-canvas`, which needs a
 * WebView that `react-native-web` does not provide. Rather than render a dead
 * box on web, this implementation captures strokes with `PanResponder`, draws
 * them live as SVG, and rasterizes to a base64 PNG on finger-up — so the props,
 * events and `ref` handle behave exactly as they do on device.
 *
 * The one difference: `minWidth` / `maxWidth` are averaged into a single stroke
 * width here; the native canvas varies thickness with pointer velocity.
 */
const SignaturePadWebComponent = forwardRef<SignaturePadHandle, SignaturePadProps>(
  (
    {
      penColor = '#1D1B20',
      backgroundColor = '#FFFFFF',
      minWidth = 2,
      maxWidth = 4,
      onSignatureEnd,
      onClear,
      style,
    },
    ref
  ) => {
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [current, setCurrent] = useState<Stroke>([]);

    // Mirrors of the drawing state the pan handlers can read synchronously.
    const strokesRef = useRef<Stroke[]>([]);
    const currentRef = useRef<Stroke>([]);
    const sizeRef = useRef({ width: 0, height: 0 });

    const lineWidth = (minWidth + maxWidth) / 2;

    // Handlers change identity every render; the responder is built once.
    const callbacksRef = useRef({ onSignatureEnd, onClear });
    callbacksRef.current = { onSignatureEnd, onClear };
    const styleRef = useRef({ penColor, backgroundColor, lineWidth });
    styleRef.current = { penColor, backgroundColor, lineWidth };

    const onLayout = useCallback((event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      sizeRef.current = { width, height };
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    }, []);

    const addPoint = useCallback((event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent;
      const point = { x: locationX, y: locationY };
      const stroke = currentRef.current;
      const last = stroke[stroke.length - 1];

      if (
        last != null &&
        Math.abs(last.x - point.x) < POINT_EPSILON &&
        Math.abs(last.y - point.y) < POINT_EPSILON
      ) {
        return;
      }

      currentRef.current = [...stroke, point];
      setCurrent(currentRef.current);
    }, []);

    const emitSignature = useCallback(() => {
      const { width, height } = sizeRef.current;
      const { penColor: pen, backgroundColor: bg, lineWidth: width2 } = styleRef.current;
      const signature = strokesToPngDataUri(strokesRef.current, width, height, pen, bg, width2);
      callbacksRef.current.onSignatureEnd?.({
        signature,
        strokeCount: strokesRef.current.length,
      });
    }, []);

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: (event) => {
            currentRef.current = [];
            addPoint(event);
          },
          onPanResponderMove: (event) => {
            addPoint(event);
          },
          onPanResponderRelease: () => {
            if (currentRef.current.length === 0) return;
            strokesRef.current = [...strokesRef.current, currentRef.current];
            setStrokes(strokesRef.current);
            currentRef.current = [];
            setCurrent([]);
            emitSignature();
          },
          onPanResponderTerminate: () => {
            currentRef.current = [];
            setCurrent([]);
          },
        }),
      [addPoint, emitSignature]
    );

    const clear = useCallback(() => {
      strokesRef.current = [];
      currentRef.current = [];
      setStrokes([]);
      setCurrent([]);
      callbacksRef.current.onClear?.();
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        clear,
        readSignature: emitSignature,
        isEmpty: () => strokesRef.current.length === 0,
      }),
      [clear, emitSignature]
    );

    const paths = useMemo(() => {
      const all = current.length > 0 ? [...strokes, current] : strokes;
      return all.map(strokeToPath).filter((d) => d !== '');
    }, [strokes, current]);

    return (
      <View
        style={[styles.root, { backgroundColor }, style]}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        {size.width > 0 && size.height > 0 && (
          <Svg width={size.width} height={size.height}>
            {paths.map((d, index) => (
              <Path
                key={index}
                d={d}
                stroke={penColor}
                strokeWidth={lineWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
          </Svg>
        )}
      </View>
    );
  }
);

SignaturePadWebComponent.displayName = 'SignaturePad';

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export const SignaturePad = SignaturePadWebComponent;
