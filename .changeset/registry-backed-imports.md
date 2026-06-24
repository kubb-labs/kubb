---
'@kubb/ast': minor
'@kubb/core': minor
---

Add registry-backed imports so a generator can import a symbol without knowing which file defines it.

An `ImportNode` can set `resolveFromExports: true` (with no `path`). During a build, `@kubb/core` collects every file's exported names into an export registry and, at the drain barrier (after all files exist), rewrites those imports to point at the file that defines each name, grouped per file and deduped. New `@kubb/ast/utils` helpers — `buildExportRegistry`, `hasDeferredImports`, and `resolveDeferredImports` — implement the resolution.

This lets consumer plugins reference a type that may live in a different file (for example a component type inlined by `@kubb/plugin-ts`) without each plugin re-deriving the source file. Files with deferred imports are held back from the streaming writer until the registry is complete, so output stays correct regardless of plugin order; unresolved names are dropped.
