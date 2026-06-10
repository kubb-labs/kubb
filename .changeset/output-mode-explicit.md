---
'@kubb/core': major
---

Add an explicit `output.mode` option and remove the implicit single-file detection.

A plugin's `output` now takes `mode: 'directory' | 'group' | 'file'`:

- `'directory'` (default) writes one file per operation or schema, the previous default behavior.
- `'group'` writes one file per resolved group and requires the plugin's `group` option.
- `'file'` writes everything into a single file. When `path` has no extension the default `.ts` is appended (`'types'` becomes `'types.ts'`).

Kubb no longer guesses the mode from the `output.path` extension. Set `output.mode: 'file'` to get a single file where you previously relied on a `path` ending in `.ts`.

Removed `getMode`, the `KubbDriver.getMode` static, the generator context `ctx.getMode`, and the `pathMode` field on `ResolverPathParams`. Added the `OutputMode` and `OutputOptions` types, where `OutputOptions` couples `output.mode: 'group'` with a required `group` option at the type level. A plugin configured with `output.mode: 'group'` but no `group` now fails the build with a `KUBB_INVALID_PLUGIN_OPTIONS` diagnostic.
