---
"@kubb/core": minor
"@kubb/adapter-oas": minor
"@kubb/plugin-redoc": minor
---

`plugin-redoc` now uses `adapterOas` directly instead of depending on `plugin-oas` at runtime.

**`@kubb/core`**: Added `TDocument` as a 4th generic to `AdapterFactoryOptions` and `document?` as a first-class field on `Adapter<T>`, so any adapter can expose its raw source document in a typed way.

**`@kubb/adapter-oas`**: `AdapterOas` now carries the `Document` type as its 4th generic. The adapter exposes `document` directly (populated after `parse()`). Only `AdapterOas` is exported from the package index; use `AdapterOas['document']` to reference the document type.

**`@kubb/plugin-redoc`**: Removed the `pre: [pluginOasName]` dependency. The plugin now reads the document via `(adapter as Adapter<AdapterOas>).document`, with a name-guard that gives a clear error when `adapterOas` is not configured.
