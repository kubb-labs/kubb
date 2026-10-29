---
layout: doc
title: AST and node builders
description: The ast namespace groups the factory node builders, the transform
  and collect visitors, direct schema traversal helpers, the guards, the ref
  and naming helpers, the macro engine, and the printer helper behind one import.
outline:
  - 2
  - 3
order: 8
navigation:
  title: AST & node builders
  icon: i-iconoir-code-brackets

---

# AST and node builders

## `ast`

`ast` is `kubb/kit`'s namespace for the entire AST surface, the same way TypeScript groups its node constructors under `ts.factory`. It carries the `factory` node builders, the `transform` and `collect` visitors, the guards, the ref and string helpers, and the macro engine.

```typescript [ast-namespace.ts]
import { ast } from 'kubb/kit'

const root = ast.factory.createInput({
  schemas: [ast.factory.createSchema({ name: 'Pet', type: 'object', properties: [] })],
  operations: [],
})
```

Node building goes through `ast.factory`. `ast.factory.createFile`, `ast.factory.createSource`, and `ast.factory.createText` build the `FileNode` tree a generator returns. See the [factory table](#factory-functions) below.

For why the AST exists and how it fits the pipeline, see [AST concepts](/docs/5.x/explanation/architecture#ast).

## Schema node types

A `SchemaNode` is discriminated by its `type`. The values fall into three families.

### Structural types

| Type           | Description                             | TypeScript                      |
| -------------- | --------------------------------------- | ------------------------------- |
| `object`       | Object with named properties            | `{ name: string; age: number }` |
| `array`        | Sequence of items                       | `string[]`                      |
| `tuple`        | Fixed-length array with typed positions | `[string, number, boolean]`     |
| `union`        | One of multiple types                   | `string \| number`              |
| `intersection` | Combination of multiple types           | `A & B`                         |
| `enum`         | Fixed set of literal values             | `'active' \| 'inactive'`        |

### Scalar types

| Type      | Description    | TypeScript |
| --------- | -------------- | ---------- |
| `string`  | Text value     | `string`   |
| `number`  | Numeric value  | `number`   |
| `integer` | Whole number   | `number`   |
| `bigint`  | Large integer  | `bigint`   |
| `boolean` | True/false     | `boolean`  |
| `null`    | Null value     | `null`     |
| `any`     | Any value      | `any`      |
| `unknown` | Unknown value  | `unknown`  |
| `void`    | No value       | `void`     |
| `never`   | Never produced | `never`    |

Object schemas can also include `propertyNames`, a schema that validates each key name. The OpenAPI adapter maps this field from the input schema.

### Special types

| Type       | Description                 | Example                                |
| ---------- | --------------------------- | -------------------------------------- |
| `ref`      | Reference to another schema | `Pet` (from `$ref`)                    |
| `date`     | ISO date                    | `2024-01-15`                           |
| `datetime` | ISO datetime                | `2024-01-15T10:30:00Z`                 |
| `time`     | ISO time                    | `10:30:00`                             |
| `uuid`     | UUID string                 | `550e8400-e29b-41d4-a716-446655440000` |
| `email`    | Email address               | `user@example.com`                     |
| `url`      | URL string                  | `https://example.com`                  |
| `blob`     | Binary data                 | Raw bytes                              |

## Factory functions {#factory-functions}

Factories return defaulted, fully typed nodes for adapters and generator handlers. Never build AST literals by hand. Besides `createInput`, `createSchema`, and `createOperation`, the namespace provides constructors for source files and the TypeScript-level artifacts generators emit:

| Factory                                                             | Purpose                                                  |
| ------------------------------------------------------------------- | -------------------------------------------------------- |
| `createFile`, `createSource`, `createText`                          | Build `FileNode`s emitted by generators.                 |
| `createImport`, `createExport`                                      | Emit `import` / `export` statements.                     |
| `createConst`, `createFunction`, `createArrowFunction`, `createJsx` | Emit TypeScript declarations and JSX.                    |
| `createParameter`                                                   | Describe operation parameters.                           |
| `createProperty`, `createType`                                      | Compose object properties and TypeScript types.          |
| `createResponse`, `createRequestBody`, `createContent`              | Model responses, request bodies, and content entries.    |
| `createBreak`                                                       | Emit line breaks between nodes.                          |

## Visitors {#visitors}

Two visitor functions cover the common traversal patterns: `transform` rewrites the tree and `collect` gathers nodes. Visitor objects use lowercase, kind-style keys (`input`, `operation`, `schema`, `property`, `parameter`, `response`). To rewrite nodes inside a plugin, reach for [macros](/docs/5.x/how-to/macros), which add names, ordering, and composition on top of `transform`. For logging, validation, or statistics, `collect` the nodes you care about.

### `transform`: synchronous, returns a new tree

```typescript [transform.ts]
import { ast } from 'kubb/kit'

const root = ast.factory.createInput({ schemas: [], operations: [] })

const enhanced = ast.transform(root, {
  schema(node) {
    if (node.type === 'object' && node.additionalProperties === undefined) {
      return { ...node, additionalProperties: false }
    }
    return node
  },
  operation(node) {
    return { ...node, tags: node.tags?.length ? node.tags : ['untagged'] }
  },
})
```

Use `transform` to change AST structure, normalize inconsistencies, or annotate nodes.

### `collect`: gather matching nodes

`collect` is a generator function, so it yields matches lazily and you consume it with `for...of` or spread it into an array. When you want the array up front, call `collectSync`, which is the eager counterpart and returns `Array<T>`.

```typescript [collect.ts]
import { ast } from 'kubb/kit'

const root = ast.factory.createInput({ schemas: [], operations: [] })

const mutations = ast.collectSync<ast.OperationNode>(root, {
  operation(node) {
    return node.method === 'POST' ? node : undefined
  },
})

const deprecated = ast.collectSync<ast.SchemaNode>(root, {
  schema(node) {
    return 'deprecated' in node && node.deprecated ? node : undefined
  },
})

console.log(`POST operations: ${mutations.length}`)
console.log(`Deprecated schemas: ${deprecated.length}`)
```

Use `collect` to stream matches as you find them, and `collectSync` to find specific nodes, filter by a criterion, or build a list for later processing.

### Direct traversal

`forEachChild` visits the immediate children of a node. `forEachSchema` visits schema nodes in a node's child tree, including the starting node when it is a schema. Neither helper follows refs.

`findSchema` stops at the first schema that matches a predicate. Set `followRefs: true` to inspect resolved ref targets; traversal stops when it reaches an unresolved or cyclic ref.

```typescript twoslash [find-schema.ts]
import { ast } from 'kubb/kit'

const root = ast.factory.createInput({ schemas: [], operations: [] })

const dateSchema = ast.findSchema(root, {
  followRefs: true,
  predicate: (schema) => schema.type === 'date',
})
```

## Guards and narrowing {#guards-and-narrowing}

Kubb exports type guards and a `narrowSchema` helper for safe discrimination:

```typescript [guards.ts]
import { ast } from 'kubb/kit'

const root = ast.factory.createInput({ schemas: [], operations: [] })

for (const node of ast.collect<ast.SchemaNode>(root, { schema: (node) => node })) {
  const obj = ast.narrowSchema(node, 'object')
  if (obj) {
    console.log(`object with ${obj.properties.length} properties`)
  }

  if (node.type === 'ref') {
    console.log(`reference to: ${node.ref}`)
  }
}

for (const node of ast.collect<ast.OperationNode>(root, { operation: (node) => node })) {
  if (ast.isHttpOperationNode(node)) {
    console.log(`${node.method} ${node.path}`)
  }
}
```

## Refs and naming helpers

The helpers split across two surfaces. `resolveRef`, `resolveRefName`, and `refName` ship on the `ast` namespace, like the guards and node types. `extractRefName`, `childName`, `enumPropName`, and `syncSchemaRef` are named exports of `kubb/kit` itself. The same split applies to `containsCircularRef` and the built-in macros below.

| Helper           | Purpose                                                             |
| ---------------- | ------------------------------------------------------------------- |
| `resolveRef`     | Follow resolved ref nodes to their target schema.                   |
| `extractRefName` | Turn `'#/components/schemas/Pet'` into `'Pet'`.                     |
| `resolveRefName` | Resolve the name a ref node emits, preferring its `targetName`.     |
| `childName`      | Derive a child property name from context.                          |
| `enumPropName`   | Convert an enum value into a valid property name.                   |
| `syncSchemaRef`  | Merge a ref node with its resolved schema, letting usage-site fields (`description`, `nullable`) override. |

```typescript [refs.ts]
import { extractRefName } from 'kubb/kit'

const name = extractRefName('#/components/schemas/Pet')
//    ^?
```

## Schema graph

Analyze how schemas reference each other, to prune unused schemas or wrap circular ones in a lazy construct. `collectUsedSchemaNames` and `findCircularSchemas` ship on the `ast` namespace.

| Helper                   | Purpose                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| `collectUsedSchemaNames` | Collect the names of every top-level schema transitively used by a set of operations. Pair it with `include` filters to leave unreferenced schemas ungenerated. |
| `findCircularSchemas`    | Find every schema that takes part in a circular dependency chain, so those positions can be wrapped in a lazy getter or `z.lazy(() => …)`. |
| `containsCircularRef`    | Report whether a schema, or anything nested inside it, references a circular schema. |

## Constants

| Export        | Purpose                                    |
| ------------- | ------------------------------------------ |
| `schemaTypes` | Map of every schema `type` discriminant.   |
| `nodeKinds`   | Map of every node `kind` discriminant.     |

## Macros

A macro is a named, composable transform built on `transform` that rewrites nodes before printing, adding ordering, gating, and reuse a bare visitor doesn't give you. See [Macros concepts](/docs/5.x/how-to/macros).

| Export          | Purpose                                          |
| --------------- | ------------------------------------------------ |
| `defineMacro`   | Type a macro and read it as one definition.      |
| `composeMacros` | Fold an ordered list of macros into one visitor. |
| `applyMacros`   | Run a list of macros over a node tree.           |

Kubb also ships built-in macros for common schema normalizations that any adapter can compose with its own. `macroDiscriminatorEnum`, `macroEnumName`, and `macroRenameSchema` read options, so call them to build the macro. Plugins that import another plugin's output compute names from the nodes they see, so register a rename on every plugin that touches the schema, for example by passing one shared `macros` array to each plugin.

| Macro                    | Purpose                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `macroSimplifyUnion`     | Drop union members a broader scalar primitive already covers, such as a multi-value string enum next to `string`. |
| `macroDiscriminatorEnum` | Replace a discriminator property's schema with a string enum of its allowed values.         |
| `macroEnumName`          | Name an inline enum schema from its parent and property name.                               |
| `macroRenameSchema`      | Rename a schema's declaration and stamp `targetName` on every ref pointing at it, so `resolver.imports` emits the new name everywhere. |

### Macro options and callbacks

A macro carries the per-kind callbacks of a [visitor](/docs/5.x/reference/kit/ast#visitors), plus a `name`, an optional `enforce` order, and an optional `match` predicate.

```typescript [Type definition]
type Macro = {
  name: string
  enforce?: 'pre' | 'post'
  match?: (node: Node) => boolean
  schema?(node: SchemaNode, context): SchemaNode | null | undefined
  operation?(node: OperationNode, context): OperationNode | null | undefined
  // input, output, property, parameter, response
}
```

Each callback returns a replacement node, or `undefined` or `null` to leave the node untouched.

## Printers

Lower-level helpers for parsers that turn the AST into source code:

| Export          | Purpose                                |
| --------------- | -------------------------------------- |
| `createPrinter` | Typed helper for creating a `Printer`. |

`createPrinter` takes an `overrides` map to replace the handler for individual schema node types. Pass overrides through the `overrides` field rather than spreading them into `nodes`, otherwise `this.base` cannot find the original handler. The `printer.nodes` option on `@kubb/plugin-ts`, `@kubb/plugin-zod`, and `@kubb/plugin-faker` feeds this map. See [Customize printers](/docs/5.x/how-to/printers).

See [Import a custom codec](/extensions/kubb-labs/plugin-zod/guides/customization#import-a-custom-codec) for a complete example and [Parsers concepts](/docs/5.x/explanation/architecture#parsers) for how parsers consume printers.

### Printer handlers and context

The map is keyed by the schema `type` discriminant, such as `'string'`, `'integer'`, `'date'`, `'enum'`, or `'object'`. Supply only the handlers you want to replace and the built-in ones fill in the rest.

```typescript [Type definition]
type PrinterNodes = Partial<{
  [K in SchemaType]: (this: Context, node: SchemaNodeByType[K]) => Output | null
}>
```

Handlers run with a `this` context, so write them as regular functions rather than arrow functions. `this.transform(node)` recurses into a nested schema node through the full handler map, overrides included. `this.base(node)` runs the built-in handler your override replaced, so you can wrap its output instead of rebuilding it. `this.options` reads the resolved printer options, such as `arrayType` on `@kubb/plugin-ts` or `direction` on `@kubb/plugin-zod`. Inside a handler, `this.import(ast.factory.createImport(...))` declares an import the printed code needs. Only `@kubb/plugin-zod` collects these imports today. `@kubb/plugin-ts` and `@kubb/plugin-faker` drop them, so a handler there must print code that needs no new import. In your own generator, call `printer.drainImports()` after printing to collect them.
