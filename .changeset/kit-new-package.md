---
'@kubb/kit': minor
'kubb': minor
---

Add `@kubb/kit`, the authoring toolkit for plugins, generators, adapters, resolvers, and renderers, re-exporting `definePlugin`, `defineGenerator`, `createResolver`, `Resolver`, `defineParser`, `createAdapter`, `createRenderer`, `createStorage`, `Diagnostics`, `memoryStorage`, `fsStorage`, the `ast` namespace and `factory` node builders, and their companion option and hook types. `@kubb/kit/testing` holds the Vitest-backed test helpers (`createMockedPlugin`, `createMockedAdapter`, `renderGeneratorOperation`, `matchFiles`) on a separate entry point so the main import never pulls in Vitest.

`kubb` gains matching subpaths so most consumers never need to install `@kubb/kit`, `@kubb/ast`, or `@kubb/renderer-jsx` directly:

- `kubb/kit` and `kubb/kit/testing` re-export `@kubb/kit`
- `kubb/ast` re-exports everything `@kubb/ast` exports except `ast` and `factory`, which live in `kubb/kit` instead, alongside the rest of the plugin authoring toolkit
- `kubb/jsx` re-exports `@kubb/renderer-jsx` and its types, with `kubb/jsx/jsx-runtime` and `kubb/jsx/jsx-dev-runtime` for `jsxImportSource: "kubb/jsx"`
- `kubb/config` re-exports `defineConfig`, which also stays on the `kubb` root

`@kubb/core`, `@kubb/ast`, and `@kubb/renderer-jsx` stay published and importable directly. This is additive: existing imports keep working.
