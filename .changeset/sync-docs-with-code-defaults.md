---
"@kubb/adapter-oas": patch
"@kubb/ast": patch
"@kubb/core": patch
"@kubb/renderer-jsx": patch
---

Sync option docs with the actual v5 defaults and APIs. The `integerType` docs in `@kubb/adapter-oas` (extension.yaml) and `@kubb/ast` (JSDoc) now state the real default `'bigint'` instead of `'number'`. The `@kubb/core` JSDoc for build diagnostics names the per-plugin timing kind `performance` instead of the removed `timing`. The `@kubb/renderer-jsx` README drops the removed `createRenderer` and `renderer.unmount()` APIs in favor of `jsxRenderer()` with `render`, `files`, and `stream`, and lists the markdown components (`Callout`, `Frontmatter`, `Heading`, `List`, `Paragraph`).
