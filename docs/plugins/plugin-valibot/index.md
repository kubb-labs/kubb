---
layout: doc

title: \@kubb/plugin-valibot
outline: deep
---

# @kubb/plugin-valibot

<Badge type="warning" text="Beta" />

With the Valibot plugin you can use [Valibot](https://valibot.dev/) to validate your schemas based on an OpenAPI specification.

> [!WARNING]
> This plugin is in beta. Please report any issues you encounter.

## Installation

::: code-group
```shell [bun]
bun add -d @kubb/plugin-valibot
```

```shell [pnpm]
pnpm add -D @kubb/plugin-valibot
```

```shell [npm]
npm install --save-dev @kubb/plugin-valibot
```

```shell [yarn]
yarn add -D @kubb/plugin-valibot
```

:::

## Options

### output

Specify the export location for the files and define the behavior of the output.

#### output.path

Path to the output folder or file that will contain the generated code.

> [!TIP]
> if `output.path` is a file, `group` cannot be used.

|           |             |
| --------: | :---------- |
|     Type: | `string`    |
| Required: | `true`      |
|  Default: | `'valibot'` |

#### output.barrelType

Define what needs to be exported, here you can also disable the export of barrel files.

> [!TIP]
> Using propagate will prevent a plugin from creating a barrel file, but it will still propagate, allowing [`output.barrelType`](/getting-started/configure#output-barreltype) to export the specific function or type.

|           |                                            |
| --------: | :----------------------------------------- |
|     Type: | `'all' \| 'named' \| 'propagate' \| false` |
| Required: | `false`                                    |
|  Default: | `'named'`                                  |

<!--@include: ../core/barrelTypes.md-->

#### output.banner

Add a banner text in the beginning of every file.

|           |                                  |
| --------: | :------------------------------- |
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                          |

#### output.footer

Add a footer text at the end of every file.

|           |                                  |
| --------: | :------------------------------- |
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                          |

### contentType

<!--@include: ../core/contentType.md-->

### group

<!--@include: ../core/group.md-->

#### group.type

Define a type where to group the files on.

|           |                     |
| --------: | :------------------ |
|     Type: | `'tag' \| 'path'`   |
| Required: | `true`              |

#### group.name

Provide the ability to override the name of the group, useful when you want to rename a tag.

|           |                              |
| --------: | :--------------------------- |
|     Type: | `(context) => string`        |
| Required: | `false`                      |

### exclude

<!--@include: ../core/exclude.md-->

### include

<!--@include: ../core/include.md-->

### override

<!--@include: ../core/override.md-->

### transformers

<!--@include: ../core/transformers.md-->

### importPath

Path to Valibot.
It will be used as `import * as v from '${importPath}'`.
It allows both relative and absolute path.
The path will be applied as is, so relative path should be based on the file being generated.

|           |            |
| --------: | :--------- |
|     Type: | `string`   |
| Required: | `false`    |
|  Default: | `'valibot'`|

### dateType

Choose to use `date` as JavaScript `Date` instead of `string`.

|           |                                  |
| --------: | :------------------------------- |
|     Type: | `false \| 'string' \| 'date'`    |
| Required: | `false`                          |
|  Default: | `'string'`                       |

### unknownType

Which type to use when the Swagger/OpenAPI file is not providing more information.

|           |                       |
| --------: | :-------------------- |
|     Type: | `'any' \| 'unknown'`  |
| Required: | `false`               |
|  Default: | `'any'`               |

### emptySchemaType

Which type to use for empty schema values.

|           |                              |
| --------: | :--------------------------- |
|     Type: | `'any' \| 'unknown'`         |
| Required: | `false`                      |
|  Default: | `unknownType`                |

### typed

Use TypeScript(`@kubb/plugin-ts`) to add type annotation.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### inferred

Return Valibot generated schema as type with `v.InferOutput<typeof Type>`.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### operations

Generate schemas for operations (request/response).

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### mapper

Use custom Valibot schema for specific schema names.

|           |                            |
| --------: | :------------------------- |
|     Type: | `Record<string, string>`   |
| Required: | `false`                    |

### generators

Define some generators next to the Valibot generators.

|           |                                        |
| --------: | :------------------------------------- |
|     Type: | `Array<Generator<PluginValibot>>`      |
| Required: | `false`                                |

## Example

```typescript
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginValibot } from '@kubb/plugin-valibot'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginTs(),
    pluginValibot({
      output: {
        path: './valibot',
      },
      inferred: true,
    }),
  ],
})
```

## Links

- [Valibot](https://valibot.dev/)
