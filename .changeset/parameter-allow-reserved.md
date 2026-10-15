---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
---

Keep `allowReserved` on parameters. `ParameterNode` gains an optional `allowReserved` flag, and the OAS adapter copies it from the source parameter like `style` and `explode`, so plugins can read the flag and pass it to the runtime.
