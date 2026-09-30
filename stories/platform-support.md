# UI widgets — platform support

Every widget in `@wavemaker/react-native-widgets` renders on
**iOS, Android and web**. This page records which
strategy each one uses and what, if anything, differs on web.

## Support matrix

| Widget | Drawing layer | iOS / Android | Web | Strategy |
| --- | --- | --- | --- | --- |
| **QR Code** | `react-native-qrcode-svg` → `react-native-svg` | ✅ | ✅ | One implementation. SVG renders natively and as DOM. |
| **Avatar Stack** | Core React Native views | ✅ | ✅ | One implementation. No drawing library at all. |
| **Segment Progress** | `react-native-svg` | ✅ | ✅ | One implementation. |
| **Swipe Deck** | Gesture Handler + Reanimated | ✅ | ✅ | One implementation. Needs a `GestureHandlerRootView` ancestor. |
| **Reorder List** | `react-native-reorderable-list` | ✅ | ⚠️ | One implementation. Web drag is best-effort; see the caveat below. |
| **Signature Pad** | WebView canvas (native) | ✅ | ✅ | **Separate web implementation.** |
| **Skia Effect** | `@shopify/react-native-skia` | ✅ | ✅ | **Separate web implementation.** |
| **Maps** | `react-native-maps` → Google Maps / Apple Maps | ✅ | ✅ | **Separate web implementation** on the Google Maps JavaScript API. Needs a web key. |

A separate web implementation keeps the same props, events and payloads, so a
page never branches on platform.

## Why three widgets needed a second implementation

### Signature Pad

`react-native-signature-canvas` draws into a **WebView**, which has no web
build. On web the pad captures pointer strokes and rasterizes them itself. The
imperative `ref` handle (`clear`, `readSignature`, `isEmpty`) is identical, and
**both platforms emit the same `data:image/png;base64,…` string**.

The one visible difference: on device the stroke tapers between `minWidth` and
`maxWidth` with pointer speed; on web the two are averaged into a single width.

### Maps

`react-native-maps` wraps the Google Maps SDK and MapKit and has no web version.
On web the widget renders Google Maps through the **Maps JavaScript API** — the
same map Android renders, so tiles, map types, `customMapStyle` and zoom levels
match device.

The browser map needs a key of its own, `webApiKey`, restricted to your domains.
Without one the widget reserves its box at the same `height` and leaves it
empty, so a universal page keeps its layout.

### Skia Effect

`@shopify/react-native-skia` *can* run on web, but only after the host app loads
the **CanvasKit WASM bundle** (`LoadSkiaWeb` / `WithSkiaWeb`) before first render,
and a widget cannot assume its host has done that.

On web the widget reproduces the same composition with CSS instead —
`filter: blur()` for the blur and `mix-blend-mode` for the compositing, which map
one-to-one onto the Skia `Blur` and `blendMode` used natively. **No WASM is
pulled into the web bundle.**

## Caveats to plan around

### Gesture Handler root view

**Swipe Deck** and **Reorder List** need a `GestureHandlerRootView` above them —
on web as much as on device:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

<GestureHandlerRootView style={{ flex: 1 }}>
  <SwipeDeck dataset={cards} />
</GestureHandlerRootView>
```

Without it the pan recogniser never activates and the deck simply will not move.
Both also rely on Reanimated's worklets Babel plugin, which Metro and webpack
with `babel-preset-expo` apply automatically.

### Reorder List on web

`react-native-reorderable-list` is pure JavaScript over Reanimated and Gesture
Handler, but upstream tests **iOS and Android only**. Treat web drag as
best-effort, and give web users a non-drag path (the `onItemPress` event, or an
explicit sort control) when ordering matters.

### Optional peer dependencies

`@shopify/react-native-skia`, `react-native-webview`, `react-native-maps`,
`expo-location` and `@vis.gl/react-google-maps` are declared **optional** peers.
An app that uses only the QR code or avatar stack does not have to install any of
them; npm will not warn. Install them when you use the Skia Effect, the native
Signature Pad, or Maps — `@vis.gl/react-google-maps` only if the app builds for web.
