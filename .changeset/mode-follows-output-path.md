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

Setting `mode` still overrides the inference. `group` no longer needs `mode: 'directory'` spelled
out alongside it either, the types now accept `group` whenever `mode` is omitted or `'directory'`,
and only reject an explicit `mode: 'file'`. Set `mode: 'directory'` yourself when the inference
would guess wrong, such as a directory name that carries a dot (`path: 'clients.v2'`). Pairing
`group` with a `mode` that resolves to `'file'`, explicit or inferred, still reports
`KUBB_INVALID_PLUGIN_OPTIONS`.
