---
'@kubb/core': patch
---

Adopt native Node 22 / ES2024 features: order plugins through `Set`-based dependency lookups in `KubbDriver`, and replace `Promise` resolver boilerplate with `Promise.withResolvers()`. Drop the unused `fflate` runtime dependency. The shared TypeScript config moves to an ES2024 target with the ES2025 collection and iterator libraries to match the Node 22 baseline.
