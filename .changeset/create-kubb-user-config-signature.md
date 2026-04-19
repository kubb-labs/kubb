---
'@kubb/core': minor
---

Update `createKubb` to take `userConfig` directly as its first argument.

This makes the public API align with the internal setup flow and clarifies that the first parameter is the user-facing `UserConfig` shape that gets resolved during `setup()`.
