---
layout: doc
title: Customize names and paths
description: Resolvers name every symbol and file Kubb generates. The resolver
  option on each code-generating plugin patches a single naming rule, so you
  change what things are called or where files land without forking the plugin.
outline: deep
order: 3
navigation:
  title: Customize names and paths
  icon: i-iconoir-label
---

# Customize names and paths

Set a plugin's `resolver` option to change generated identifiers and file paths. Supply only the methods you need to replace. Other methods keep their defaults.

Write overrides as regular methods, not arrow functions, when they use `this`. See [resolver overrides](/docs/5.x/reference/kit/resolvers#resolver-overrides) for the `this` rules and signatures.

## Rename identifiers

Prefix TypeScript names while preserving the plugin's PascalCase preset:

```typescript twoslash [prefix.ts]
import { pluginTs, resolverTs } from '@kubb/plugin-ts'

pluginTs({
  resolver: {
    name(name) {
      return `Api${resolverTs.name(name)}`
    },
  },
})
```

## Rename and relocate files

`file.baseName` builds a file's name, extension included. Here it renames every Faker file to `<name>.mock.ts` instead of the plugin default.

```typescript twoslash [file-name.ts]
import { pluginFaker } from '@kubb/plugin-faker'

pluginFaker({
  resolver: {
    file: {
      baseName({ name, extname }) {
        return `${name}.mock${extname}`
      },
    },
  },
})
```

`file.path` returns the file's full path and bypasses the `output.path` and `group` layout, so the resolver owns where the file lands. This override moves every Faker file into a `mocks/` folder. The returned path may not escape the project root.

```typescript twoslash [file-path.ts]
import { pluginFaker } from '@kubb/plugin-faker'

pluginFaker({
  resolver: {
    file: {
      path({ baseName, output }) {
        return `${output.path}/mocks/${baseName}`
      },
    },
  },
})
```

## Namespaced names

Override `query.keyName` to rename React Query keys. Use `this.name` to retain the active naming rule:

```typescript twoslash [query-key.ts]
import { pluginReactQuery } from '@kubb/plugin-react-query'

pluginReactQuery({
  resolver: {
    query: {
      keyName(node) {
        return `${this.name(node.operationId)}Key`
      },
    },
  },
})
```

`@kubb/plugin-ts` names each response type through `response.status`. This override rewrites the template so a `200` response reads `GetPetById200Response` instead of the default `GetPetByIdStatus200`.

```typescript twoslash [response.ts]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  resolver: {
    response: {
      status(node, statusCode) {
        return this.name(`${node.operationId} ${statusCode} response`)
      },
    },
  },
})
```
