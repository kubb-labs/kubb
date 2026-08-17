---
"@kubb/renderer-jsx": minor
"@kubb/core": patch
---

Add `@kubb/renderer-jsx`, a small JSX renderer for Kubb plugins with a custom JSX runtime and built-in components (`File`, `Const`, `Function`, `Type`). `@kubb/core` gains `createRenderer`, the factory a renderer implements against; `@kubb/renderer-jsx`'s `jsxRenderer` is the first consumer. Replaces `@kubb/react-fabric` as the rendering layer.
