---
'kubb': minor
---

`kubb` gains bundler integration subpaths backed by `unplugin-kubb`, so most consumers never need to install `unplugin-kubb` directly: `kubb/vite`, `kubb/webpack`, `kubb/rollup`, `kubb/rolldown`, `kubb/esbuild`, `kubb/farm`, `kubb/rspack`, `kubb/astro`, and `kubb/nuxt`. Each re-exports the matching `unplugin-kubb/*` entry point.

`unplugin-kubb` stays published and importable directly. This is additive: existing `unplugin-kubb/*` imports keep working.
