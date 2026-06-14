---
"@kubb/ast": patch
---

Reorganize the `@kubb/ast` utils layer into concern-based modules. The grab-bag `utils/ast.ts` and `utils/index.ts` files now split into `strings.ts`, `codegen.ts`, `refs.ts`, `schemaGraph.ts`, `operationParams.ts`, and `fileMerge.ts`, each with its tests alongside it. `utils/index.ts` stays a thin barrel, so `@kubb/ast`, `@kubb/ast/factory`, `@kubb/ast/types`, and `@kubb/ast/utils` export the same names with the same behavior. No public API changes.
