# @wavemaker/react-native-widgets

Seven standalone React Native UI widgets — QR code, avatar stack, segment
progress, swipe deck, reorder list, signature pad and Skia effects — that render
on **iOS, Android and web** from one import.

- **Live Storybook:** https://wavemaker.github.io/wm-react-native-widgets
- **Charts:** the ECharts-based chart components live in a separate repo,
  [`wm-react-native-echarts`](https://github.com/wavemaker/wm-react-native-echarts).

---

## Installation

```bash
npm install @wavemaker/react-native-widgets
npm install react-native-svg react-native-gesture-handler react-native-reanimated
```

Two peers are optional, each needed by exactly one widget:

```bash
npm install @shopify/react-native-skia   # SkiaEffect
npm install react-native-webview         # SignaturePad, native only
```

```tsx
import { QrCode, AvatarStack, SegmentProgress } from '@wavemaker/react-native-widgets';

<QrCode value="https://www.wavemaker.com" size={180} />
<AvatarStack dataset={members} maxVisible={4} />
<SegmentProgress dataset={segments} total={128} />
```

Widgets are also importable one at a time:

```tsx
import { QrCode } from '@wavemaker/react-native-widgets/qrcode';
```

---

## The widgets

| Widget | Description | iOS / Android | Web |
| --- | --- | :---: | :---: |
| **QR Code** | Vector QR symbol with an optional centered logo | ✅ | ✅ |
| **Avatar Stack** | Overlapping avatars, presence dots, `+N` overflow | ✅ | ✅ |
| **Segment Progress** | Multi-segment bar with per-segment rounded caps | ✅ | ✅ |
| **Swipe Deck** | Card deck with pan physics and accept/reject gestures | ✅ | ✅ |
| **Reorder List** | Long-press and drag rows into a new order | ✅ | ⚠️ |
| **Signature Pad** | Freehand capture exported as a base64 PNG | ✅ | ✅ |
| **Skia Effect** | Blend modes and blur through a per-pixel canvas | ✅ | ✅ |

Two widgets could not reach web through their native library, so each ships a
**separate web implementation** behind the same public contract — selected by
platform file extension, so the native-only dependency never enters the web
bundle:

- **Signature Pad** — `react-native-signature-canvas` needs a WebView, which
  `react-native-web` has no equivalent for. The web build captures pointer strokes
  and rasterizes them, returning the **same base64 PNG**, so pages never branch on
  platform. Stroke width is fixed on web and speed-tapered on device.
- **Skia Effect** — Skia on web needs the host app to load the CanvasKit WASM
  bundle first. The web build reproduces the composition with CSS `filter` and
  `mix-blend-mode`, which map one-to-one onto Skia's `Blur` and `blendMode`, and
  pulls in no WASM.

⚠️ **Reorder List on web**: `react-native-reorderable-list` declares no native
modules, so it runs on web and drag works — but upstream tests iOS and Android
only. Treat web drag as best-effort and keep a non-drag path for web users.

**Swipe Deck** and **Reorder List** need a `GestureHandlerRootView` above them, on
web as well as on device.

Full detail: **Introduction → Platform Support** in the
[Storybook](https://wavemaker.github.io/wm-react-native-widgets), and
[`spec/02-widgets.md`](spec/02-widgets.md).

---

## Binding data

Collection-backed widgets take a `dataset` and normalize it, so an array, a JSON
string, or a WaveMaker Studio variable wrapper (`{ dataSet }`, `{ content }`,
`{ data }`) all work. An unresolved binding renders the empty state instead of
throwing. `*Field` props say which column to read, so rows rarely need reshaping.

```tsx
<AvatarStack dataset={teamVariable} nameField="fullName" imageField="avatar" />
```

---

## Development

Work from the repository root (the directory holding `package.json`,
`components/` and `stories/`).

```bash
npm install
npm run storybook      # http://localhost:6006
npm run lint
npm run typecheck
```

Storybook runs every widget in the browser through `react-native-web`. Two
widgets are **not** in Storybook: `SwipeDeck` and `ReorderList` sit on
`react-native-reanimated` v4, which needs a worklets transform this Vite setup
has no step to run. Verify those on a device, or in a Metro/webpack build that
runs `babel-preset-expo`.

### Repository layout

```
components/<widget>/    # library source — one folder per widget
components/index.ts     # package barrel
stories/<widget>/       # Storybook stories, one folder per widget
wmx/<widget>/           # WaveMaker Studio (WMX) manifests, icons, marketplace images
scripts/                # build, packaging and image-capture scripts
spec/                   # architecture notes for humans and agents
```

---

## Building and publishing (maintainers)

```bash
npm run build:lib      # TypeScript compile → dist/npm-packages/widgets
npm run prepare:npm    # Write package.json, copy README/LICENSE, .npmignore
cd dist/npm-packages/widgets && npm publish
```

`npm run generate:package` runs both steps; the version comes from the root
`package.json`. Pushing to `main` does the same through
`.github/workflows/publish-and-storybook.yml`, which also deploys Storybook to
GitHub Pages.

WMX packages for WaveMaker Studio:

```bash
npm run generate:wmx   # zips → dist/wmx/widgets/
```

Marketplace screenshots under `wmx/<widget>/assets/images/` are captured from a
running Expo web build — see the header of `scripts/generate-widget-images.js`.

---

## Maintainers

Maintained by [WaveMaker](https://www.wavemaker.com/). Source:
[wavemaker/wm-react-native-widgets](https://github.com/wavemaker/wm-react-native-widgets).
Use [GitHub Issues](https://github.com/wavemaker/wm-react-native-widgets/issues)
for bug reports and feature requests.

---

## License

MIT — see [LICENSE](LICENSE).
