---
'@kubb/ast': minor
'@kubb/kit': minor
'@kubb/adapter-oas': minor
---

Remove the `ast` helpers that only code-generation plugins use, so `@kubb/ast` keeps the node tree and the helpers Kubb itself needs. This is a breaking change for plugins that call them.

- Removes `ast.auth`, `ast.server`, `ast.mediaType.getKind`, `ast.mediaType.isStream`, `ast.schema.getNumberBounds` and `ast.graph.containsCircular`.
- Removes everything in `ast.http` except `ast.http.isOperation`: `groupParameters`, `getRequestGroups`, `getBaseURL`, `requestBody`, `responses` and `status`.
- Removes the deprecated `containsCircularRef` export from `@kubb/kit`.
- Moves the `ParserOptions`, `DateTypeOptions`, `DateTimeTypeValue` and `DateOnlyTypeValue` types from `ast` to `@kubb/adapter-oas`.

To upgrade, copy the helpers your plugin calls into the plugin, or import the option types from `@kubb/adapter-oas`:

```diff
- import type { ast } from 'kubb/kit'
- type DateType = ast.ParserOptions['dateType']
+ import type { ParserOptions } from '@kubb/adapter-oas'
+ type DateType = ParserOptions['dateType']
```
