---
'@kubb/renderer-jsx': minor
'@kubb/core': patch
---

Add `@kubb/renderer-jsx` package.

A lightweight JSX renderer for Kubb plugins:

- Custom JSX runtime (`jsx-runtime`, `jsx-dev-runtime`)
- `createRenderer` to render JSX trees into `FileNode` arrays
- Built-in components: `File`, `Const`, `Function`, `Type`, `Root`
- Context helpers: `KubbContext`, `OasContext`

Replaces `@kubb/react-fabric` as the rendering layer inside Kubb plugins.
