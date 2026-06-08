---
"@kubb/renderer-jsx": major
---

Remove React entirely, runtime and types, while keeping JSX as the authoring style. The async fiber runtime, `react-reconciler`, `scheduler`, and the `react` dependency are all gone. Rendering runs through the synchronous walker over a tiny built-in JSX runtime (`@kubb/renderer-jsx/jsx-runtime`). The JSX namespace is now self-contained (it only declares the `kubb-*` hosts plus `br`, `indent`, and `dedent`), so `@types/react` is dropped as well and consumers no longer need it for type support. The gzipped bundle drops from a 510 KiB budget to ~8 KiB. There is now one renderer, exported as `jsxRenderer`. The separate `jsxRendererSync` name is gone, and so is the unused `Root` error-boundary component.
