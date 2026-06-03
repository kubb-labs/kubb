---
'@kubb/core': patch
'@kubb/cli': patch
'@kubb/adapter-oas': patch
'@kubb/agent': patch
---

Fix diagnostic reporting regressions found in review.

- `resolveRef` now throws a `DiagnosticError` when a `$ref` cannot be resolved outside a build scope, instead of silently returning `null`. Inside a build it still collects the diagnostic and keeps parsing.
- Plugin-reported problems (`ctx.error`/`ctx.warn`/`ctx.info`) and formatter/linter/`done`-hook failures no longer render twice. The generator context only collects diagnostics now, and the host renders each once after the build.
- `schemaDiagnostics` builds correct RFC 6901 pointers: property names are escaped (`~`→`~0`, `/`→`~1`), and tuple items and `oneOf`/`anyOf`/`allOf` members are indexed, so distinct advisory diagnostics are no longer dropped by the dedupe.
- `kubb generate --reporter json` emits one top-level JSON array for the whole run (aggregated on `kubb:lifecycle:end`), so multi-config runs stay valid JSON.
- `config.reporters` from `kubb.config.ts` is honored again: `--reporter` no longer defaults to `cli`, so it only overrides the config when passed.
- The agent forwards `diagnostics`, `status`, `hrStart`, and `filesCreated` on `kubb:generation:end`, so the generation summary reaches connected clients again.
- The OAS adapter caches its parsed document, schemas, and prescan per source and per document instead of once per instance. Reusing one `adapterOas()` instance across a `defineConfig` array (configs that spread a shared `baseConfig`) now parses each config's spec instead of replaying the first, so every config generates its own files and reports its own file count.
