---
'@kubb/plugin-ts': minor
---

Restore `asPascalConst` enumType option - no longer deprecated. The `asPascalConst` option generates enum-like constants with PascalCase names (e.g., `const PetType = {...} as const`) while `asConst` generates camelCase names (e.g., `const petType = {...} as const`).
