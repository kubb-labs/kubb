---
'@kubb/core': patch
---

Infer `output.mode` from `output.path` when a plugin does not set it. An extension means a single
file, anything else a directory.

Every plugin ships an extensionless output default (`'types'`, `'clients'`, `'zod'`, `'mocks'`),
which the old `mode` default of `'file'` then resolved to a file with no extension. Calling a
plugin with no options at all failed the run with `No extname found for types`, so `pluginTs()`,
`pluginAxios()`, `pluginZod()`, and `pluginFaker()` could not generate until every one of them was
given an explicit `output.mode: 'directory'`.

Setting `mode` still overrides the inference, and pairing `group` with `mode: 'file'` still reports
`KUBB_INVALID_PLUGIN_OPTIONS`.
