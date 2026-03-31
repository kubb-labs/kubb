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

<!--@include: ./core/outputPath.md-->

|           |           |
| --------: | :-------- |
|     Type: | `string`  |
| Required: | `true`    |
|  Default: | `'zod'` |

#### output.barrelType

<!--@include: ./core/outputBarrelType.md-->

#### output.banner

<!--@include: ./core/outputBanner.md-->

#### output.footer

<!--@include: ./core/outputFooter.md-->

#### output.override

<!--@include: ./core/outputOverride.md-->

### compatibilityPreset

<!--@include: ./core/compatibilityPreset.md-->

### resolvers

<!--@include: ./core/resolvers.md-->

### group

<!--@include: ./core/group.md-->

#### group.type

<!--@include: ./core/groupType.md-->

#### group.name

Return the name of a group based on the group name, this will be used for the file and name generation.

|           |                                     |
| --------: | :---------------------------------- |
|     Type: | `(context: GroupContext) => string` |
| Required: | `false`                             |
|  Default: | `(ctx) => '${ctx.group}Controller'` |

### importPath

Path to the Zod package used in generated import statements. Accepts a package name or a relative path. Set to `'zod/mini'` when using `mini: true`.

|           |          |
| --------: | :------- |
|     Type: | `string` |
| Required: | `false`  |
|  Default: | `'zod'`  |

### typed

Annotate each generated schema with its inferred TypeScript type, using `@kubb/plugin-ts` output as the source. Requires `@kubb/plugin-ts` to be configured in the same `plugins` array.

> [!IMPORTANT]
> We rely on [`ToZod`](https://github.com/colinhacks/tozod) from the creator of Zod to create a schema based on a type.
> Kubb contains its own version to those kind of conversions.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### inferred

Export a `z.infer<typeof schema>` type alias alongside each generated schema. This gives you a TypeScript type that always stays in sync with the schema's runtime validation.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

```typescript [inferred: true]
import { z } from 'zod'

export const petSchema = z.object({
  name: z.string(),
  status: z.enum(['available', 'pending', 'sold']).optional(),
})

// Inferred type export
export type Pet = z.infer<typeof petSchema>
```

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

### integerType

> [!WARNING]
> This option has been moved to [`adapterOas`](/adapters/adapter-oas#integerType). Use `adapterOas({ integerType })` instead.

### unknownType

> [!WARNING]
> This option has been moved to [`adapterOas`](/adapters/adapter-oas#unknownType). Use `adapterOas({ unknownType })` instead.

### emptySchemaType

> [!WARNING]
> This option has been moved to [`adapterOas`](/adapters/adapter-oas#emptySchemaType). Use `adapterOas({ emptySchemaType })` instead.

### coercion

Apply `z.coerce` to automatically convert input values to the expected type before validation. Pass `true` to coerce all primitives, or an object to selectively enable coercion for `dates`, `strings`, and `numbers`. See [Coercion for primitives](https://zod.dev/?id=coercion-for-primitives).

|           |                                                                       |
| --------: | :-------------------------------------------------------------------- |
|     Type: | `boolean \| { dates?: boolean, strings?: boolean, numbers?: boolean}` |
| Required: | `false`                                                               |
|  Default: | `false`                                                               |

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

Generate a combined `operations.ts` file that exports all operation-level schemas grouped by `operationId`. When enabled, each operation gets its own schema that includes the request body, path params, query params, and response schemas.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### paramsCasing

Transform property names in path, query, and header parameter types to camelCase.

|           |                |
| --------: | :------------- |
|     Type: | `'camelcase'`  |
| Required: | `false`        |

```typescript ['camelcase']
// OpenAPI spec uses: pet_id, X-Api-Key

type GetPetPathParams = {
  petId: string   // ✓ camelCase
}

type GetPetHeaderParams = {
  xApiKey?: string  // ✓ camelCase
}
```

### guidType

Validator to use for OpenAPI properties with `format: uuid`. Use `'guid'` to generate `.guid()` validation instead of the default `.uuid()`.

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

<!--@include: ./core/transformers.md-->

### wrapOutput

Wrap the generated Zod schema string with additional validation or metadata. The callback receives the schema's output string and the `SchemaNode` AST node, and returns the modified schema string.

|           |                                                                         |
| --------: | :---------------------------------------------------------------------- |
|     Type: | `(arg: { output: string; schema: SchemaNode }) => string \| undefined`  |
| Required: | `false`                                                                 |

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

## Example

```typescript twoslash
import { adapterOas } from '@kubb/adapter-oas';
import { defineConfig } from '@kubb/core';
import { pluginTs } from '@kubb/plugin-ts';
import { pluginZod } from '@kubb/plugin-zod';

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  adapter: adapterOas(),
  plugins: [
    pluginTs(),
    pluginZod({
      output: {
        path: './zod',
      },
      group: { type: 'tag', name: ({ group }) => `${group}Schemas` },
      typed: true,
      dateType: 'stringOffset',
      importPath: 'zod',
    }),
  ],
});
```

## See Also

- [Zod](https://zod.dev/)
