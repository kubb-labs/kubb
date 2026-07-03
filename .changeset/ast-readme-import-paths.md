---
'@kubb/ast': patch
---

Update the README to match the current export map. The imports table no longer lists the removed `@kubb/ast/utils` and `@kubb/ast/macros` subpaths, the Refs example imports `extractRefName` from the root `@kubb/ast`, and new rows cover the `kubb/kit` namespaces and the flat `kubb/ast` subpath. A note now spells out that `@kubb/ast` is internal to the kubb monorepo, so plugins and user code reach the same surface through `kubb/kit` or `kubb/ast`.
