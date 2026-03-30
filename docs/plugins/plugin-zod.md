---
layout: doc

title: Kubb Zod Plugin - Generate Zod Schemas
description: Generate Zod validation schemas from OpenAPI specifications with @kubb/plugin-zod. Runtime type validation with Zod v4 support.
outline: deep
---

# @kubb/plugin-zod

Generate [Zod](https://zod.dev/) validation schemas from your OpenAPI schema.

Kubb v5 always generates **Zod v4** schemas. Zod v3 is no longer supported.

## Installation

::: code-group
```shell [bun]
bun add -d @kubb/plugin-zod
```

```shell [pnpm]
pnpm add -D @kubb/plugin-zod
```

```shell [npm]
npm install --save-dev @kubb/plugin-zod
```

```shell [yarn]
yarn add -D @kubb/plugin-zod
```

:::

## Options

### output

Specify the export location for the files and define the behavior of the output.

#### output.path

Path to the output folder or file that contains the generated code.

> [!TIP]
> if `output.path` is a file, `group` cannot be used.

|           |          |
| --------: | :------- |
|     Type: | `string` |
| Required: | `true`   |
|  Default: | `'zod'`  |

#### output.barrelType

Specify what to export and optionally disable barrel file generation.

> [!TIP]
> Using propagate will prevent a plugin from creating a barrel file, but it will still propagate, allowing [`output.barrelType`](/getting-started/configure#output-barreltype) to export the specific function or type.

|           |                                            |
| --------: | :----------------------------------------- |
|     Type: | `'all' \| 'named' \| 'propagate' \| false` |
| Required: | `false`                                    |
|  Default: | `'named'`                                  |

<!--@include: ./core/barrelTypes.md-->

#### output.banner

Add a banner comment at the top of every generated file.

|           |                                              |
|----------:|:---------------------------------------------|
|     Type: | `string \| ((node: RootNode) => string)`     |
| Required: | `false`                                      |

#### output.footer

Add a footer comment at the end of every generated file.

|           |                                              |
|----------:|:---------------------------------------------|
|     Type: | `string \| ((node: RootNode) => string)`     |
| Required: | `false`                                      |

#### output.override
<!--@include: ./core/outputOverride.md-->

### compatibilityPreset

<!--@include: ./core/compatibilityPreset.md-->

### resolvers

<!--@include: ./core/resolvers.md-->

### group

<!--@include: ./core/group.md-->

#### group.type

Specify the property to group files by. Required when `group` is defined.

|           |         |
|----------:|:--------|
|     Type: | `'tag'` |
| Required: | `true*` |

> [!NOTE]
> `Required: true*` means this is required only when the `group` option is used. The `group` option itself is optional.

<!--@include: ./core/groupTypes.md-->

#### group.name

Return the name of a group based on the group name, this will be used for the file and name generation.

|           |                                     |
| --------: | :---------------------------------- |
|     Type: | `(context: GroupContext) => string` |
| Required: | `false`                             |
|  Default: | `(ctx) => '${ctx.group}Controller'` |

### importPath

|           |          |
| --------: | :------- |
|     Type: | `string` |
| Required: | `false`  |
|  Default: | `'zod'`  |

### typed

Use TypeScript(`@kubb/plugin-ts`) to add type annotation.

> [!IMPORTANT]
> We rely on [`ToZod`](https://github.com/colinhacks/tozod) from the creator of Zod to create a schema based on a type.
> Kubb contains its own version to those kind of conversions.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### inferred

Return Zod generated schema as type with z.infer.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### dateType

Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.<br/>
See [DateTimes](https://zod.dev/?id=datetimes).

|           |                                                                  |
| --------: | :--------------------------------------------------------------- |
|     Type: | `false \| 'string' \| 'stringOffset' \| 'stringLocal' \| 'date'` |
| Required: | `false`                                                          |
|  Default: | `'string'`                                                       |

::: code-group

```typescript [false]
z.string();
```

```typescript ['string']
z.string().datetime();
```

```typescript ['stringOffset']
z.string().datetime({ offset: true });
```

```typescript ['stringLocal']
z.string().datetime({ local: true });
```

```typescript ['date']
z.date();
```

:::

### coercion

Use of z.coerce.string() instead of z.string().
[Coercion for primitives](https://zod.dev/?id=coercion-for-primitives)

|           |                                                                       |
| --------: | :-------------------------------------------------------------------- |
|     Type: | `boolean \| { dates?: boolean, strings?: boolean, numbers?: boolean}` |
| Required: | `false`                                                               |
|  Default: | `false'`                                                              |

::: code-group

```typescript [true]
z.coerce.string();
z.coerce.date();
z.coerce.number();
```

```typescript [false]
z.string();
z.date();
z.number();
```

```typescript [{numbers: true, strings: false, dates: false}]
z.string();
z.date();
z.coerce.number();
```

:::

### operations

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### paramsCasing

How to style your params, by default no casing is applied.

|           |                |
| --------: | :------------- |
|     Type: | `'camelcase'`  |
| Required: | `false`        |

### guidType

Which validator to use for OpenAPI `format: uuid`.

|           |                    |
| --------: | :----------------- |
|     Type: | `'uuid' \| 'guid'` |
| Required: | `false`            |
|  Default: | `'uuid'`           |

::: code-group

```typescript ['uuid' (default)]
z.uuid()
```

```typescript ['guid']
z.guid()
```

:::

### mini <Badge type="tip" text="beta" />

Use Zod Mini's functional API for better tree-shaking support.

When enabled, generates functional syntax (e.g., `z.optional(z.string())`) instead of chainable methods (e.g., `z.string().optional()`).

When `mini: true`, `importPath` will default to `'zod/mini'`.

> [!WARNING]
> This feature is currently in beta. The API may change in future releases.

> [!TIP]
> Zod Mini provides a smaller bundle size with better tree-shaking. See [Zod Mini documentation](https://zod.dev/packages/mini) for more details.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

::: code-group

```typescript [mini: true]
// Import from zod/mini
import { z } from 'zod/mini'

// Functional syntax for better tree-shaking
z.optional(z.string())
z.nullable(z.number())
z.array(z.string()).check(z.minLength(1), z.maxLength(10))
```

```typescript [mini: false (default)]
// Import from zod or zod/v4
import { z } from 'zod'

// Chainable method syntax
z.string().optional()
z.number().nullable()
z.array(z.string()).min(1).max(10)
```

:::

### include

<!--@include: ./core/include.md-->

### exclude

<!--@include: ./core/exclude.md-->

### override

<!--@include: ./core/override.md-->

### generators <img src="../public/icons/experimental.svg"/>

<!--@include: ./core/generators.md-->

|           |                               |
| --------: | :---------------------------- |
|     Type: | `Array<Generator<PluginZod>>` |
| Required: | `false`                       |

### transformers

Array of AST visitors applied to each node before printing. See [`transform()`](https://github.com/kubb-labs/kubb/blob/main/packages/ast/src/transform.ts) from `@kubb/ast`.

|           |                     |
| --------: | :------------------ |
|     Type: | `Array<Visitor>`    |
| Required: | `false`             |

### wrapOutput

Modify the generated zod schema.

> [!TIP]
> This is useful for cases where you need to extend the generated zod output with additional properties from an OpenAPI schema. E.g. in the case of `OpenAPI -> Zod -> OpenAPI`, you could include the examples from the schema for a given property and then ultimately provide a modified schema to a router that supports zod and OpenAPI spec generation.

```typescript [Conditionally append .openapi() to the generated schema]
wrapOutput: ({ output, schema }) => {
  const metadata: Record<string, unknown> = {};

  if (schema.keywords?.includes('example')) {
    // access SchemaNode properties
  }

  if (Object.keys(metadata).length > 0) {
    return `${output}.openapi(${JSON.stringify(metadata)})`;
  }
};
```

|           |                                                                         |
| --------: | :---------------------------------------------------------------------- |
|     Type: | `(arg: { output: string; schema: SchemaNode }) => string \| undefined`  |
| Required: | `false`                                                                 |

## Example

```typescript twoslash
import { adapterOas } from "@kubb/adapter-oas";
import { defineConfig } from "@kubb/core";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginZod } from "@kubb/plugin-zod";

export default defineConfig({
  input: {
    path: "./petStore.yaml",
  },
  output: {
    path: "./src/gen",
  },
  adapter: adapterOas(),
  plugins: [
    pluginTs(),
    pluginZod({
      output: {
        path: "./zod",
      },
      group: { type: "tag", name: ({ group }) => `${group}Schemas` },
      typed: true,
      dateType: "stringOffset",
      importPath: "zod",
    }),
  ],
});
```

## See Also

- [Zod](https://zod.dev/)
