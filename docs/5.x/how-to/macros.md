---
layout: doc
title: Transform schemas with macros
description: A macro is a named, composable transform over Kubb's AST. Macros
  rewrite schema and operation nodes before generators print code, and the same
  macro works across every adapter and every output target.
outline: deep
order: 4
navigation:
  title: Transform schemas with macros
  icon: i-iconoir-magic-wand
---

# Transform schemas with macros

Use a macro to transform schema or operation nodes before generation. Macros can rename symbols, change field types, or remove metadata across output targets.

Import the macro engine through `ast` from `kubb/kit`. For callback signatures and context properties, see the [AST reference](/docs/5.x/reference/kit/ast#macros).

## Writing a macro

Define the node transformation:

```typescript [macro.ts]
import { ast } from 'kubb/kit'

const macroIntegerToString = ast.defineMacro({
  name: 'integer-to-string',
  schema(node) {
    return node.type === 'integer' ? { ...node, type: 'string' } : undefined
  },
})
```

The `match` predicate skips a macro for nodes it does not care about, and `enforce` places a macro before or after the unmarked ones.

```typescript [enforce.ts]
import { ast } from 'kubb/kit'

const macroUntagged = ast.defineMacro({
  name: 'untagged',
  enforce: 'post',
  match: (node) => node.kind === 'Operation',
  operation(node) {
    return node.tags?.length ? undefined : { ...node, tags: ['untagged'] }
  },
})
```

## Using macros in a plugin

Pass macros through a plugin's `macros` option, or register them from `setup` with `addMacro` and `setMacros`. Macros run per plugin, so one plugin's macros never change the nodes another plugin sees.

```typescript [plugin.ts]
import { ast, defineExtension } from 'kubb/kit'

const macroDropDescriptions = ast.defineMacro({
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

Together, the two macros on this page turn a `Pet` schema node into the node on the right. Hover a line to see what changed it.

::flow-diagram{preset="macros"}
::

Macros run before the resolver names anything, so a renamed `operationId` or `SchemaNode.name` carries through to generated names, paths, and files.

> [!TIP]
> Keep macros pure. Build a new node and return it rather than mutating the input, since the AST is shared by reference.

> [!WARNING]
> Do not rename a schema by changing only the declaration's `name`. Every `$ref` to it still resolves to the old name, so imports and printed references point at a file the plugin no longer emits. Rename the declaration and set `targetName` on every ref pointing at it in one macro, and register that macro on every plugin that touches the schema.

Copy this macro into your project. It renames the declaration and every ref pointing at it in one pass.

```typescript [macroRenameSchema.ts]
import { ast } from 'kubb/kit'

export function macroRenameSchema({ from, to }: { from: string; to: string }) {
  return ast.defineMacro({
    name: 'rename-schema',
    schema(node) {
      const refNode = ast.narrowSchema(node, 'ref')

      if (!refNode) {
        return node.name === from ? { ...node, name: to } : undefined
      }

      // A ref node can be the renamed schema's own declaration, a pointer to it, or both at once.
      const renamesDeclaration = refNode.name === from
      const renamesTarget = ast.resolveRefName(refNode) === from
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

Pass one shared `macros` array to every plugin that reads the schema, so their names and imports agree:

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

## Use the built-in macros

`kubb/kit` exports presets for common normalizations. Compose them with your own through a plugin's `macros` option. See the [built-in macros table](/docs/5.x/reference/kit/ast#macros) for what each one does.

```typescript [presets.ts]
import { ast, macroSimplifyUnion, macroDiscriminatorEnum } from 'kubb/kit'

const root = ast.factory.createInput({ schemas: [], operations: [] })
const next = ast.applyMacros(root, [
  macroSimplifyUnion,
  macroDiscriminatorEnum({ propertyName: 'kind', values: ['cat', 'dog'] }),
])
```

Export macros from a shared module to reuse them across plugins and projects.
