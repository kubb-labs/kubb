---
'@kubb/adapter-oas': minor
---

Add `formattedEnumType: 'enum'`, which turns an `enum` on a schema with a `format`, such as `int32`, into a named enum that uses `x-enumNames`. `@kubb/plugin-ts` then generates the runtime object with `enum: { type: 'asConst' }`. The default, `'union'`, keeps the literal union.

```ts
adapterOas({ formattedEnumType: 'enum' })
```
