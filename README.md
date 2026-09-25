# @wavemaker/react-native-widgets

React Native UI widgets — QR code, avatar stack, segment
progress, swipe deck, reorder list, signature pad, maps and Skia effects. Seven
render on **iOS, Android and web** from the same code; **Maps** is native only.

- **Live Storybook:** https://izhanwm.github.io/wm-react-native-widgets

---

## Installation

```bash
npm install @wavemaker/react-native-widgets
npm install react-native-svg react-native-gesture-handler react-native-reanimated
```

Five widgets come off the package root:

```tsx
import { QrCode, AvatarStack, SegmentProgress } from '@wavemaker/react-native-widgets';

<QrCode value="https://www.wavemaker.com" size={180} />
<AvatarStack dataset={members} maxVisible={4} />
<SegmentProgress dataset={segments} total={128} />
```

The other three each pull a peer of their own, so they are reached on their own
subpath and never enter a bundle that did not ask for them:

| Widget | Import from | Also install |
| --- | --- | --- |
| SkiaEffect | `@wavemaker/react-native-widgets/skiaeffect` | `npm install @shopify/react-native-skia` |
| SignaturePad | `@wavemaker/react-native-widgets/signaturepad` | `npm install react-native-webview` — native only |
| Maps | `@wavemaker/react-native-widgets/maps` | `npx expo install react-native-maps expo-location` — native only |

Metro does not tree-shake, so importing anything from the root pulls in every
widget the root re-exports. Keeping these three off it is what makes their peers
genuinely optional — install one only if you import the widget that needs it.

Every widget is importable on its own subpath, not just those three:

```tsx
import { QrCode } from '@wavemaker/react-native-widgets/qrcode';
```

Maps needs host-app setup of its own — the `react-native-maps` config plugin with an Android Google Maps API key (and an iOS one for `provider="google"`), plus the `expo-location` plugin for `showsUserLocation`. See [MAPS.md](MAPS.md#host-app-setup).
---

## The widgets

<table>
  <tr>
    <td width="50%" align="center">
      <img src="https://raw.githubusercontent.com/IzhanWM/wm-react-native-widgets/main/wmx/qrcode/assets/images/thumbnail.png" width="420" alt="QR Code widget rendering a vector QR symbol" /><br />
      <b>QR Code</b>
    </td>
    <td width="50%" align="center">
      <img src="https://raw.githubusercontent.com/IzhanWM/wm-react-native-widgets/main/wmx/avatarstack/assets/images/thumbnail.png" width="420" alt="Avatar Stack widget with overlapping avatars and a +N overflow badge" /><br />
      <b>Avatar Stack</b>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <img src="https://raw.githubusercontent.com/IzhanWM/wm-react-native-widgets/main/wmx/segmentprogress/assets/images/thumbnail.png" width="420" alt="Segment Progress widget showing a multi-segment bar" /><br />
      <b>Segment Progress</b>
    </td>
    <td width="50%" align="center">
      <img src="https://raw.githubusercontent.com/IzhanWM/wm-react-native-widgets/main/wmx/swipedeck/assets/images/thumbnail.png" width="420" alt="Swipe Deck widget showing a stack of swipeable cards" /><br />
      <b>Swipe Deck</b>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <img src="https://raw.githubusercontent.com/IzhanWM/wm-react-native-widgets/main/wmx/reorderlist/assets/images/thumbnail.png" width="420" alt="Reorder List widget with a row lifted mid-drag" /><br />
      <b>Reorder List</b>
    </td>
    <td width="50%" align="center">
      <img src="https://raw.githubusercontent.com/IzhanWM/wm-react-native-widgets/main/wmx/signaturepad/assets/images/thumbnail.png" width="420" alt="Signature Pad widget with a freehand signature captured on the canvas" /><br />
      <b>Signature Pad</b>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <img src="https://raw.githubusercontent.com/IzhanWM/wm-react-native-widgets/main/wmx/skiaeffect/assets/images/thumbnail.png" width="420" alt="Skia Effect widget showing a blurred, blended color canvas" /><br />
      <b>Skia Effect</b>
    </td>
    <td width="50%" align="center">
      <img src="https://raw.githubusercontent.com/IzhanWM/wm-react-native-widgets/main/wmx/maps/assets/images/markers.png" width="420" alt="Maps widget showing a city map with category pins" /><br />
      <b>Maps</b> — native only
    </td>
  </tr>
</table>

| Widget | Description | iOS / Android | Web |
| --- | --- | :---: | :---: |
| **QR Code** | Vector QR symbol with an optional centered logo | ✅ | ✅ |
| **Avatar Stack** | Overlapping avatars, presence dots, `+N` overflow | ✅ | ✅ |
| **Segment Progress** | Multi-segment bar with per-segment rounded caps | ✅ | ✅ |
| **Swipe Deck** | Card deck with pan physics and accept/reject gestures | ✅ | ✅ |
| **Reorder List** | Long-press and drag rows into a new order | ✅ | ⚠️ |
| **Signature Pad** | Freehand capture exported as a base64 PNG | ✅ | ✅ |
| **Skia Effect** | Blend modes and blur through a per-pixel canvas | ✅ | ✅ |
| **Maps** | Google/Apple map with pins, routes and user location | ✅ | ❌ |

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

❌ **Maps is native only**: `react-native-maps` has no web implementation, so the widget resolves
to a web file that reserves the same box and renders nothing. A universal page
still builds; the map appears on iOS and Android only.

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
expo-app/               # device demo app consuming the built package via yalc
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
[wavemaker/wm-react-native-widgets](https://github.com/IzhanWM/wm-react-native-widgets).
Use [GitHub Issues](https://github.com/IzhanWM/wm-react-native-widgets/issues)
for bug reports and feature requests.

---

## License

MIT — see [LICENSE](LICENSE).
