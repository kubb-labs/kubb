---
'@kubb/kit': patch
'@kubb/renderer-jsx': patch
---

Build imports with `names` instead of the deprecated `name`. `ctx.from`, `from()` and `resolver.imports()` return `ImportNode`s with `names`, and `<Schema>` passes the printer's imports to `File.Import` as `names`. The deprecated fields are still set, so code that reads `name` keeps working, and the generated output does not change.
