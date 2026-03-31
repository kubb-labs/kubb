---
layout: doc

title: Kubb TypeScript Plugin - Generate TypeScript Types
description: Generate TypeScript types and interfaces from OpenAPI schemas with @kubb/plugin-ts. Type-safe API integration for TypeScript projects.
outline: deep
---

# @kubb/plugin-ts

Generate TypeScript types from your OpenAPI schema. Use this plugin to produce type-safe representations of your API's request and response shapes, giving your TypeScript project compile-time guarantees over every API interaction.

## Installation

::: code-group

```shell [bun]
bun add -d @kubb/plugin-ts
```

```shell [pnpm]
pnpm add -D @kubb/plugin-ts
```

```shell [npm]
npm install --save-dev @kubb/plugin-ts
```

```shell [yarn]
yarn add -D @kubb/plugin-ts
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
|  Default: | `'types'` |

#### output.barrelType

<!--@include: ./core/outputBarrelType.md-->

#### output.banner

<!--@include: ./core/outputBanner.md-->

#### output.footer

<!--@include: ./core/outputFooter.md-->

#### output.override

<!--@include: ./core/outputOverride.md-->

### contentType

<!--@include: ./core/contentType.md-->

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

### enumType

Choose to use `enum` or `as const` for enums.

|           |                                                                                         |
| --------: | :-------------------------------------------------------------------------------------- |
|     Type: | `'enum' \| 'asConst' \| 'asPascalConst' \| 'constEnum' \| 'literal' \| 'inlineLiteral'` |
| Required: | `false`                                                                                 |
|  Default: | `'asConst'`                                                                             |

> [!TIP]
> The difference between `asConst` and `asPascalConst` is the casing of the constant variable name:
>
> - `asConst`: generates a camelCase constant name (e.g., `petType`)
> - `asPascalConst`: generates a PascalCase constant name (e.g., `PetType`)

> [!TIP]
> Consider `'inlineLiteral'` for the most idiomatic output — enum values are inlined directly into the property type instead of creating a separate named type.

::: code-group

```typescript ['enum']
enum PetType {
  Dog = 'dog',
  Cat = 'cat',
}
```

```typescript ['asConst']
const petType = {
  Dog: 'dog',
  Cat: 'cat',
} as const;
```

```typescript ['asPascalConst']
const PetType = {
  Dog: 'dog',
  Cat: 'cat',
} as const;
```

```typescript ['constEnum']
const enum PetType {
  Dog = 'dog',
  Cat = 'cat',
}
```

```typescript ['literal']
type PetType = 'dog' | 'cat';
```

```typescript ['inlineLiteral']
// Enum values are inlined directly into the type
export interface Pet {
  status?: 'available' | 'pending' | 'sold';
}
```

:::

### enumSuffix

> [!WARNING]
> This option has been moved to [`adapterOas`](/adapters/adapter-oas#enumSuffix). Use `adapterOas({ enumSuffix })` instead.

### enumTypeSuffix

Suffix appended to the generated type alias name when `enumType` is `asConst` or `asPascalConst`.

Only the type alias is affected — the const object name stays unchanged.

|           |          |
| --------: | :------- |
|     Type: | `string` |
| Required: | `false`  |
|  Default: | `'Key'`  |

::: code-group

```typescript ['Key' (default)]
const petType = {
  Dog: 'dog',
  Cat: 'cat',
} as const;

export type PetTypeKey = (typeof petType)[keyof typeof petType];
```

```typescript ['Value']
// enumTypeSuffix: 'Value'
const petType = {
  Dog: 'dog',
  Cat: 'cat',
} as const;

export type PetTypeValue = (typeof petType)[keyof typeof petType];
```

```typescript ['' (no suffix)]
// enumTypeSuffix: ''
const petType = {
  Dog: 'dog',
  Cat: 'cat',
} as const;

