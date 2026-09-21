# 03 — Build, WMX, and publish

## npm package pipeline

`components/` compiles into one publishable package,
**`@wavemaker/react-native-widgets`**. Platform variants compile to `*.web.js`
beside their native sibling, so the published package keeps the same
per-platform resolution the source has.

| Script | Command | Output |
|--------|---------|--------|
| Compile library | `npm run build:lib` | `dist/npm-packages/widgets/` via `tsc -p tsconfig.lib.json` |
| Prepare package.json | `npm run prepare:npm` | Writes `package.json`, copies README/LICENSE into dist |
| Both | `npm run generate:package` | `build:lib` + `prepare:npm` |
| Publish | `npm run publish:npm` | Only when explicitly authorized; runs publish in dist |

### tsconfig.lib.json

`rootDir` is `components`, so every widget folder lands flat at the package root —
no `components/` prefix — giving subpath imports like
`@wavemaker/react-native-widgets/qrcode`. `components/index.ts` becomes the
package entrypoint.

- `outDir`: `dist/npm-packages/widgets`
- `declaration` / `declarationMap`: true
- Excludes: `wmx/**`, stories, tests

### prepare-npm-package.js

- Reads root `package.json` for name, version and metadata.
- Declares runtime deps (`react-native-qrcode-svg`, `react-native-reorderable-list`,
  `react-native-signature-canvas`) as `dependencies`.
- Declares `react-native-svg`, `react-native-gesture-handler` and
  `react-native-reanimated` as peers, plus `@shopify/react-native-skia` and
  `react-native-webview` as **optional** peers (one widget each).
- Copies README and LICENSE, writes `.npmignore`, sets `files` for npm pack.
- Publishes to `yalc` when it is on `PATH`, for linking into a local app.

**Agents:** do not run `publish:npm` unless the task authorizes a release and
credentials exist.

## CI

`.github/workflows/publish-and-storybook.yml` runs on every push to `main`:
`npm run generate:package` then `npm publish --provenance` from
`dist/npm-packages/widgets`, and a static Storybook build deployed to GitHub
Pages. Publishing needs the `NPM_TOKEN` secret; Pages must have "GitHub Actions"
as its source.

## WMX widget pipeline

| Script | Command | Output |
|--------|---------|--------|
| Generate zips | `npm run generate:wmx` | `dist/wmx/widgets/*.zip` (default) |

Script: `scripts/generate-wmx.js`

1. Walks `wmx/**/wmx.json` and `components/**/wmx.json`.
2. Splits the flat manifest into npm `package.json` fields vs WMX body
   (see `PACKAGE_JSON_KEYS` / `WMX_BODY_KEYS` in the script).
3. Bundles `index.tsx`, `icon.svg` and the generated manifests into a zip per widget.
4. Optional `--o=<dir>` copies the zips elsewhere.

Schema reference: `components/wmx-context.md`.

### wmx.json contents

- Identity: `name`, `displayName`, `description`, `iconUrl`, `webSupport`
- `props`, `events`, `styles` maps for WaveMaker Studio
- `dependencies` pinning the `@wavemaker/react-native-widgets` version
- `marketplace` carousel/thumbnail entries, with `previewUrl` Storybook deep links
- `group`, e.g. `ui-widgets/avatarstack`

`group` and the `ui-widgets/*` keywords are Studio-facing taxonomy, not repo
paths — they stayed as they were when the widgets moved into this repo, so
existing Studio installs keep resolving.

`previewUrl` values encode Storybook story ids (`?path=/story/ui-widgets-qr-code--default`),
so renaming a story title breaks them. `SwipeDeck` and `ReorderList` have no
stories (see `spec/02-widgets.md`), so their `previewUrl` values are aspirational.

### wmx index.tsx

A thin re-export from the built package subpath:

```tsx
import { AvatarStack } from '@wavemaker/react-native-widgets/avatarstack';
export default AvatarStack;
```

Studio consumes the zip; the runtime app depends on the npm library.

## dist/ layout

```
dist/
├── npm-packages/widgets/   # publishable @wavemaker/react-native-widgets
└── wmx/widgets/            # *.zip per widget
```

## Version alignment

1. Root `package.json` `version`.
2. Each `wmx/<widget>/wmx.json` `version` and
   `dependencies['@wavemaker/react-native-widgets']`.
3. Regenerate the WMX zips after a bump.

## Scripts directory

| File | Role |
|------|------|
| `build-lib.js` | Clean dist, run `tsc -p tsconfig.lib.json` |
| `prepare-npm-package.js` | npm metadata, README/LICENSE, `.npmignore`, yalc |
| `generate-wmx.js` | WMX zip generation |
| `generate-widget-images.js` | Playwright capture of marketplace screenshots |

## Security

Never commit npm tokens, `.npmrc` auth, or customer data.
