---
'@kubb/renderer-jsx': patch
'@kubb/core': patch
---

Harden two more cross-copy identity checks with a shared `Symbol.for` brand, matching the resolver fix.

`Diagnostics.isError` now brands `Diagnostics.Error` with `Symbol.for('@kubb/core/diagnostics/error')`, so a structured error thrown from an adapter or plugin that bundles its own `@kubb/core` keeps its `code` through the throw/catch path instead of collapsing to `KUBB_UNKNOWN`. The previous `name`/shape check stays as a fallback for errors thrown by an older copy that predates the brand.

The JSX renderer now checks an element's `$$typeof` against `Symbol.for('kubb.element')` instead of accepting any object that carries a `$$typeof` field, so a stray React element (which brands its own `$$typeof`) is no longer mistaken for a Kubb element.
