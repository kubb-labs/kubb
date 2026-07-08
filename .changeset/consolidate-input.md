---
'@kubb/core': major
'kubb': major
'@kubb/cli': minor
'@kubb/mcp': minor
'@kubb/adapter-oas': patch
---

Merge `input.path` and `input.data` into a single `input`.

Pass `input` a file path, a URL, an inline spec (JSON or YAML string), or a parsed object, and Kubb picks the right one. The `{ path }` and `{ data }` object forms are gone.

```diff
export default defineConfig({
-  input: { path: './petStore.yaml' },
+  input: './petStore.yaml',
  output: { path: './src/gen' },
})
```
