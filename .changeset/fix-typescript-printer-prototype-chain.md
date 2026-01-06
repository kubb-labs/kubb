---
"@kubb/plugin-ts": patch
---

Fix TypeScript printer crash caused by prototype chain bug in mapper lookup

Properties named after JavaScript built-in methods (e.g., "toString", "valueOf", "hasOwnProperty") were incorrectly matched against Object.prototype methods, causing the TypeScript printer to crash with "Debug Failure. Unhandled SyntaxKind: Unknown".

Changed mapper check from `options.mapper?.[mappedName]` to `Object.prototype.hasOwnProperty.call(options.mapper, mappedName)` to only match user-defined mapper properties, not inherited ones.
