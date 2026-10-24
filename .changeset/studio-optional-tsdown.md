---
'@kubb/studio': patch
---

Make `tsdown` an optional peer dependency instead of a dependency. This removes `tsdown` and `rolldown` from the install and makes `npm i kubb` about 21 MB smaller. `kubb studio snapshot` now needs `tsdown` in the project, so run `npm i -D tsdown` in CI. Without it, the command stops with an error that says so. Snapshot output is unchanged.
