---
'@kubb/parser-ts': patch
---

The `extension` docs now say each key is the extension of the generated file, which matches how `parse` reads the map. They also say `{ '.ts': '.ts' }` suits running `.ts` files directly in Node.js or compiling with `rewriteRelativeImportExtensions`. The description no longer claims the parser prints with the TypeScript compiler, since only the `print` helper uses the TypeScript printer.
