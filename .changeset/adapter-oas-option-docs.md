---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
---

The `contentType` docs no longer claim a default of the first JSON media type. Without it, Kubb keeps every media type an operation declares. The `integerType` docs now say it applies only to `int64` and `uint64` schemas, and other integers stay `number`.
