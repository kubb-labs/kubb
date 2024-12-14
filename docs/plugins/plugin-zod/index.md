---
layout: doc

title: \@kubb/plugin-zod
outline: deep
---

# @kubb/plugin-zod

With the Zod plugin you can use [Zod](https://zod.dev/) to validate your schema's.

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

Path to the output folder or file that will contain the generated code.

> [!TIP]
> if `output.path` is a file, `group` cannot be used.

|           |          |
|----------:|:---------|
|     Type: | `string` |
| Required: | `true`   |
|  Default: | `'zod'`  |

#### output.barrelType

Define what needs to be exported, here you can also disable the export of barrel files.

> [!TIP]
> Using propagate will prevent a plugin from creating a barrel file, but it will still propagate, allowing [`output.barrelType`](/getting-started/configure#output-barreltype) to export the specific function or type.

|           |                                 |
|----------:|:--------------------------------|
|     Type: | `'all' \| 'named' \| 'propagate' \| false` |
| Required: | `false`                         |
|  Default: | `'named'`                       |

<!--@include: ../core/barrelTypes.md-->

#### output.banner
Add a banner text in the beginning of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string` |
| Required: | `false`                               |

#### output.footer
Add a footer text at the end of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string` |
| Required: | `false`                               |

### group
<!--@include: ../core/group.md-->

#### group.type
Define a type where to group the files on.

|           |         |
|----------:|:--------|
|     Type: | `'tag'` |
| Required: | `true`  |

<!--@include: ../core/groupTypes.md-->

#### group.name

Return the name of a group based on the group name, this will be used for the file and name generation.

|           |                                     |
|----------:|:------------------------------------|
|     Type: | `(context: GroupContext) => string` |
| Required: | `false`                             |
|  Default: | `(ctx) => '${ctx.group}Controller'`  |

### importPath

|           |          |
|----------:|:---------|
|     Type: | `string` |
| Required: | `false`  |
|  Default: | `'zod'`  |

### typed

Use TypeScript(`@kubb/plugin-ts`) to add type annotation.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### inferred

Return Zod generated schema as type with z.infer.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### dateType

Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.<br/>
See [datetimes](https://zod.dev/?id=datetimes).

|           |                                                                  |
|----------:|:-----------------------------------------------------------------|
|     Type: | `false \| 'string' \| 'stringOffset' \| 'stringLocal' \| 'date'` |
| Required: | `false`                                                          |
|  Default: | `'string''`                                                         |


::: code-group
```typescript [false]
z.string()
```
```typescript ['string']
z.string().datetime()
```
```typescript ['stringOffset']
z.string().datetime({ offset: true })
```

```typescript ['stringLocal']
z.string().datetime({ local: true })
```

```typescript ['date']
z.date()
```
:::

### unknownType

Which type to use when the Swagger/OpenAPI file is not providing more information.

|           |                      |
|----------:|:---------------------|
|     Type: | `'any' \| 'unknown'` |
| Required: | `false`              |
|  Default: | `'any'`              |


::: code-group
```typescript ['any']
z.any()
```
```typescript ['unknown']
z.unknown()
```
:::

### coercion

Use of z.coerce.string() instead of z.string().
[Coercion for primitives](https://zod.dev/?id=coercion-for-primitives)

|           |           |
|----------:|:----------|
|     Type: | `boolean \| { dates?: boolean, strings?: boolean, numbers?: boolean}` |
| Required: | `false`   |
|  Default: | `false'`  |


::: code-group
```typescript [true]
z.coerce.string()
z.coerce.date()
z.coerce.number()
```
```typescript [false]
z.string()
z.date()
z.number()
```
```typescript [{numbers: true, strings: false, dates: false}]
z.string()
z.date()
z.coerce.number()
```
:::

### operations

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### mapper

|           |           |
|----------:|:----------|
|     Type: | `Record<string, string>` |
| Required: | `false`   |

### exclude
<!--@include: ../core/exclude.md-->

### override
<!--@include: ../core/override.md-->

### generators <img src="/icons/experimental.svg"/>
<!--@include: ../core/generators.md-->

|           |                               |
|----------:|:------------------------------|
|     Type: | `Array<Generator<PluginZod>>` |
| Required: | `false`                       |


### transformers
<!--@include: ../core/transformers.md-->

#### transformers.name
Customize the names based on the type that is provided by the plugin.

|           |                                                                               |
|----------:|:------------------------------------------------------------------------------|
|     Type: | `(name: string, type?: ResolveType) => string` |
| Required: | `false`                                                                       |

```typescript
type ResolveType = 'file' | 'function' | 'type' | 'const'
```


#### transformers.schema
Customize the schema based on the type that is provided by the plugin.

|           |                                                                                                                             |
|----------:|:----------------------------------------------------------------------------------------------------------------------------|
|     Type: | `(props: { schema?: SchemaObject; name?: string; parentName?: string}, defaultSchemas: Schema[],) => Schema[] \| undefined` |
| Required: | `false`                                                                                                                     |

## Example
```typescript twoslash
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginZod } from '@kubb/plugin-zod'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginZod({
      output: {
        path: './zod',
      },
      group: { type: 'tag', name: ({ group }) => `${group}Schemas` },
      typed: true,
      dateType: 'stringOffset',
      unknownType: 'unknown',
      importPath: 'zod'
    }),
  ],
})
```

## Links

- [Zod](https://zod.dev/)
