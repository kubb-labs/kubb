---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
'@kubb/cli': patch
'@kubb/core': patch
'@kubb/kit': patch
'kubb': patch
'@kubb/mcp': patch
'@kubb/parser-md': patch
'@kubb/parser-ts': patch
'@kubb/plugin-barrel': patch
'@kubb/renderer-jsx': patch
'@kubb/studio': patch
'unplugin-kubb': patch
---

Ship separate CommonJS type declarations, so `require` consumers get correct types under `moduleResolution: node16` and `nodenext`.

- Points the `require` condition at new `.d.cts` files. It used to reuse the ESM `.d.ts`, which TypeScript then read as ESM.
- Removes the untyped `rolldown-runtime` import from the published declarations, which failed under `skipLibCheck: false`.
- Adds `typesVersions` for the `kubb`, `@kubb/kit/testing`, and `@kubb/studio/protocol` subpaths, so `moduleResolution: node10` finds them.
- Declares `vitest` as an optional peer of `@kubb/core`, `@kubb/kit`, and `kubb`, so `@kubb/core/mocks` and `@kubb/kit/testing` resolve under strict installers.
