---
'@kubb/parser-ts': minor
---

Drop the TypeScript compiler from `@kubb/parser-ts`, so it runs in edge runtimes such as Cloudflare Workers. `copy` templates now lift their leading `import` and `export … from` lines with a small scanner. `print` now joins printed strings.

`print` still accepts TypeScript compiler nodes, but that is deprecated: it needs `@typescript/typescript6` installed in your project. Pass strings instead before the next major.
