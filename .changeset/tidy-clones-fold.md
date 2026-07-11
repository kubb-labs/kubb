---
'@kubb/ast': patch
'@kubb/renderer-jsx': patch
'@kubb/cli': patch
---

Fold duplicated code paths into shared helpers: the import and export merge loops in `@kubb/ast` now run through one generic `mergeMembers` helper, the JSX runtime walkers in `@kubb/renderer-jsx` share one `resolveElement` classifier, and the clack and plain loggers in `@kubb/cli` share one message and step helper. No behavior changes.
