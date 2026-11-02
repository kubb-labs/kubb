---
'@kubb/native': minor
'@kubb/core': minor
---

Add `@kubb/native`, the helpers that core and plugins share through `@kubb/kit`, with Rust implementations compiled to WebAssembly and JavaScript fallbacks.

- Runs `camelCase` and `pascalCase` in Rust when the WebAssembly module loads, and in JavaScript otherwise, with the same output.
- Set `KUBB_NATIVE=0` to force the JavaScript implementations.
