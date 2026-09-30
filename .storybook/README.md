# Storybook configuration

Storybook is the development surface for this repo: every widget is exercised in
the browser through `react-native-web`, with no simulator in the loop.

## Commands

```bash
npm install
npm run storybook        # http://localhost:6006
npm run build-storybook  # static build into storybook-static/
```

## Files

- `main.ts` — stories glob, addons, and the Vite config that maps `react-native`
  to `react-native-web` and prefers `*.web.*` files.
- `preview.tsx` — global parameters and the sidebar ordering.
- `preview.css` — page-level styling for the preview iframe.
- `shims/` — stand-ins for React Native internals that `react-native-web` does
  not ship (`codegenNativeComponent`, `PressabilityDebug`).

## Writing stories

Stories live under `stories/<widget>/`, not next to the component:

```
stories/<widget>/
├── meta.tsx                     # title, component, argTypes, decorators
├── <widget>.args.ts             # argTypes, built on stories/args/widget-common.ts
├── <widget>.stories.tsx         # the default story
└── <slice>/<widget>.<slice>.stories.tsx   # one folder per feature slice
```

Titles are `UI Widgets/<Widget Name>/<Slice>`, which is what the `previewUrl`
values in the WMX manifests point at — renaming a title breaks those links.

## Reanimated worklets

`SwipeDeck` and `ReorderList` sit on `react-native-reanimated` v4, whose worklets
need the `react-native-worklets` Babel plugin. Vite has no Babel step, so
`main.ts` runs it on the files matched by `WORKLET_SOURCES` — once in an esbuild
plugin for dev pre-bundling, once as a Vite `transform` for everything else.
Add a new worklet widget to that pattern, and restart with
`npm run storybook:clean` after changing it. See `spec/04-storybook-development.md`.
