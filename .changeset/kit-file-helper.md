---
'@kubb/kit': patch
---

Add the `file(node, options?)` composable, also `ctx.file(node)` and `this.file(node)` in generators. It returns the `<File>` props for the file a generator writes.

- The props are `baseName`, `path`, `meta`, and the `banner` and `footer` from the plugin's `output`.
- An operation file that would land on a component schema's file gets an `Operation` suffix, when the plugin writing it has a schema generator.
- Pass `plugin` to get another plugin's file, such as the types to import. That plugin's `override` rules apply, and a missing plugin reports `KUBB_PLUGIN_NOT_FOUND`.
