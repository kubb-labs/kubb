---
'@kubb/core': minor
---

Add `diagnostics.ignore` to the config, to hide warning and info diagnostics by code. Errors are never hidden.

```ts
export default defineConfig({
  diagnostics: { ignore: ['KUBB_UNSUPPORTED_FORMAT'] },
})
```
