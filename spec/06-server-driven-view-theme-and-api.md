# 06 — Server Driven View: theme and API

Two JSON props sit beside `spec`, so one backend can serve a whole screen:
`spec` says **what** renders, `theme` how it **looks**, `api` what it can **call**.

| File | Role |
|---|---|
| `serverdrivenview.theme.ts` | `DEFAULT_STYLE_SPEC`, merge, modes, name resolution |
| `serverdrivenview.api.ts` | Schema normalization, request building, `fetch` |

## Theme — the style spec

One JSON, every section optional, deep-merged over `DEFAULT_STYLE_SPEC`
(exported — copy it as a starting point).

```json
{
  "colors": { "brand": "#0E7C86", "primary": "brand", "surface": "#FFFDF9" },
  "space": { "lg": 18 },
  "radii": { "md": 14 },
  "fonts": { "body": "Inter-Regular" },
  "typography": { "title": { "fontSize": 20, "fontWeight": "800" } },
  "components": {
    "Button": {
      "style": { "borderRadius": "pill" },
      "labelStyle": { "letterSpacing": 0.3 },
      "variants": { "link": { "style": { "backgroundColor": "transparent" }, "labelStyle": { "color": "primary" } } }
    }
  },
  "classes": { "price": { "fontSize": 18, "fontWeight": "700", "color": "primary" } },
  "modes": { "dark": { "colors": { "surface": "#111827", "text": "#F9FAFB" } } }
}
```

| Section | Holds | Used by |
|---|---|---|
| `colors` | Roles: `primary`, `onPrimary`, `secondary`, `onSecondary`, `background`, `surface`, `surfaceVariant`, `text`, `textMuted`, `border`, `outline`, `error`, `onError`, `success`, `warning`, `info` — add any | Color keys and props |
| `space`, `radii` | `none xs sm md lg xl xxl` / `none sm md lg xl pill`, pixels | Spacing / radius keys |
| `fonts` | Family aliases (fonts the app loaded) | `fontFamily` |
| `typography` | `heading title subtitle body caption label`, `h1`–`h3` | `Text.variant`, `Heading.level` |
| `components` | Per type: `style` (root), `*Style` parts, `variants` | Every element of that type |
| `classes` | Named styles | Element prop `className` |
| `modes` | Partial style specs | `themeMode` |

**Names resolve by key.** In any style, a color key (`color`, `*Color`) takes a
`colors` name, `padding*`/`margin*`/`gap` a `space` name, `*Radius` a `radii`
name, `fontFamily` a `fonts` name. Table entries may name each other
(`"primary": "brand"`). `"16px"` reads as `16`. Unknown names pass through raw.

The same applies to element props: `style` and every `*Style` prop, `color` /
`background` / `*Color`, `gap` / `padding`, `radius`. So a spec writes
`{ "background": "surfaceVariant", "padding": "lg", "radius": "md" }`.

**Precedence**, low to high: built-in structure → `components[type]` →
`variants[props.variant]` → `className` classes → element props.

Parts per type: `Card` title/subtitle · `Badge` text · `ListItem`
image/title/subtitle/trailing/chevron · `Button` label · `TextInput`
label/input/placeholder (color only) · `Switch`, `Checkbox` label (+ `box`) ·
`Stepper` label/button/symbol/value · `ProgressBar` fill. Switch and the
checked Checkbox read `colors.primary` / `outline` / `surface` directly.

**Modes.** `themeMode` (default `light`) applies `modes[name]` over the merge;
`system` follows the device. A built-in `dark` exists, so `themeMode="dark"`
works with no theme. The root paints `colors.background` (default
`transparent`).

Host components get the resolved theme: `theme.colors`, `space`, `radii`,
`typography`, and `theme.parts('Rating', variant)` — so a style spec can style
them too.

## API — the schema

```json
{
  "baseUrl": "https://api.example.com",
  "headers": { "Authorization": { "$template": "Bearer ${$data/session/token}" } },
  "operations": {
    "listProducts": { "path": "/products", "params": { "q": { "$state": "/query" } }, "load": true, "debounce": 300, "select": "/items" },
    "addToCart": { "method": "POST", "path": "/cart/{productId}" }
  }
}
```

| Field | Meaning |
|---|---|
| `baseUrl`, `headers` | Shared; values may be expressions (`$data`, `$state`, `$api`) |
| `method` | Default `GET` |
| `path` | Joined to `baseUrl` (absolute allowed); `{name}` takes a param, URL-encoded |
| `params` | Defaults (expressions), under the caller's params |
| `load` | Fetch on mount; refetch whenever the resolved request changes |
| `debounce` | With `load`: ms to wait after the request last changed (first load is immediate) |
| `select` | Part of the response kept as `data` |

Params left after the path go to the query string for `GET`/`HEAD`/`DELETE`,
else to a JSON body. A missing path param means no request yet (a variable
still loading) — not a request with a hole in the URL.

**Calling.** An action whose name is an operation sends it:
`{ "action": "addToCart", "params": { "productId": { "$item": "id" } } }`.
Order of lookup: built-ins → `actions` prop → API operation → `onAction`.
Only listed operations are reachable; keep `api` in a trusted variable.

**Reading.** `{ "$api": "/listProducts" }` is `{ data, loading, error, status }`
— `error` is the message (`message`/`error`/`detail` field, else the status).
`$api` works in props, `${$api/…}` templates, conditions, `repeat.apiPath`
and spec `state` seeds (which fill when the response lands). A pending `load`
reads `loading: true` from the first render, so no empty-state flash.

**Settling.** Any binding may add `onSuccess` / `onError` (one binding or a
list). They run after the action settles — an API response, or a handler or
`onAction` returning a promise (immediately when nothing async is returned).
`$event` is the result, or `{ message, status, data }` on error. An `onError`-less
failure logs in development.

One request per operation is in flight; a newer one aborts the older, and
unmount aborts all. `ref.request(name, params)` runs an operation from code.

## Studio wiring

| Prop | Bind to |
|---|---|
| `theme` | An app-level variable holding the style spec — one look across pages |
| `themeMode` | `light`, or `system` once the theme has a `dark` mode |
| `api` | A variable holding the schema; tokens come in through `data` |

Stories: `UI Widgets/Server Driven View/Catalog` (`Themed`, `DarkMode`) and
`/API` (`LoadAndCall`, `RequestError`, against a mocked backend).
