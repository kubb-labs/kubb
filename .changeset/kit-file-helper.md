---
'@kubb/kit': patch
---

Add the `file(node, options?)` composable, also `ctx.file(node)`, which returns the `<File>` props for the file a generator writes.

- Returns `baseName`, `path`, `meta`, and the `banner` and `footer` from the plugin's `output`.
- Adds an `Operation` suffix when an operation file would land on a schema file of a plugin with a schema generator.
- Pass `plugin` to get another plugin's file. A missing plugin reports `KUBB_PLUGIN_NOT_FOUND`.
