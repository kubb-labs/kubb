---
'@kubb/ast': patch
---

Stop re-exporting unused internal helpers from `@kubb/ast/utils`.

`resolveRefName`, `resolveGroupType`, `buildGroupParam`, `buildTypeLiteral`, and `resolveParamType`, plus the `MappedProperty`, `MappedSchema`, `SchemaTransform`, `BuildGroupArgs`, and `ParamGroupType` types, were exported from the `@kubb/ast/utils` barrel but nothing consumed them through it. They stay available to the package internally. Keep importing the public helpers (`caseParams`, `createOperationParams`, `mapSchemaItems`, `syncSchemaRef`, and the rest) as before.
