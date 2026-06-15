---
'@kubb/ast': patch
---

Fix the CJS build dropping re-export-only `@kubb/ast/utils` helpers.

With `"sideEffects": false`, rolldown tree-shook the modules that the `utils` subpath only re-exports (`schemaGraph`, `operationParams`, `codegen`, `strings`, and friends) out of the multi-entry CJS bundle, while still emitting their export getters. Requiring `@kubb/ast/utils` from a CommonJS context then threw `findCircularSchemas is not defined` (and the same for `createOperationParams`, `containsCircularRef`, `caseParams`, `buildJSDoc`, and the rest). The ESM build was unaffected, so this only surfaced for CJS consumers such as a `kubb.config.cjs`. Dropping the `sideEffects` declaration keeps those modules in the CJS output.
