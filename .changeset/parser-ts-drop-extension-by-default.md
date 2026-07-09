---
'@kubb/parser-ts': major
---

Drop the source extension from generated `import`/`export` statements by default.

`parserTs` and `parserTsx` kept the source extension (`{ '.ts': '.ts' }`) by default since the beta.91 release. That matches Node16/NodeNext module resolution, but breaks bundler-based consumers that never expect an extension on a relative import. The default is now `{ '.ts': '' }`, so `import './client'` replaces `import './client.ts'` unless you set `extension` yourself.

```ts
// before (default)
export default defineConfig({
  parsers: [parserTs(), parserTsx()],
})
// import './client.ts'

// after (default)
export default defineConfig({
  parsers: [parserTs(), parserTsx()],
})
// import './client'

// keep the extension (Node16/NodeNext resolution)
export default defineConfig({
  parsers: [parserTs({ extension: { '.ts': '.ts' } }), parserTsx({ extension: { '.ts': '.ts' } })],
})
```
