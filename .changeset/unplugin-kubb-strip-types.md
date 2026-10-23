---
'unplugin-kubb': minor
---

Strip types from imported specs with Node's built-in `module.stripTypeScriptTypes` instead of the TypeScript compiler, so `unplugin-kubb` no longer depends on `@typescript/typescript6`. Enums still compile to runtime values. This needs Node 22.13 or later, and Node prints a one-time `ExperimentalWarning` for the API.
