---
'@kubb/core': major
---

Remove the `'group'` output mode. `output.mode` now accepts `'directory' | 'file'`.

`'directory'` (the default) writes one file per operation or schema, and `'file'` writes everything into a single file. The per-group consolidation mode is gone.

The `group` option stays and keeps organizing `'directory'` output into per-tag or per-path subdirectories. It remains invalid with `'file'`, and pairing the two now fails the build with a `KUBB_INVALID_PLUGIN_OPTIONS` diagnostic.

Migrate any plugin set to `output.mode: 'group'` to `'directory'` (keep the `group` option for subdirectories) or `'file'` (drop the `group` option for a single file).
