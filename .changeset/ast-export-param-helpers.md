---
'@kubb/ast': minor
---

Export the operation-parameter helpers `resolveParamType`, `resolveGroupType`, `buildGroupParam`, and `buildTypeLiteral` from `@kubb/ast`, along with the `ParamGroupType` and `BuildGroupArgs` types. The plugins migration (Phase 2) builds query, header, and path parameter groups from these instead of redefining them.
