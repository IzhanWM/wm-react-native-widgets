# Getting started

`@wavemaker/react-native-widgets` is a set of eight standalone React Native UI
widgets. Seven of them run on **iOS, Android and web** from the same code —
nothing in your page branches on platform. **Maps** is native only.

## Install

```bash
npm install @wavemaker/react-native-widgets
npm install react-native-svg react-native-gesture-handler react-native-reanimated
```

## Use a widget

Five widgets come off the package root:

```tsx
import { QrCode, AvatarStack, SegmentProgress } from '@wavemaker/react-native-widgets';

<QrCode value="https://www.wavemaker.com" size={180} />
<AvatarStack dataset={members} maxVisible={4} />
<SegmentProgress dataset={segments} total={128} />
```

The other three each pull a peer of their own, so they live on their own subpath
and stay out of any bundle that did not ask for them — Metro does not tree-shake,
so a root import would drag their peers in for everyone:

| Widget | Import from | Also install |
| --- | --- | --- |
| SkiaEffect | `@wavemaker/react-native-widgets/skiaeffect` | `npm install @shopify/react-native-skia` |
| SignaturePad | `@wavemaker/react-native-widgets/signaturepad` | `npm install react-native-webview` — native only |
| Maps | `@wavemaker/react-native-widgets/maps` | `npx expo install expo-maps expo-image` — native only |

Every widget is importable on its own subpath, not just those three:

```tsx
import { QrCode } from '@wavemaker/react-native-widgets/qrcode';
```

Maps also needs the `expo-maps` config plugin and an Android Google Maps API key
in the host app. Its props, events and per-platform behaviour are in

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
