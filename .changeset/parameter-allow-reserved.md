---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
---

Keep `allowReserved` on parameters. `ParameterNode` gains an optional `allowReserved` flag, and the OAS adapter copies it from the source parameter like `style` and `explode`, so plugins can send reserved characters in query values unencoded.
