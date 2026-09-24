# 02 — The widgets

| Widget | Folder | Drawing layer |
|---|---|---|
| `QrCode` | `qrcode/` | `react-native-qrcode-svg` → `react-native-svg` |
| `AvatarStack` | `avatarstack/` | Core React Native views |
| `SegmentProgress` | `segmentprogress/` | `react-native-svg` |
| `SwipeDeck` | `swipedeck/` | Gesture Handler + Reanimated |
| `ReorderList` | `reorderlist/` | `react-native-reorderable-list` |
| `SignaturePad` | `signaturepad/` | WebView canvas (native) / SVG + canvas (web) |
| `SkiaEffect` | `skiaeffect/` | `@shopify/react-native-skia` / CSS (web) |
| `Maps` | `maps/` | `react-native-maps` — Google Maps (Android) / Apple Maps or Google Maps (iOS), `expo-location` for the location permission |

## Folder convention

Widgets are not themed by a provider and size themselves from props or their
parent, so there are no theme or container HOCs:

```
components/<widget>/
├── <widget>.props.ts    # public TypeScript API — source of truth for wmx.json
├── <widget>.tsx         # implementation
├── <widget>.web.tsx     # web implementation, only where one is needed
└── index.ts             # exports
```

Shared pieces:

| File | Role |
|---|---|
| `utils/dataset.ts` | `toRows`, `rowField`, `rowKey` — Studio dataset normalization |
| `widget-props/common.ts` | `CommonWidgetProps`, `DatasetWidgetProps` |
| `index.ts` | Barrel re-exporting every widget |

## Dataset normalization

Studio binds `dataset` from a variable, a live variable, or a static JSON string,
so `toRows` accepts an array, a JSON string, or a `{ dataSet }` / `{ content }` /
`{ data }` wrapper, and returns `[]` for anything else. It never throws — a widget
bound to a not-yet-resolved variable renders its empty state. Every dataset-backed
widget funnels its `dataset` prop through it.

## Platform strategy

Five widgets are one implementation on all three platforms. Three are not, and all
three use **platform file extensions** rather than a runtime `Platform.OS` branch —
the bundler picks the file, so the platform-specific dependency never enters the
other bundle at all.

| Widget | Why web differs | Web implementation |
|---|---|---|
| `SignaturePad` | `react-native-signature-canvas` needs a WebView; `react-native-webview` has no web build | `PanResponder` + SVG strokes, rasterized to PNG via a detached 2-D canvas |
| `SkiaEffect` | Skia on web needs the host to load the CanvasKit WASM bundle first | CSS `filter: blur()` + `mix-blend-mode`, which map one-to-one onto Skia's `Blur` and `blendMode` |
| `Maps` | `react-native-maps` wraps the Google and Apple native SDKs and has no web implementation | None — the box is reserved and left empty, and the manifest declares `webSupport: false` |

Both keep the same props, events and `ref` handle. `SignaturePad` returns the same
`data:image/png;base64,…` string on both, so consumer code never branches.

Known differences, documented in the props JSDoc and the manifests:

- `SignaturePad` on web uses one stroke width (the mean of `minWidth`/`maxWidth`);
  native tapers with pointer speed.
- `Maps` renders nothing on web. There is no browser fallback worth shipping (a
  web map means a second library and an API key), so the web file only keeps the
  bundle building and the layout stable.
- `ReorderList` runs on web — `react-native-reorderable-list` declares no native
  modules — but upstream tests iOS and Android only. Best-effort on web.

`SwipeDeck` and `ReorderList` require a `GestureHandlerRootView` above them on
every platform, including web. Both also sit on `react-native-reanimated` v4,
which needs a Babel/SWC worklets transform this repo's Vite-based Storybook has
no step to run, so their stories are excluded from Storybook rather than shown
broken — exercise them on iOS/Android, or in a web build that runs Babel with
`babel-preset-expo` (Metro or webpack configured the same way).

## WMX widgets

`wmx/<name>/` carries `wmx.json`, a thin `index.tsx`, and `icon.svg` — a flat
manifest the generator discovers by walking for `wmx.json`. Studio names are
prefixed `WMUI` (`WMUIQrCode`, `WMUISwipeDeck`, …); zips land in
`dist/wmx/widgets/`.

Icons are 24×24 viewBox, `#bfbfbf` strokes, transparent background. Marketplace
images under `wmx/<name>/assets/images/` are captured by
`scripts/generate-widget-images.js` against a running Expo web build.

## Adding a widget (checklist)

1. Add `components/<name>/` with props, implementation, `index.ts`.
2. Add a `<name>.web.tsx` **only** if a dependency cannot reach web — and keep the
   public contract identical.
3. Extend `components/index.ts`.
4. Add `stories/<name>/` with `meta.tsx`, `<name>.args.ts`, a base story, and
   feature-slice subfolders.
5. Add `wmx/<name>/` with `wmx.json`, `index.tsx`, `icon.svg`.
6. Update the tables in this file, the README, and `stories/platform-support.md`.
7. Run `npm run lint`, `npm run typecheck`, `npm run build:lib`, and spot-check
   the story.

## Verification

| Change type | Minimum verification |
|---|---|
| Widget logic | `npm run lint`, `npm run build:lib` |
| Public API/types | `build:lib` + inspect `dist/npm-packages/widgets/*.d.ts` |
| Platform split | Storybook (web path) **and** a device build (native path) |
| WMX manifest | `npm run generate:wmx`, confirm the zip appears |
