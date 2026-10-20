---
'@kubb/core': patch
'@kubb/studio': patch
---

Make Kubb Studio generate the same code from editor drafts as from the saved `kubb.config.ts`.

- Keep an adapter's raw options on `adapter.options`, so derived defaults like `emptySchemaType` follow a changed `unknownType`.
- Accept removing an option the config does not set.
- Report diagnostics from plugins that load their own `@kubb/core` copy.
- Fix the `reading 'split'` crash for an SDK class with `group: path`.
- Comment a plugin out of a one-line `plugins` array.
