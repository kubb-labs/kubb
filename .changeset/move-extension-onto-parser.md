---
'@kubb/parser-ts': major
'@kubb/parser-md': major
'@kubb/core': major
'kubb': major
'unplugin-kubb': major
---

Move import and export extension rewriting from `output.extension` onto the parser, and turn the built-in parsers into factories.

`output.extension` only ever rewrote the extensions inside `import`/`export` statements, so it now lives on `parserTs`, the parser that does the work. `parserTs`, `parserTsx`, and `parserMd` are now factory functions you call, matching the plugin convention (`pluginTs()`), and `parserTs`/`parserTsx` accept an `extension` map. The `output.extension` option and the `extname` argument to `Parser.parse` are removed.

```ts
// before
export default defineConfig({
  output: { path: './src/gen', extension: { '.ts': '.js' } },
  parsers: [parserTs, parserTsx, parserMd],
})

// after
export default defineConfig({
  output: { path: './src/gen' },
  parsers: [parserTs({ extension: { '.ts': '.js' } }), parserTsx(), parserMd()],
})
```

Custom parsers built with `defineParser` now implement `parse(file)` without the second `options` argument.
