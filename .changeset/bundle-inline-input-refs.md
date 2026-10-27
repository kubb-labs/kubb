---
"@kubb/core": patch
"@kubb/adapter-oas": patch
"unplugin-kubb": patch
---

Resolve relative `$ref` files in inline input and parsed objects against `root`, the way a file input already does. A `$ref` to a file or URL Kubb cannot read now reports `KUBB_REF_NOT_FOUND` at the key that holds it, instead of leaving the type as `unknown`. The new `adapter.sources` lists the files and URLs the last parse read, and `generateModule` returns them, so a watcher can rebuild when a `$ref` file changes.
