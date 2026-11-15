---
layout: doc
title: Customize generated code
description: Change what a Kubb plugin generates without forking it. Rename
  symbols and files with a resolver, rewrite the schema with a macro, or change
  the code printed for one schema type with a printer.
outline: [2, 3]
order: 3
navigation:
  title: Customize generated code
  icon: i-iconoir-magic-wand
---

# Customize generated code

Change what a plugin generates without forking it. Pick the hook that matches the change:

| You want to change | Use | Applies to |
| --- | --- | --- |
| What a type, function, or file is called, or where a file lands | [`resolver`](#resolvers) | The plugin you set it on |
| The schema itself, such as a field type, a name, or metadata | [`macros`](#macros) | Every plugin you pass the macro to |
| The code printed for one schema type, such as `date` | [`printer.nodes`](#printers) | `@kubb/plugin-ts`, `@kubb/plugin-zod`, `@kubb/plugin-faker` |

Macros run before the resolver, so a name a macro changes carries through to the generated names, paths, and files:

```mermaid
flowchart LR
  A[AST] --> M[Macros] --> G[Generator]
  G --> R[Resolver: names and paths]
  G --> P[Printer: code per schema type]
  R --> F[Files]
  P --> F
```

Write an override as a regular method, not an arrow function, when it uses `this`. [Architecture](/docs/5.x/explanation/architecture) shows how the parts fit together.

## Resolvers {#resolvers}

A resolver names every symbol and file a plugin writes. Pass only the methods you want to replace to the plugin's `resolver` option. The rest keep their defaults.

| Method | Builds | Plugin |
| --- | --- | --- |
| `name(name)` | Every identifier | All |
| `file.baseName({ name, extname })` | A file name, extension included | All |
| `file.path({ baseName, output })` | The full file path | All |
| `query.keyName(node)` | A query key, such as `getPetByIdQueryKey` | `@kubb/plugin-react-query`, `@kubb/plugin-vue-query` |
| `response.status(node, statusCode)` | A response name, such as `GetPetByIdStatus200` | `@kubb/plugin-ts`, `@kubb/plugin-zod`, `@kubb/plugin-faker` |

Each plugin's options page lists its own namespaces. [Resolver overrides](/docs/5.x/reference/kit/resolvers#resolver-overrides) has the signatures and the [`resolver` option](/docs/5.x/reference/plugin-options#resolver) the shared members.

::code-group

```typescript [Prefix names]
import { pluginTs, resolverTs } from '@kubb/plugin-ts'

pluginTs({
  resolver: {
    // Calls the preset to keep PascalCase: Pet becomes ApiPet
    name(name) {
      return `Api${resolverTs.name(name)}`
    },
  },
})
```

```typescript [Rename files]
import { pluginFaker } from '@kubb/plugin-faker'

pluginFaker({
  resolver: {
    file: {
      // Pet.mock.ts instead of the default createPet.ts
      baseName({ name, extname }) {
        return `${name}.mock${extname}`
      },
    },
  },
})
```

```typescript [Move files]
import { pluginFaker } from '@kubb/plugin-faker'

pluginFaker({
  resolver: {
    file: {
      // src/gen/fixtures/ instead of src/gen/mocks/
      path({ baseName }) {
        return `fixtures/${baseName}`
      },
    },
  },
})
```

```typescript [Query keys]
import { pluginReactQuery } from '@kubb/plugin-react-query'

pluginReactQuery({
  resolver: {
    query: {
      // this.name keeps the active naming rule: getPetByIdKey
      keyName(node) {
        return `${this.name(node.operationId)}Key`
      },
    },
  },
})
```

```typescript [Response types]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  resolver: {
    response: {
      // GetPetById200Response instead of GetPetByIdStatus200
      status(node, statusCode) {
        return this.name(`${node.operationId} ${statusCode} response`)
      },
    },
  },
})
```

::

> [!WARNING]
> `file.path` replaces the plugin's `output.path` and `group` layout. Kubb resolves the returned path against the root `output.path`, and it must stay inside that folder. The plugin's barrel covers only its own `output.path`, so moved files get no `index.ts`.

## Macros {#macros}

A macro rewrites schema or operation nodes before any generator runs. Define one with `defineMacro` from `kubb/kit`:

- `name` identifies the macro.
- A callback per node kind, such as `schema` or `operation`, returns a replacement node, or `undefined` to keep the node.
- `match` skips nodes the macro does not care about.
- `enforce: 'pre' | 'post'` runs the macro before or after the unmarked ones.

The [AST reference](/docs/5.x/reference/kit/ast#macros) lists every callback.

::code-group

```typescript [macroIntegerToString.ts]
import { defineMacro } from 'kubb/kit'

export const macroIntegerToString = defineMacro({
  name: 'integer-to-string',
  schema(node) {
    return node.type === 'integer' ? { ...node, type: 'string' } : undefined
  },
})
```

```typescript [macroUntagged.ts]
import { defineMacro } from 'kubb/kit'

export const macroUntagged = defineMacro({
  name: 'untagged',
  enforce: 'post',
  match: (node) => node.kind === 'Operation',
  operation(node) {
    return node.tags?.length ? undefined : { ...node, tags: ['untagged'] }
  },
})
```

::

### Register a macro

Pass macros through a plugin's `macros` option, or register them from your own plugin's `setup` with `kubb.addMacro` or `kubb.setMacros`. Macros run per plugin, so they never change the nodes another plugin sees.

```typescript [plugin.ts]
import { defineExtension, defineMacro } from 'kubb/kit'

const macroDropDescriptions = defineMacro({
  name: 'drop-descriptions',
  schema(node) {
    return 'description' in node && node.description ? { ...node, description: undefined } : undefined
  },
})

export const pluginRename = defineExtension({
  kind: 'plugin',
  meta: { name: 'plugin-rename' },
  setup(options, kubb) {
    kubb.addMacro(macroDropDescriptions)
    return options
  },
})
```

`macroIntegerToString` and `macroDropDescriptions` together turn a `Pet` schema node into the node on the right. Hover a line to see which macro changed it.

::flow-diagram{preset="macros"}
::

> [!TIP]
> Keep macros pure. Return a new node instead of mutating the input, because every plugin shares the same AST nodes.

### Rename a schema

> [!WARNING]
> A macro that changes only the declaration's `name` leaves every `$ref` on the old name, so imports point at a file the plugin no longer writes. Rename the declaration and set `targetName` on every ref to it in one macro, and register it on every plugin that reads the schema.

This macro does both. Pass one shared `macros` array to each plugin so their names and imports agree:

::code-group

```typescript [macroRenameSchema.ts]
import { ast, defineMacro } from 'kubb/kit'

export function macroRenameSchema({ from, to }: { from: string; to: string }) {
  return defineMacro({
    name: 'rename-schema',
    schema(node) {
      const refNode = ast.schema.narrow(node, 'ref')

      if (!refNode) {
        return node.name === from ? { ...node, name: to } : undefined
      }

      // A ref node can be the renamed schema's own declaration, a pointer to it, or both at once.
      const renamesDeclaration = refNode.name === from
      const renamesTarget = ast.ref.getName(refNode) === from
      if (!renamesDeclaration && !renamesTarget) return undefined

      return {
        ...refNode,
        ...(renamesDeclaration ? { name: to } : {}),
        ...(renamesTarget ? { targetName: to } : {}),
      }
    },
  })
}
```

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { macroRenameSchema } from './macroRenameSchema.ts'

const macros = [macroRenameSchema({ from: 'Order', to: 'StoreOrder' })]

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [pluginTs({ macros }), pluginZod({ macros })],
})
```

::

### Use the built-in macros

`kubb/kit` exports [built-in macros](/docs/5.x/reference/kit/ast#macros) for common normalizations. Combine them with your own:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { macroDedupeUnion, macroDiscriminatorEnum } from 'kubb/kit'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs({
      macros: [macroDedupeUnion, macroDiscriminatorEnum({ propertyName: 'kind', values: ['cat', 'dog'] })],
    }),
  ],
})
```

## Printers {#printers}

A printer turns schema nodes into code. `printer.nodes` replaces the handler for one schema type, such as `date` or `object`, and each handler returns code as a string. To change the schema for every output instead, use a [macro](#macros).

| Plugin | A handler returns | Inside a handler |
| --- | --- | --- |
| `@kubb/plugin-ts` | A TypeScript type | `this.transform(node)`: a nested node's printed type |
| `@kubb/plugin-zod` | A Zod expression, Zod Mini with `mini: true` | `this.base(node)`: the default output. `this.options.direction`: see [encode and decode](#zod-encode-and-decode). |
| `@kubb/plugin-faker` | A Faker expression | `this.transform(node)`, `this.options` |

[Printer handlers](/docs/5.x/reference/kit/ast#printer-handlers-and-context) has the full context.

::code-group

```typescript [plugin-ts]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  printer: {
    nodes: {
      // A JavaScript Date instead of string
      date() {
        return 'Date'
      },
    },
  },
})
```

```typescript [plugin-zod]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  printer: {
    nodes: {
      date() {
        return 'z.iso.date()'
      },
      // Decorate the default output. Nested nodes still print through the regular handlers.
      object(node) {
        return `${this.base(node)}.openapi(${JSON.stringify({ description: node.description })})`
      },
    },
  },
})
```

```typescript [plugin-faker]
import { pluginFaker } from '@kubb/plugin-faker'

pluginFaker({
  printer: {
    nodes: {
      // Floats where the spec declares integers
      integer() {
        return 'faker.number.float()'
      },
    },
  },
})
```

::

### TypeScript handlers

`this.transform(node)` returns a string, so a handler that passes it to `ts.factory` breaks. Build the type as a string. Returning a compiler node from `typescript` 5 or later, or `@typescript/typescript6`, still works with `@kubb/parser-ts` installed, but is deprecated and goes away in the next major.

### Zod encode and decode

`this.options.direction` is `'decode'` for response schemas and `'encode'` for request bodies and parameters. Return a different expression per direction and the plugin adds an `${name}InputSchema` variant for request bodies. Type the handlers as `PrinterZodNodes` from `@kubb/plugin-zod`, because the inline type also covers Zod Mini, which has no `direction`. See [Encode custom types](/extensions/kubb-labs/plugin-zod/guides/customization#encode-custom-types).
