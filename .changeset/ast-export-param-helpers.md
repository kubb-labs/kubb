---
'@kubb/ast': minor
'@kubb/core': minor
'@kubb/parser-md': patch
---

Split the operation-parameter helpers across `@kubb/ast` by what they return. The node builders `resolveParamType`, `buildGroupParam`, and `buildTypeLiteral` stay on the main `@kubb/ast` entry. The helpers that return plain values move to the `@kubb/ast/utils` subpath: `resolveGroupType` (a `ParamGroupType` descriptor) and `extractStringsFromNodes` (a string), along with the `ParamGroupType` and `BuildGroupArgs` types.

`extractStringsFromNodes` is no longer re-exported from the main `@kubb/ast` barrel or the `ast` namespace re-exported by `@kubb/core`. Import it from `@kubb/ast/utils` instead. The plugins migration (Phase 2) builds query, header, and path parameter groups from these helpers instead of redefining them.
