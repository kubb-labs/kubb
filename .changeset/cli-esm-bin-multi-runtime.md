---
'@kubb/cli': patch
---

Replace `bin/kubb.cjs` with `bin/kubb.js` (ESM). Use `process.setSourceMapsEnabled?.(true)` with optional chaining for Bun/Deno compatibility.
