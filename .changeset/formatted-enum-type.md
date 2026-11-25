---
'@kubb/adapter-oas': patch
---

An `enum` with a `format`, such as `int32`, becomes a named enum when the schema has `x-enumNames` or `x-enum-varnames`, the same as an enum without a `format`. `@kubb/plugin-ts` then generates the runtime object with `enum: { type: 'asConst' }`. Before, the names were dropped and the enum generated as a union of its values. A formatted enum without names is unchanged.

With the `@kubb/plugin-ts` defaults, the type of these enums is now named `StatusKey` instead of `Status`. Set `constCasing: 'pascalCase'` and `typeSuffix: ''` to keep `Status`.
