# 01 — Overview

`@wavemaker/react-native-widgets` is a library of seven standalone React Native
UI widgets that render on **iOS, Android and web**. 

Each widget is published as a flat subpath of one package
(`@wavemaker/react-native-widgets/qrcode`, `.../avatarstack`, …) and re-exported
from the package barrel, and each also ships a **WMX** package so WaveMaker
Studio can drop it onto a page.

## Stack

| Layer | Choice |
|---|---|
| Runtime | React Native (+ `react-native-web` for the browser) |
| Language | TypeScript, `strict` |
| Docs / dev surface | Storybook 10 on `@storybook/react-vite` |
| Drawing | `react-native-svg`, `@shopify/react-native-skia`, core RN views |
| Gestures | `react-native-gesture-handler` + `react-native-reanimated` v4 |

## Dependencies

Shipped as **runtime dependencies** of the published package:
`react-native-qrcode-svg`, `react-native-reorderable-list`,
`react-native-signature-canvas`.

Left to the host app as **peers**: `react`, `react-native`, `react-native-svg`,
`react-native-gesture-handler`, `react-native-reanimated`, plus the ones marked
**optional** because a single widget needs them —
`@shopify/react-native-skia` (`SkiaEffect`), `react-native-webview`
(native `SignaturePad`), and `react-native-maps` + `expo-location` (`Maps`).

## Directory map

```
components/
├── <widget>/                 # one folder per widget: props, implementation, index
├── utils/dataset.ts          # toRows, rowField, rowKey — dataset normalization
├── widget-props/common.ts    # CommonWidgetProps, DatasetWidgetProps
├── index.ts                  # package barrel
└── wmx-context.md            # WMX JSON schema reference
stories/
├── <widget>/                 # stories, one folder per widget
├── args/widget-common.ts     # argTypes shared by every widget
├── introduction/             # MDX onboarding pages
├── sample-data.ts            # shared story fixtures
├── widget-decorator.tsx      # padded container + optional source snippet
└── platform-support.md       # per-platform behavior (rendered as an MDX page)
wmx/<widget>/                 # wmx.json, index.tsx, icon.svg, assets/images/
scripts/                      # build, packaging, screenshot capture
.storybook/                   # Storybook + Vite config and RN web shims
spec/                         # this documentation
```

`dist/` is build output and is not committed.

## Versioning

One version line for all seven widgets, sourced from the root `package.json`.
Each `wmx/<widget>/wmx.json` pins the same version in its
`dependencies['@wavemaker/react-native-widgets']` — bump both, then regenerate
the WMX zips.
