---
'@kubb/adapter-oas': patch
---

An `enum` with a `format`, such as `int32`, becomes a named enum when the schema has `x-enumNames` or `x-enum-varnames`, the same as an enum without a `format`. `@kubb/plugin-ts` then generates the runtime object with `enum: { type: 'asConst' }`. Before, the names were dropped and the enum generated as a union of its values. A formatted enum without names is unchanged, and so is one whose format prints as `bigint`, `Date`, or `Blob`. An `int64` enum needs `integerType: 'number'`.

With the `@kubb/plugin-ts` defaults, the type of these enums is now named `StatusKey` instead of `Status`. Set `constCasing: 'pascalCase'` and `typeSuffix: ''` to keep `Status`.

Each `x-enumNames` entry also stays with its own value when the enum repeats a value, such as `enum: [1, 1, 2]`. Before, the names shifted by one. An enum without a `type` takes its member type from its values.
