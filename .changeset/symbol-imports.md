---
'@kubb/ast': minor
'@kubb/core': minor
'@kubb/renderer-jsx': minor
---

A generated file can import a name from another plugin without knowing where that plugin writes it. Give `File.Import` a `plugin` instead of a `path`, such as `<File.Import name={['Pet']} plugin="plugin-ts" isTypeOnly />`, and Kubb fills in the path after every generator has run. `resolver.imports({ node })` without `root` and `output` returns one import per `$ref` that names the resolver's plugin instead of a path.

When the plugin emitted the name in no file, the build reports `KUBB_SYMBOL_NOT_FOUND`. When it emitted it in several, it reports `KUBB_SYMBOL_AMBIGUOUS`. Imports with a `path` work as before. A custom `resolver.imports` now receives `root` and `output` as optional, and returns plugin imports when they are missing.
