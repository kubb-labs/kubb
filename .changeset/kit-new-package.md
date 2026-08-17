---
'@kubb/kit': minor
'kubb': minor
---

Add `@kubb/kit`, the authoring toolkit for plugins, generators, adapters, resolvers, and renderers, re-exporting `definePlugin`, `defineGenerator`, `createResolver`, `Resolver`, `defineParser`, `createAdapter`, `createRenderer`, `createStorage`, `Diagnostics`, `memoryStorage`, `fsStorage`, the `ast` namespace and `factory` node builders, and their companion option and hook types. `@kubb/kit/testing` holds the Vitest-backed test helpers (`createMockedPlugin`, `createMockedAdapter`, `renderGeneratorOperation`, `matchFiles`) on a separate entry point so the main import never pulls in Vitest.

`kubb` gains matching subpaths so most consumers never need to install `@kubb/kit`, `@kubb/ast`, or `@kubb/renderer-jsx` directly:

- `kubb/kit` and `kubb/kit/testing` re-export `@kubb/kit`, including the `ast` namespace and `factory` node builders
- `kubb/jsx` re-exports `@kubb/renderer-jsx` and its types, with `kubb/jsx/jsx-runtime` and `kubb/jsx/jsx-dev-runtime` for `jsxImportSource: "kubb/jsx"`
- `kubb/config` re-exports `defineConfig`, which also stays on the `kubb` root

There is no `kubb/ast` subpath. Reach the AST through the `ast` namespace on `kubb/kit`, or install `@kubb/ast` directly when you want it on its own.

`@kubb/core`, `@kubb/ast`, and `@kubb/renderer-jsx` stay published and importable directly. This is additive: existing imports keep working.