export type PetType = (typeof petType)[keyof typeof petType];
```

:::

### enumKeyCasing

Control the casing applied to enum key names in generated TypeScript. Use this to align generated enum keys with your project's naming conventions.

|           |                                                                                |
| --------: | :----------------------------------------------------------------------------- |
|     Type: | `'screamingSnakeCase' \| 'snakeCase' \| 'pascalCase' \| 'camelCase' \| 'none'` |
| Required: | `false`                                                                        |
|  Default: | `'none'`                                                                       |

- `'screamingSnakeCase'`: `ENUM_VALUE`
- `'snakeCase'`: `enum_value`
- `'pascalCase'`: `EnumValue`
- `'camelCase'`: `enumValue`
- `'none'`: Uses the enum value as-is

### dateType

> [!WARNING]
> This option has been moved to [`adapterOas`](/adapters/adapter-oas#dateType). Use `adapterOas({ dateType })` instead.

### integerType

> [!WARNING]
> This option has been moved to [`adapterOas`](/adapters/adapter-oas#integerType). Use `adapterOas({ integerType })` instead.

### syntaxType

Control whether the TypeScript generator emits `type` aliases or `interface` declarations for object schemas.
See [Type vs Interface: Which Should You Use](https://www.totaltypescript.com/type-vs-interface-which-should-you-use).

|           |                         |
| --------: | :---------------------- |
|     Type: | `'type' \| 'interface'` |
| Required: | `false`                 |
|  Default: | `'type'`                |

::: code-group

```typescript ['type']
type Pet = {
  name: string;
};
```

```typescript ['interface']
interface Pet {
  name: string;
}
```

:::

### unknownType

> [!WARNING]
> This option has been moved to [`adapterOas`](/adapters/adapter-oas#unknownType). Use `adapterOas({ unknownType })` instead.

### emptySchemaType

> [!WARNING]
> This option has been moved to [`adapterOas`](/adapters/adapter-oas#emptySchemaType). Use `adapterOas({ emptySchemaType })` instead.

### optionalType

Control how optional properties are represented in generated TypeScript types.

|           |                                                                 |
| --------: | :-------------------------------------------------------------- |
|     Type: | `'questionToken' \| 'undefined' \| 'questionTokenAndUndefined'` |
| Required: | `false`                                                         |
|  Default: | `'questionToken'`                                               |

::: code-group

```typescript ['questionToken']
type Pet = {
  type?: string;
};
```

```typescript ['undefined']
type Pet = {
  type: string | undefined;
};
```

```typescript ['questionTokenAndUndefined']
type Pet = {
  type?: string | undefined;
};
```

:::

### arrayType

Choose between `Array<Type>` or `Type[]` syntax for array types.

|           |                        |
| --------: | :--------------------- |
|     Type: | `'array' \| 'generic'` |
| Required: | `false`                |
|  Default: | `'array'`              |

::: code-group

```typescript ['array']
type Pet = {
  tags: string[];
};
```

```typescript ['generic']
type Pet = {
  tags: Array<string>;
};
```

:::

### paramsCasing

Transform parameter names to a specific casing format for path, query, and header parameters.

> [!IMPORTANT]
> When enabled, this option transforms property names in `PathParams`, `QueryParams`, and `HeaderParams` types to the specified casing. Response and request body types are **not** affected.
>
> All plugins that reference parameters (like `@kubb/plugin-client`, `@kubb/plugin-react-query`, `@kubb/plugin-swr`, `@kubb/plugin-faker`, `@kubb/plugin-mcp`) should use the same `paramsCasing` setting to ensure type compatibility.

|           |              |
| --------: | :----------- |
|     Type: | `'camelcase'` |
| Required: | `false`      |
|  Default: | `undefined`  |

::: code-group

```typescript [Original API]
// OpenAPI spec has: step_id, X-Custom-Header, bool_param

// Without paramsCasing
type FindPetsByStatusPathParams = {
  step_id: string;
};

type FindPetsByStatusQueryParams = {
  bool_param?: boolean;
};

type FindPetsByStatusHeaderParams = {
  'X-Custom-Header'?: string;
};
```

```typescript [With paramsCasing: 'camelcase']
// Properties are transformed to camelCase

type FindPetsByStatusPathParams = {
  stepId: string;  // ✓ camelCase
};

type FindPetsByStatusQueryParams = {
  boolParam?: boolean;  // ✓ camelCase
};

type FindPetsByStatusHeaderParams = {
  xCustomHeader?: string;  // ✓ camelCase
};
```

:::

### compatibilityPreset

<!--@include: ./core/compatibilityPreset.md-->

::: code-group

```typescript [Default]
pluginTs({
  compatibilityPreset: 'default',
});
```

```typescript [Kubb v4 compatibility]
pluginTs({
  compatibilityPreset: 'kubbV4',
});
```

:::

### resolvers

<!--@include: ./core/resolvers.md-->

Resolver precedence for `@kubb/plugin-ts`:

1. Start with `resolverTs`.
2. Apply `compatibilityPreset` resolver (`kubbV4`) when configured.
3. Apply explicit `resolvers` overrides (last wins).

|           |                     |
| --------: | :------------------ |
|     Type: | `Array<ResolverTs>` |
| Required: | `false`             |
|  Default: | `[resolverTs]`      |

::: code-group

```typescript [v4 compatibility]
import { pluginTs } from '@kubb/plugin-ts';

pluginTs({
  compatibilityPreset: 'kubbV4',
});
```

```typescript [Explicit resolver override]
import { pluginTs } from '@kubb/plugin-ts';
import { resolverTs } from '@kubb/plugin-ts/resolvers';

pluginTs({
  compatibilityPreset: 'default',
  resolvers: [resolverTs], // explicit resolvers take precedence
});
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

|           |                              |
| --------: | :--------------------------- |
|     Type: | `Array<Generator<PluginTs>>` |
| Required: | `false`                      |

### transformers

<!--@include: ./core/transformers.md-->

> [!NOTE]
> `@kubb/plugin-ts` uses AST `Visitor` transformers for schema/operation node transforms. For output naming customization, use `resolvers` instead of `transformers`.

## Example

```typescript twoslash
import { adapterOas } from '@kubb/adapter-oas';
import { defineConfig } from '@kubb/core';
import { pluginTs } from '@kubb/plugin-ts';

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  adapter: adapterOas(),
  plugins: [
    pluginTs({
      output: {
        path: './types',
      },
      exclude: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Controller`,
      },
      enumType: 'asConst',
      optionalType: 'questionTokenAndUndefined',
      paramsCasing: 'camelcase',
    }),
  ],
});
```

## See Also

- [TypeScript](https://www.typescriptlang.org/)
- [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
