---
'kubb': patch
'@kubb/adapter-oas': patch
'@kubb/cli': patch
'@kubb/core': patch
'@kubb/kit': patch
'@kubb/mcp': patch
'@kubb/parser-md': patch
'@kubb/parser-ts': patch
'@kubb/plugin-barrel': patch
'@kubb/renderer-jsx': patch
'@kubb/studio': patch
'unplugin-kubb': patch
---

Publish internal `@kubb/*` dependencies with exact versions, so every package from one release resolves to that release. A lockfile refresh no longer mixes `kubb@5.20.1` with a newer `@kubb/core` or `@kubb/ast` and fails with `KUBB_ADAPTER_FAILED`.

`@kubb/kit`, `@kubb/parser-ts` and `@kubb/renderer-jsx` now list `@kubb/core` and `@kubb/ast` as peer dependencies with `^5.0.0`. A plugin that pulls in a newer one of these reuses the project's `@kubb/core` and `@kubb/ast` instead of installing a second copy. `kubb` installs `@kubb/ast` with the same exact version as `@kubb/core`.
