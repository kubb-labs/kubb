---
"@kubb/renderer-jsx": major
---

Remove the React runtime entirely while keeping JSX as the authoring style. The async fiber runtime, `react-reconciler`, `scheduler`, and the `react` dependency are all gone. Rendering runs through the synchronous walker over a tiny built-in JSX runtime (`@kubb/renderer-jsx/jsx-runtime`), and `@types/react` stays only as a development-time type dependency. The gzipped bundle drops from a 510 KiB budget to ~8 KiB. `jsxRenderer` is now a deprecated alias of `jsxRendererSync` and no longer supports hooks or suspense, and the unused `Root` component, a former error boundary, is removed.
