# Getting started

`@wavemaker/react-native-widgets` is a set of seven standalone React Native UI
widgets. Every one of them runs on **iOS, Android and web** from the same
import — nothing in your page branches on platform.

## Install

```bash
npm install @wavemaker/react-native-widgets
npm install react-native-svg react-native-gesture-handler react-native-reanimated
```

Two peers are optional and only needed by one widget each:

```bash
npm install @shopify/react-native-skia   # SkiaEffect
npm install react-native-webview         # SignaturePad, native only
```

## Use a widget

```tsx
import { QrCode, AvatarStack, SegmentProgress } from '@wavemaker/react-native-widgets';

<QrCode value="https://www.wavemaker.com" size={180} />
<AvatarStack dataset={members} maxVisible={4} />
<SegmentProgress dataset={segments} total={128} />
```

Each widget is also importable on its own subpath, if you would rather not pull
the barrel in:

```tsx
import { QrCode } from '@wavemaker/react-native-widgets/qrcode';
```

## Binding data

Every collection-backed widget takes a `dataset` and normalizes it, so you can
hand it an array, a JSON string, or a WaveMaker Studio variable wrapper
(`{ dataSet }`, `{ content }` or `{ data }`). An unresolved binding renders the
widget's empty state rather than throwing.

```tsx
<AvatarStack
  dataset={teamVariable}
  nameField="fullName"
  imageField="avatar"
  statusField="presence"
/>
```

The `*Field` props say which column of your rows to read, so rows rarely need
reshaping before they are bound.

## Gestures

`SwipeDeck` and `ReorderList` recognise pans and long-presses, so they need a
`GestureHandlerRootView` above them — on web as well as on device:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

<GestureHandlerRootView style={{ flex: 1 }}>
  <SwipeDeck dataset={cards} onSwipeRight={accept} onSwipeLeft={reject} />
</GestureHandlerRootView>
```

## The widgets

| Widget | What it does | Key props |
| --- | --- | --- |
| `QrCode` | Vector QR symbol with an optional centered logo | `value`, `size`, `logoUrl`, `errorCorrection` |
| `AvatarStack` | Overlapping avatars, presence dots, `+N` overflow | `dataset`, `maxVisible`, `overlap`, `showStatus` |
| `SegmentProgress` | Multi-segment bar with per-segment rounded caps | `dataset`, `total`, `barHeight`, `gap` |
| `SwipeDeck` | Card deck with pan physics and accept/reject | `dataset`, `swipeThreshold`, `onSwipeLeft/Right` |
| `ReorderList` | Long-press and drag rows into a new order | `dataset`, `itemHeight`, `onReorder` |
| `SignaturePad` | Freehand capture exported as a base64 PNG | `penColor`, `minWidth`/`maxWidth`, `onSignatureEnd` |
| `SkiaEffect` | Blend modes and blur through a per-pixel canvas | `dataset`, `blurAmount`, `blendMode`, `spread` |

Open a widget in the sidebar for its full prop table and live controls, and see
**Platform Support** for what differs on web.
