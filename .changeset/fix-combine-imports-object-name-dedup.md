---
'@kubb/ast': patch
---

Fixed `combineImports` producing duplicate object-named import specifiers.

`Set`-based deduplication failed for object import names (e.g. `{ propertyName: 'fakerDE', name: 'faker' }`) because JavaScript compares objects by reference. When the same aliased specifier appeared in multiple `ImportNode`s for the same path, the merged result contained duplicate entries.

The fix memoizes object import names inside `combineImports` so that identical `(propertyName, name)` pairs always reuse the same object reference, allowing `Set.add` to correctly recognise and skip duplicates.
