---
'@kubb/adapter-oas': minor
---

Expose `collisionDetection` option in the public API.

- `collisionDetection: true` (default) — full-path enum names (e.g. `OrderParamsStatusEnum`)
- `collisionDetection: false` — immediate-parent enum names with numeric deduplication (e.g. `ParamsStatusEnum`, `ParamsStatusEnum2`)
