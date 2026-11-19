---
'@kubb/core': minor
'@kubb/kit': minor
---

`@kubb/core` and `@kubb/kit` now export `getFile` and `getFileLocation`. In a generator, `getFile(ctx, file)` returns the `<File>` props with the banner and footer from the plugin's `output`, and `getFileLocation(ctx)` returns the `root`, `output`, and `group` to pass to `resolver.file` and `resolver.imports`.
