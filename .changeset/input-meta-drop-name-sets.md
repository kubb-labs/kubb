---
'@kubb/ast': patch
'@kubb/adapter-oas': patch
'@kubb/core': patch
'@kubb/studio': patch
---

Remove `InputMeta.circularNames` and `InputMeta.enumNames`, so `InputMeta` only holds plain document metadata. A generator that needs either set builds it once per build with `ctx.memo`:

```ts
const schemas = ctx.driver.inputNode?.schemas ?? []
const circularNames = ctx.memo('circularNames:set', () => ast.findCircularSchemas(schemas))
const enumNames = ctx.memo('enumNames:set', () => new Set(schemas.flatMap((schema) => (schema.type === 'enum' && schema.name ? [schema.name] : []))))
```

`BannerMeta` loses both fields too. Kubb Studio now stores and sends `meta` as it is.
