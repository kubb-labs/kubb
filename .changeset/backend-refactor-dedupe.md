---
"@kubb/core": patch
"@kubb/ast": patch
"@kubb/cli": patch
"@kubb/parser-ts": patch
"@internals/utils": patch
---

Internal cleanup: dedupe backend code and drop unused exports.

- `@kubb/parser-ts`: add `src/constants.ts` (regex + path-prefix literals); dedupe `printFunction`/`printArrowFunction` via `formatGenerics` / `formatReturnType`; dedupe the import/export path resolution inside `parserTs.parse` into `resolveOutputPath`.
- `@kubb/core`: collapse `FileManager#add` and `FileManager#upsert` onto a shared private `#store` helper (`mergeFilesByPath`); drop unused `DEFAULT_CONCURRENCY` / `PATH_SEPARATORS` constants.
- `@kubb/ast`: drop unused `parameterLocations` and `DEFAULT_STATUS_CODE` constants.
- `@kubb/cli`: remove unreferenced `GENERATE_FLAGS` / `VALIDATE_FLAGS` / `INIT_FLAGS` / `AGENT_START_FLAGS` / `ARGS` sets; rename `QUITE_FLAGS` → `QUIET_FLAGS`.
- `@internals/utils`: un-export internal `randomColors` constant (only used by `randomCliColor`).
- Tests: extract `createSetupCtxStub` in `definePlugin.test.ts` to kill three copies of the same setup-ctx literal.
