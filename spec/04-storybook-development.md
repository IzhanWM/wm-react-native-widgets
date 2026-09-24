# 04 — Storybook and development

## Storybook role

Storybook is the **spec and documentation surface** for widget behavior. Stories
define expected visuals and prop combinations before or alongside implementation.
Deployed site: https://wavemaker.github.io/wm-react-native-widgets

Config: `.storybook/main.ts` (Vite + `@storybook/react-vite`).

### Key Vite aliases

| Alias | Path |
|-------|------|
| `@` | repo root |
| `@components` | `components/` |
| `@stories` | `stories/` |
| `react-native` | `react-native-web` |

Shims under `.storybook/shims/` stub RN internals missing on web
(`codegenNativeComponent`, `PressabilityDebug`). Skia is excluded from
`optimizeDeps`; `SkiaEffect` runs its `.web.tsx` implementation in Storybook.
`resolveExtensions` prefers `*.web.*`, and `optimizeDeps` loads `.js` with the
JSX loader because `react-native-qrcode-svg` ships JSX in `.js` files.

Stories glob: `stories/**/*.mdx`, `stories/**/*.stories.@(js|jsx|mjs|ts|tsx)`.

## Story folder conventions

Per widget under `stories/<widget>/`:

| File | Purpose |
|------|---------|
| `meta.tsx` | Default export Meta: `title`, `component`, `argTypes`, decorators |
| `<widget>.args.ts` | `argTypes`, built on `stories/args/widget-common.ts` |
| `<widget>.stories.tsx` | Primary "default" story |
| Subfolders | Feature slices: `appearance/`, `interaction/`, `overflow/`, `logo/`, … |

Title pattern: `UI Widgets/<Widget Name>/<Slice>`. These titles produce the story
ids that WMX `previewUrl` values point at — renaming one breaks those links.

Shared story pieces: `stories/widget-decorator.tsx` (padded container, optional
note and copy-paste source snippet) and `stories/sample-data.ts` (fixtures).
Introduction pages live in `stories/introduction/*.mdx`, plus
`stories/platform-support.mdx`, which renders `stories/platform-support.md`.

### Widgets not in Storybook

`SwipeDeck` and `ReorderList` need a Reanimated v4 worklets transform this Vite
setup has no step to run, so they have no stories. Verify them on a device or in
a Metro/webpack build that runs `babel-preset-expo`. Their props are still
documented in `wmx/<widget>/wmx.json` and their `.props.ts` JSDoc.

## Commands

| Task | Command |
|------|---------|
| Install | `npm install` (repo root) |
| Dev Storybook | `npm run storybook` → http://localhost:6006 |
| Storybook with a cold cache | `npm run storybook:clean` |
| Build static Storybook | `npm run build-storybook` |
| Deploy Storybook to Pages | `npm run deploy-storybook` (CI does this on `main`) |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |

## Native verification

There is no demo app in this repo. To exercise the native code paths of
`SignaturePad`, `SkiaEffect`, `SwipeDeck` and `ReorderList` — and `Maps`, which
runs on device only — link the built package into an Expo app:

```bash
npm install -g yalc
npm run generate:package     # publishes to yalc as a side effect
cd /path/to/your-expo-app
yalc add @wavemaker/react-native-widgets
npx expo start
```

`Maps` additionally needs `react-native-maps` and `expo-location` installed in
that app (`npx expo install react-native-maps expo-location`), the
`react-native-maps` config plugin with a Google Maps API key on Android (and on
iOS for `provider="google"`), and the `expo-location` plugin so
`showsUserLocation` can ask for the permission. The Android map can crash when
the location layer comes up without it.

Rerun `npm run generate:package` after library changes. If the app does not pick
them up after a reload, restart with `npx expo start -c`.

`scripts/generate-widget-images.js` also expects such an app: it drives an Expo
web build on `:8081` with Playwright and captures the marketplace screenshots in
`wmx/<widget>/assets/images/`. Its `WIDGETS` table names the routes and section
headings it looks for.

## Spec-based development workflow

For non-trivial features or bugs:

1. Add or update a story (or MDX) describing expected behavior.
2. Implement in `components/<widget>/`.
3. Record verification: commands run + the Storybook story id/path.

A change without a story is incomplete unless the task exempts it (typos,
spec-only docs, or a widget that has no stories by design).

## Agent verification checklist

| Scope | Action |
|-------|--------|
| Doc/spec only | Confirm `spec/*.md` line counts ≤200; no source edits |
| Component change | `npm run lint`, `npm run typecheck`, relevant story path |
| Release/docs deploy | `npm run build-storybook` |
| API surface | `npm run build:lib` |
| Platform-split widget | Storybook (web path) **and** a device build (native path) |

## Related paths quick reference

```
stories/qrcode/qrcode.stories.tsx   → UI Widgets/QR Code default
stories/introduction/               → MDX onboarding
components/qrcode/                  → implementation
wmx/qrcode/wmx.json                 → Studio manifest
```

When fixing a bug reported against a Storybook URL, parse the `path=/story/...`
segment to find the matching `stories/` file.
