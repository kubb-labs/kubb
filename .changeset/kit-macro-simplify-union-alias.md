---
'@kubb/kit': patch
---

Keep `macroSimplifyUnion` as a deprecated alias of `macroDedupeUnion`. A plugin built before the rename in 5.16, such as `@kubb/plugin-axios` 5.12, imports the old name and crashed with `Cannot read properties of undefined (reading 'input')` in `composeMacros`. Update the import to `macroDedupeUnion`; the alias goes away in the next major.
