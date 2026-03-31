---
"@kubb/plugin-client": patch
---

Fix unused variable when `paramsCasing` is set with `urlType: 'export'`.

When a path parameter contained an underscore (e.g. `item_id`) and `paramsCasing: 'camelcase'` was combined with `urlType: 'export'`, the generated client function contained an unused `const item_id = itemId` declaration, causing TypeScript `noUnusedLocals` errors. The mapping variable is now only emitted when the URL is built inline (i.e. when no exported URL function is used).
