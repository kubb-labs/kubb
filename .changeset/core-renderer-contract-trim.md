---
"@kubb/core": patch
---

Trim the `Renderer` contract to what the build driver actually uses. The `unmount` and `dispose` methods were never called, since the driver disposes through `using instance = renderer()`, which runs `[Symbol.dispose]`. Both are removed from the `Renderer` type, so a custom renderer now implements `render`, `files`, an optional `stream`, and `[Symbol.dispose]` only.
