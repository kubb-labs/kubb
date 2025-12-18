---
"@kubb/oas": patch
"@kubb/core": patch
---

Performance optimizations across core and OAS packages:

- **@kubb/oas**: Replaced inefficient `JSON.parse(JSON.stringify())` deep copy with native `structuredClone()` API for significantly faster and more memory-efficient OpenAPI document cloning
- **@kubb/core**: Optimized plugin lookups in barrel file generation by using Map for O(1) lookups instead of O(n*m) array operations
- **@kubb/core**: Replaced repeated object spreading with `Object.assign()` in plugin context initialization to reduce object allocations
- **@kubb/core**: Optimized filter-map chains to use single-pass `reduce()` for better performance when processing promise results
