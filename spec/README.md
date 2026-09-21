# wm-react-native-widgets — project spec

Documentation for agents and humans who need to understand this repository
**without reading every source file**. These files describe architecture,
conventions, and where to change behavior. They are **not** automated tests.

## How to use this spec

1. [01-overview.md](./01-overview.md) — purpose, stack, repo layout.
2. [02-widgets.md](./02-widgets.md) — the widgets, folder convention, platform split, adding one.
3. [03-build-wmx-publish.md](./03-build-wmx-publish.md) — npm and WMX packaging.
4. [04-storybook-development.md](./04-storybook-development.md) — stories, commands, verification.

## File index

| File | Topics | Max lines |
|------|--------|-----------|
| [01-overview.md](./01-overview.md) | Product, dependencies, directory map | ≤200 |
| [02-widgets.md](./02-widgets.md) | Widgets, dataset normalization, platform split, WMX | ≤200 |
| [03-build-wmx-publish.md](./03-build-wmx-publish.md) | `build:lib`, WMX zips, npm | ≤200 |
| [04-storybook-development.md](./04-storybook-development.md) | Stories, commands, verification | ≤200 |

## Constraints for agents

- Published package name: `@wavemaker/react-native-widgets`.
- Library source root: `components/` — one folder per widget, compiled into
  `dist/npm-packages/widgets/`.
- No chart code lives here. The ECharts charts are a separate repo,
  [`wm-react-native-echarts`](https://github.com/wavemaker/wm-react-native-echarts);
  neither repo imports the other.
- Prefer **spec-based development**: add or update a Storybook story first, then
  implement.
- Do not run `publish:npm` unless the task authorizes a release.

## Related human docs

- Root [README.md](../README.md) — install, widget table, maintainer build steps.
- [components/wmx-context.md](../components/wmx-context.md) — WMX JSON schema field reference.
- [stories/platform-support.md](../stories/platform-support.md) — per-platform behavior, rendered in Storybook.
- Live Storybook: https://wavemaker.github.io/wm-react-native-widgets
