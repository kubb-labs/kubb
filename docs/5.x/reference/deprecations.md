---
layout: doc
title: Deprecations - APIs removed in Kubb v6
description: Every deprecated Kubb v5 API, the package it ships in, and what to use instead before Kubb v6 removes it.
outline:
  - 2
order: 9
navigation:
  title: Deprecations
  icon: i-iconoir-warning-circle
---

# Deprecations

Kubb v6 removes every API on this page. Each one still works in v5. Move to the replacement before you upgrade.

## @kubb/core {#kubb-core}

| Deprecated | Use instead |
| --- | --- |
| `definePlugin` | `defineExtension` with `kind: 'plugin'` |
| `defineParser` | `defineExtension` with `kind: 'parser'` |
| `createAdapter` | `defineExtension` with `kind: 'adapter'` |
| `ctx.driver` in plugin hooks | `schemas`, `getPlugin` and `memo` |
| `driver.getResolver(pluginName)` | `ctx.getResolver(pluginName)` in a template, or `getResolver(pluginName)` from `kubb/kit` |
| `addGenerator`, `setResolver`, `setMacros`, `addMacro`, `createResolver`, `defineResolver`, `defineGenerator`, `toFilePath`, `Resolver` from `@kubb/core` | The same names from `kubb/kit` |

## @kubb/kit {#kubb-kit}

| Deprecated | Use instead |
| --- | --- |
| `definePlugin` | `defineExtension` with `kind: 'plugin'` |
| `defineGenerator` | `defineTemplate` |
| `addGenerator` | `defineTemplate` and `addTemplate` |
| `setMacros` | `addMacro(...macros)` |
| `Generator` type | `Template` with `defineTemplate` and `addTemplate` |
| `camelCase` | `casing.camel` |
| `pascalCase` | `casing.pascal` |
| `extractRefName` | `ast.ref.getName` |
| `syncSchemaRef` | `ast.ref.mergeSchema` |
| `isStringType` | `ast.schema.is(node, 'string')` |
| `macroSimplifyUnion` | `macroDedupeUnion` |

## @kubb/ast {#kubb-ast}

| Deprecated | Use instead |
| --- | --- |
| `isBareRef` | `ast.ref.isAlias` |
| `mergeRefWithSchema` | `ast.ref.mergeSchema` |
| `refName`, `resolveRefName` | `ast.ref.getName` |
| `resolveRef` | `ast.ref.getSchema` |
| `collectImportedRefNames` | `ast.graph.getImportedNames` |
| `collectSchemaRefs` | `ast.graph.getRefNames` |
| `collectUsedSchemaNames` | `ast.graph.getUsedNames` |
| `findCircularSchemas` | `ast.graph.getCircularNames` |
| `getSchemaLiteralValues` | `ast.schema.getLiterals` |
| `inferDiscriminatorPropertyName` | `ast.schema.inferDiscriminator` |
| `resolveSchemaProperties` | `ast.schema.findProperties` |
| `isHttpOperationNode` | `ast.http.isOperation` |
| `collect`, `collectSync` | `ast.node.collect` |
| `optionality` | `ast.schema.applyOptionality` |
| `extractStringsFromNodes` | `ast.node.getText` |
| `compareEnforce` | `ast.macro.compareOrder` |
| `applyMacros` | `ast.macro.apply` |
| `createPrinter` | `createPrinter` from `@kubb/kit` |
| `defineMacro` | `defineMacro` from `@kubb/kit` |
| `nodeKinds` | `ast.node.kinds` |
| `schemaTypes` | `ast.schema.types` |
| `findSchema` | `ast.schema.find` |
| `narrowSchema` | `ast.schema.narrow` |
| `transform` | `ast.node.transform` |
| `inlineFiles` | `ast.file.inline` |
| `ast.schema.isString` | `ast.schema.is(node, 'string')` |
| `followRefs` option of `findSchema` | `follow: ['ref']` |
| `ImportNode` `name` | `names` |
| `ImportNode` and `ExportNode` `isTypeOnly` | `space: 'type'` on each name |
| `ImportNode` `isNameSpace`, `ExportNode` `asAlias` | `{ name: '*', alias }` in `names` |
| `ExportNode` `name` | `names` |
| `SourceNode` `isTypeOnly` | `space: 'type'` |
| `SourceNode` `isExportable`, `isIndexable` | `export` |
| `SourceNode` `inline` | `inline` on the file |
| `ObjectSchemaNode` `minProperties`, `maxProperties` | `min`, `max` |
| `NumberSchemaNode` `exclusiveMinimum`, `exclusiveMaximum` | `exclusive.min`, `exclusive.max` |

## @kubb/renderer-jsx {#kubb-renderer-jsx}

| Deprecated | Use instead |
| --- | --- |
| `File.Source` | `Code` or `Raw`, or `Const`, `Type` or `Function` directly in `File` |
| `inline` prop on `Const`, `Type` and `Function` | `inline` on the `File` |

## @kubb/parser-ts {#kubb-parser-ts}

| Deprecated | Use instead |
| --- | --- |
| `TsNode` (compiler nodes passed to `print`) | Printed strings |
