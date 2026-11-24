---
'@kubb/ast': patch
---

Use the new `names` when an import or export node is spread into `createImport` or `createExport`, as in `createImport({ ...imp, names })`. Before, the deprecated `name` the spread copied over counted as an override, so the new `names` were dropped.
