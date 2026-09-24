# UI widgets — platform support

Every widget in `@wavemaker/react-native-widgets` except **Maps** renders on
**iOS, Android and web**. Getting there took a different strategy per widget,
because the underlying libraries do not all reach web. This page records which
strategy each one uses and what, if anything, differs on web.

## Support matrix

| Widget | Drawing layer | iOS / Android | Web | Strategy |
| --- | --- | --- | --- | --- |
| **QR Code** | `react-native-qrcode-svg` → `react-native-svg` | ✅ | ✅ | One implementation. SVG renders natively and as DOM. |
| **Avatar Stack** | Core React Native views | ✅ | ✅ | One implementation. No drawing library at all. |
| **Segment Progress** | `react-native-svg` | ✅ | ✅ | One implementation. |
| **Swipe Deck** | Gesture Handler + Reanimated | ✅ | ⚠️ | Works on web; not shown in this repo's Storybook. See the caveat below. |
| **Reorder List** | `react-native-reorderable-list` | ✅ | ⚠️ | Works on web; not shown in this repo's Storybook. See the caveat below. |
| **Signature Pad** | WebView canvas (native) | ✅ | ✅ | **Separate web implementation.** |
| **Skia Effect** | `@shopify/react-native-skia` | ✅ | ✅ | **Separate web implementation.** |
| **Maps** | `react-native-maps` → Google Maps / Apple Maps | ✅ | ❌ | Native only. Web resolves to an empty box. |

## Why Maps stops at native

`react-native-maps` is a wrapper over the Google Maps SDK and MapKit. It has no
web implementation, so importing it on web gives an unimplemented view — and
unlike the two widgets below, there is nothing to reimplement it with: a browser
map means a second library, a different API and a key of its own.

`maps.web.tsx` therefore renders the widget's box, sized by the same `height`
rules as the native file, and nothing inside it. A universal page keeps building
and keeps its layout; the map appears on device. The WMX manifest declares
`webSupport: false`, so Studio does not offer it in web preview.

## Why two widgets needed a second implementation

### Signature Pad

`react-native-signature-canvas` draws into a **WebView**, and `react-native-webview`
has no `react-native-web` build — importing it on web breaks the bundle.

`signaturepad.web.tsx` therefore captures pointer strokes with `PanResponder`,
draws them live as SVG paths, and rasterizes them to a PNG through a detached
2-D canvas on finger-up. Props, events and the imperative `ref` handle
(`clear`, `readSignature`, `isEmpty`) are identical, and **both platforms emit the
same `data:image/png;base64,…` string**, so a page never branches on platform.

The one visible difference: on device the stroke tapers between `minWidth` and
`maxWidth` with pointer speed; on web the two are averaged into a single width.

### Skia Effect

`@shopify/react-native-skia` *can* run on web, but only after the host app loads
the **CanvasKit WASM bundle** (`LoadSkiaWeb` / `WithSkiaWeb`) before first render.
A widget cannot assume its host has done that, and an unguarded import breaks any
web build that has not.

`skiaeffect.web.tsx` reproduces the same composition with CSS instead —
`filter: blur()` for the Gaussian and `mix-blend-mode` for the compositing, which
map one-to-one onto the Skia `Blur` and `blendMode` used natively. **No WASM is
pulled into the web bundle**, because the platform resolver picks the web file and
the Skia module is never imported there.

## How the split works

Both use React Native's platform file extensions:

```
signaturepad/
├── signaturepad.props.ts    # one contract, shared by both
├── signaturepad.tsx         # iOS + Android
├── signaturepad.web.tsx     # web
└── index.ts                  # imports './signaturepad' — the bundler picks
```

Because the resolver chooses the file, the platform-specific dependency is never
reached on the other platform. That is stronger than a runtime `Platform.OS`
check, which would still pull the module into every bundle.

`tsc` emits `signaturepad.web.js` alongside `signaturepad.js`, so the published
package keeps the same behavior for consumers.

## Caveats to plan around

### Swipe Deck and Reorder List are not in this repo's Storybook

Both sit on `react-native-reanimated` v4, which moved its worklet runtime into a
separate `react-native-worklets` package. `useSharedValue`, `withTiming` and
friends only work once that package's Babel or SWC "worklet" transform has run
over the code — on web as much as on device. Bundlers that run Babel with
`babel-preset-expo` (Metro, or webpack configured the same way) apply that
transform automatically, so both widgets work fine there.

**This repo's own Storybook does not**: it uses `@storybook/react-vite`, which
bundles with plain Vite/esbuild and has no Babel/SWC step for React Native
packages. Reanimated's module graph breaks apart under esbuild's dependency
pre-bundling without that transform — this reproduces a currently open upstream
issue ([reanimated#8179](https://github.com/software-mansion/react-native-reanimated/issues/8179)),
not a bug in these widgets. Their stories are excluded from this Storybook
rather than shown broken; exercise the widgets on iOS/Android, or in a web
build that runs the worklets transform, instead.

`react-native-reorderable-list` also declares no native modules of its own — it
is pure JavaScript over Reanimated and Gesture Handler — but upstream advertises
and tests **iOS and Android only**. Where it does run, treat web drag as
best-effort, and give web users a non-drag path (the `onItemPress` event, or an
explicit sort control) when ordering matters.

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

### Optional peer dependencies

`@shopify/react-native-skia` and `react-native-webview` are declared **optional**
peers. An app that uses only the QR code or avatar stack does not have to install
either; npm will not warn. Install them when you use the Skia Effect or the
native Signature Pad.
