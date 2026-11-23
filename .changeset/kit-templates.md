---
'@kubb/kit': patch
---

Add `defineTemplate` and `addTemplate`, so a plugin writes its files with one plain value per node kind: `'Schema'`, `'Operation'` or `'Operations'`.

- Types the node `render` gets from `kind`, and renders JSX with `jsxRenderer` unless `addTemplate(template, { renderer })` names another.
- Deprecates `defineGenerator`, `addGenerator` and the `Generator` type. Kit runs each generator as one template per method, so existing generators keep working.

```diff
-addGenerator(defineGenerator({ name: 'zod', schema(node, ctx) { … } }))
+addTemplate(defineTemplate({ kind: 'Schema', render(node, ctx) { … } }))
```
