---
"@kubb/plugin-faker": patch
---

fix: named array type aliases (`$ref` to a schema with `type: array`) no longer wrapped in `Partial<>`, preventing TypeScript errors like `(Item | undefined)[] not assignable to Item[]`
