---
"@kubb/plugin-ts": patch
---

Fix crash when generating enums with negative numeric values (e.g., `enum: [-1, 0, 5]`). Negative numbers now correctly use `createPrefixUnaryExpression` instead of `createNumericLiteral` for all enum type variants (`literal`, `inlineLiteral`, `enum`, `constEnum`).
