---
'@kubb/ast': patch
'@kubb/plugin-barrel': patch
'@kubb/renderer-jsx': patch
---

`SourceNode` takes the same props as `Code` and `Function`: `export` and `default`. Barrels list every source with `export`, except a `default` one. `Code` also takes `default`. `isExportable` and `isIndexable` are deprecated, and barrels still read `isIndexable` until Kubb v6.

```diff
- createSource({ name: 'Pet', isExportable: true, isIndexable: true, nodes })
+ createSource({ name: 'Pet', export: true, nodes })
```
