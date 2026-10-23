---
'unplugin-kubb': minor
---

Strip types from imported specs with [`yuku-parser`](https://www.npmjs.com/package/yuku-parser) and [`yuku-codegen`](https://www.npmjs.com/package/yuku-codegen) instead of the TypeScript compiler, so `unplugin-kubb` no longer depends on `@typescript/typescript6`. Enums compile to the same objects `tsc` emits, including reverse mapping for numeric members.
