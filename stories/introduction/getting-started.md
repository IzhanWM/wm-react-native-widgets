# Getting started

Standalone widgets for WaveMaker mobile apps. All eight run on **iOS, Android and web.**

## Install

```bash
npm install @wavemaker/react-native-widgets
npm install react-native-svg react-native-gesture-handler react-native-reanimated
```

## Use a widget

```tsx
import { QrCode, AvatarStack, SegmentProgress } from '@wavemaker/react-native-widgets';

<QrCode value="https://www.wavemaker.com" size={180} />
<AvatarStack dataset={members} maxVisible={4} />
<SegmentProgress dataset={segments} total={128} />
```

Three widgets need a peer of their own, so they import from a subpath:

| Widget | Import from | Also install |
| --- | --- | --- |
| SkiaEffect | `@wavemaker/react-native-widgets/skiaeffect` | `@shopify/react-native-skia` |
| SignaturePad | `@wavemaker/react-native-widgets/signaturepad` | `react-native-webview` (native only) |
| Maps | `@wavemaker/react-native-widgets/maps` | `react-native-maps`, `expo-location`; `@vis.gl/react-google-maps` for web |

Maps also needs a Google Maps API key in the host app's `react-native-maps`
config plugin, and a `webApiKey` on web.

## Binding data

`dataset` accepts an array, a JSON string, or a Studio variable wrapper
(`{ dataSet }`, `{ content }`, `{ data }`). The `*Field` props pick which columns
to read:

```tsx
<AvatarStack dataset={teamVariable} nameField="fullName" imageField="avatar" />
```

## Gestures

`SwipeDeck` and `ReorderList` need a `GestureHandlerRootView` above them, on web too:

```tsx
<GestureHandlerRootView style={{ flex: 1 }}>
  <SwipeDeck dataset={cards} onSwipeRight={accept} onSwipeLeft={reject} />
</GestureHandlerRootView>
```

## The widgets

| Widget | What it does |
| --- | --- |
| `QrCode` | Vector QR code with an optional center logo |
| `AvatarStack` | Overlapping avatars with presence dots and `+N` overflow |
| `SegmentProgress` | Multi-segment progress bar |
| `SwipeDeck` | Card deck with swipe-to-accept and swipe-to-reject |
| `ReorderList` | Drag rows into a new order |
| `SignaturePad` | Freehand signature exported as a base64 PNG |
| `SkiaEffect` | Blurred, blended color canvas |
| `Maps` | Google Maps / Apple Maps with pins and routes |

Open a widget in the sidebar for its props and live controls, and see
**Platform Support** for what differs on web.
