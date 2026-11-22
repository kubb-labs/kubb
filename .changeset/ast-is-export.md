---
'@kubb/ast': patch
'@kubb/plugin-barrel': patch
'@kubb/renderer-jsx': patch
---

`SourceNode` has one flag, `isExport`, for an exported declaration. Barrels list every source with `isExport`. `isExportable` and `isIndexable` are deprecated, and barrels still read `isIndexable` until Kubb v6.

```diff
- createSource({ name: 'Pet', isExportable: true, isIndexable: true, nodes })
+ createSource({ name: 'Pet', isExport: true, nodes })
```
