---
'@kubb/core': major
---

Flip the default `output.mode` from `'directory'` to `'file'`. A plugin that omits `output.mode` now writes a single file instead of one file per operation or schema, cutting generated file count and output size.

`output.mode: 'directory'` is unchanged and still writes one file per operation or schema. Set it explicitly to keep today's output shape, and pair it with `group` to organize files into per-tag or per-path subdirectories, since `group` now requires `mode: 'directory'` at the type level.

**Breaking change:** any plugin relying on the implicit `'directory'` default now needs `output.mode: 'directory'` set explicitly to avoid consolidating into a single file. A plugin combining an implicit `output.mode` with a `group` option must also add `mode: 'directory'`, since `mode: 'file'` and `group` remain mutually exclusive and fail the build with `KUBB_INVALID_PLUGIN_OPTIONS`.
