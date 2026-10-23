---
'@kubb/parser-ts': minor
---

Drop the TypeScript compiler from `@kubb/parser-ts`, so it runs in edge runtimes such as Cloudflare Workers. `copy` templates now lift their `import` and `export … from` declarations with [`yuku-parser`](https://www.npmjs.com/package/yuku-parser), a native parser that skips its native core in browser and edge builds. `print` now joins printed strings.

`print` still accepts TypeScript compiler nodes, but that is deprecated: it needs `@typescript/typescript6` installed in your project. Pass strings instead before the next major.
