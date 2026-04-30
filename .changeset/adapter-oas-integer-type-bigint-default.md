---
'@kubb/adapter-oas': minor
---

Change the default value of `integerType` from `'number'` to `'bigint'`.

`int64` fields in OpenAPI specs are now mapped to `bigint` by default. To preserve the previous behaviour, set `integerType: 'number'` explicitly in your adapter options.
