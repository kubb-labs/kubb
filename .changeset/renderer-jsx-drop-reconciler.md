---
"@kubb/renderer-jsx": minor
---

Remove the async fiber runtime and drop the `react-reconciler` and `scheduler` dependencies. The package now renders only through the synchronous JSX walker, cutting the bundle from a 510 KiB budget to ~23 KiB gzipped. `jsxRenderer` becomes a deprecated alias of `jsxRendererSync`: it renders synchronously and no longer supports React hooks or suspense. Point generators at `jsxRendererSync`.
