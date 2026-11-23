---
'@kubb/core': patch
'@kubb/kit': patch
---

Write a single `FileNode` that a generator returns, so an AST generator no longer has to wrap one file in a list.

```diff
 schema(node, ctx) {
-  return [ast.factory.createFile({ ...ctx.file(node), sources })]
+  return ast.factory.createFile({ ...ctx.file(node), sources })
 },
```
