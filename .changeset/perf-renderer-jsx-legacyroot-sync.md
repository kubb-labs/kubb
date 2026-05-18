---
"@kubb/renderer-jsx": patch
---

perf(renderer-jsx): switch to LegacyRoot + add jsxRendererSync (~2× faster)

- Switch React reconciler from `ConcurrentRoot` to `LegacyRoot` and set `isPrimaryRenderer: false`, removing scheduler overhead that Kubb's synchronous render path never benefits from (~26–30% faster)
- Add `jsxRendererSync`: a new synchronous recursive renderer that walks the JSX element tree without React fiber/scheduler, producing identical output to `jsxRenderer` at ~2× the speed
- `jsxRendererSync` is exported from `@kubb/renderer-jsx` alongside the existing `jsxRenderer` (purely additive, no breaking changes)
