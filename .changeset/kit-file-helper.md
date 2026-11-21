---
'@kubb/kit': patch
---

Add the `file(node, options?)` composable, also on the generator context as `ctx.file(node)` and `this.file(node)`. It returns the `<File>` props for the file a generator writes: `baseName`, `path`, `meta`, and the `banner` and `footer` from the plugin's `output`. An operation file that would land on a component schema's file gets an `Operation` suffix. Pass `plugin` to get another plugin's file, such as the types to import.
