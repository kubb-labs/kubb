---
"@kubb/adapter-oas": patch
---

Boolean `const` values (e.g. `const: false`) inside object properties are now inlined as literal types instead of generating an external named enum.

Previously, a schema like `isHappy: { type: boolean, const: false }` would produce a named enum node that printers treated as an external type reference (e.g. `IsHappyEnum`). It now produces an anonymous enum node so printers emit an inline literal type (`false`).

When `collisionDetection: false`, duplicate inline enum names are now deduplicated with a numeric suffix (e.g. `ParamsStatusEnum` → `ParamsStatusEnum2`) when two different schemas produce the same derived enum name.

Parameter schemas containing an `enum` field (e.g. `type: string, enum: [available, pending, sold]`) now produce a named enum node (e.g. `StatusEnum`) instead of an anonymous inline literal union.
