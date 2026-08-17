---
'@kubb/core': major
---

Turn off `output.format` and `output.lint` by default.

Earlier versions auto-detected a formatter and linter (prettier, biome, oxfmt, oxlint, eslint) and ran them after generation. Kubb now writes its own already-clean output and runs neither unless you ask for it, which cuts a step out of every build.

```ts
output: {
  path: './src/gen',
  format: 'auto', // or 'prettier' | 'biome' | 'oxfmt'
  lint: 'auto', // or 'oxlint' | 'biome' | 'eslint'
}
```

Set `format`/`lint` explicitly to keep running one, either `'auto'` to detect what your project already uses or a specific tool name.
