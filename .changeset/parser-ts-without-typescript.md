---
'@kubb/parser-ts': minor
---

Drop the TypeScript compiler from `@kubb/parser-ts`, so it runs in edge runtimes such as Cloudflare Workers. `copy` templates now lift their leading `import` and `export … from` lines with a small scanner. `print` now joins printed strings.

`print` still accepts TypeScript compiler nodes, but that is deprecated: install `@typescript/typescript6` yourself, now an optional peer dependency, and pass strings instead before the next major.
