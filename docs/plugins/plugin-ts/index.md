---
layout: doc

title: \@kubb/plugin-ts
outline: deep
---

# @kubb/plugin-ts

With the TypeScript plugin you can create [TypeScript](https://www.typescriptlang.org/) types.

## Installation
::: code-group

```shell [bun]
bun add @kubb/plugin-ts
```

```shell [pnpm]
pnpm add @kubb/plugin-ts
```

```shell [npm]
npm install @kubb/plugin-ts
```

```shell [yarn]
yarn add @kubb/plugin-ts
```
:::

## Options

### output
Specify the export location for the files and define the behavior of the output.

#### output.path

Path to the output folder or file that will contain the generated code.

> [!TIP]
> if `output.path` is a file, `group` cannot be used.

|           |           |
|----------:|:----------|
|     Type: | `string`  |
| Required: | `true`    |
|  Default: | `'types'` |

#### output.barrelType

Define what needs to be exported, here you can also disable the export of barrel files.

|           |                             |
|----------:|:----------------------------|
|     Type: | `'all' \| 'named' \| false` |
| Required: | `false`                     |
|  Default: | `'named'`                   |

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

### enumType

Choose to use `enum` or `as const` for enums.

|           |                                                                      |
|----------:|:---------------------------------------------------------------------|
|     Type: | `'enum' \| 'asConst' \| 'asPascalConst' \| 'constEnum' \| 'literal'` |
| Required: | `false`                                                              |
|  Default: | `'asConst'`                                                               |

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
} as const
```

```typescript ['asPascalConst']
const PetType = {
  Dog: 'dog',
  Cat: 'cat',
} as const
```

```typescript ['constEnum']
const enum PetType {
  Dog = 'dog',
  Cat = 'cat',
}
```

```typescript ['literal']
type PetType = 'dog' | 'cat'
```
:::

### enumSuffix
Set a suffix for the generated enums.

|           |                                     |
|----------:|:------------------------------------|
|     Type: | `string`                            |
| Required: | `false`                             |
|  Default: | `''` |

### dateType
Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.

|           |                      |
|----------:|:---------------------|
|     Type: | `'string' \| 'date'` |
| Required: | `false`              |
|  Default: | `'string'`           |

::: code-group

```typescript ['string']
type Pet = {
  date: string
}
```

```typescript ['date']
type Pet = {
  date: Date
}
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
type Pet = {
  name: any
}
```

```typescript ['unknown']
type Pet = {
  name: unknown
}
```
:::

### optionalType
Choose what to use as mode for an optional value.

|           |                                                                 |
|----------:|:----------------------------------------------------------------|
|     Type: | `'questionToken' \| 'undefined' \| 'questionTokenAndUndefined'` |
| Required: | `false`                                                         |
|  Default: | `'questionToken'`                                                            |

::: code-group
```typescript ['questionToken']
type Pet = {
  type?: string
}
```

```typescript ['undefined']
type Pet = {
  type: string | undefined
}
```

```typescript ['questionTokenAndUndefined']
type Pet = {
  type?: string | undefined
}
```
:::

### oasType

Export an Oas object as Oas type with `import type { Infer } from '@kubb/plugin-ts/oas'` <br/>
See [infer](/helpers/oas) in how to use the types with `@kubb/plugin-ts/oas`.<br/>

|           |                    |
|----------:|:-------------------|
|     Type: | `'infer' \| false` |
| Required: | `false`            |


### include
<!--@include: ../core/include.md-->

### exclude
<!--@include: ../core/exclude.md-->


### override
<!--@include: ../core/override.md-->


### generators <img src="/icons/experimental.svg"/>
<!--@include: ../core/generators.md-->

|           |                              |
|----------:|:-----------------------------|
|     Type: | `Array<Generator<PluginTs>>` |
| Required: | `false`                      |


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

## Example

```typescript twoslash
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
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
        name: ({ group }) => `'${group}Controller`
      },
      enumType: "asConst",
      enumSuffix: 'Enum',
      dateType: 'date',
      unknownType: 'unknown',
      optionalType: 'questionTokenAndUndefined',
      oasType: false,
    }),
  ],
})
```

## Links

- [TypeScript](https://www.typescriptlang.org/)
- [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
