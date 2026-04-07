---
"@kubb/renderer-jsx": minor
"@kubb/core": patch
---

Add `@kubb/renderer-jsx` — a lightweight JSX renderer for Kubb plugins.

- New package `@kubb/renderer-jsx` with a custom JSX runtime (`jsx-runtime`, `jsx-dev-runtime`)
- Provides `createRenderer` to render JSX trees into `FileNode` arrays without React
- Built-in components: `File`, `Const`, `Function`, `Type`, `Root`
- Context helpers: `KubbContext`, `OasContext`
- Replaces `@kubb/react-fabric` as the rendering layer inside Kubb plugins
