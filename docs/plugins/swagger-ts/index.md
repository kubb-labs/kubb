---
layout: doc

title: \@kubb/plugin-ts
outline: deep
---

# @kubb/plugin-ts <a href="https://paka.dev/npm/@kubb/plugin-ts@latest/api">🦙</a>

With the Swagger TypeScript plugin you can create [TypeScript](https://www.typescriptlang.org/) types based on a Swagger file.

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/plugin-ts @kubb/swagger
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/plugin-ts @kubb/swagger
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/plugin-ts @kubb/swagger
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/plugin-ts @kubb/swagger
```

:::

## Options

### output

#### output.path

Relative path to save the TypeScript types. <br/>
When output is a file it will save all models inside that file else it will create a file per schema item.

::: info
Type: `string` <br/>
Default: `'types'`

```typescript twoslash
import { pluginTs } from '@kubb/plugin-ts'

const plugin = pluginTs({
  output: {
    path: './models',
  },
})
```
:::

#### output.exportAs

Name to be used for the `export * as {{exportAs}} from './'`

::: info
Type: `string` <br/>

```typescript twoslash
import { pluginTs } from '@kubb/plugin-ts'

const plugin = pluginTs({
  output: {
    path: './models',
    exportAs: 'models',
  },
})
```
:::

#### output.extName

Add an extension to the generated imports and exports, default it will not use an extension

::: info
Type: `string` <br/>

```typescript twoslash
import { pluginTs } from '@kubb/plugin-ts'

const plugin = pluginTs({
  output: {
    path: './models',
    extName: '.js',
  },
})
```
:::

#### output.exportType

Define what needs to exported, here you can also disable the export of barrel files

::: info
Type: `'barrel' | 'barrelNamed' | false` <br/>

```typescript twoslash
import { pluginTs } from '@kubb/plugin-ts'

const plugin = pluginTs({
  output: {
    path: './types',
    exportType: 'barrel',
  },
})
```

:::

### group

Group the TypeScript types based on the provided name.

#### group.type

Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### group.output
::: tip
When defining a custom output path, you should also update `output.path` to contain the same root path.
:::

::: v-pre
Relative path to save the grouped TypeScript Types.
`{{tag}}` will be replaced by the current tagName.
:::

::: v-pre
Type: `string` <br/>
Example: `models/{{tag}}Controller` => `models/PetController` <br/>
Default: `'${output}/{{tag}}Controller'`
:::

::: info

```typescript twoslash
import { pluginTs } from '@kubb/plugin-ts'

const plugin = pluginTs({
  output: {
    path: './types'
  },
  group: { type: 'tag', output: './types/{{tag}}Controller' },
})
```
:::

### enumType

Choose to use `enum` or `as const` for enums. <br/>
`asConst` will use camelCase for the naming. <br/>
`asPascalConst` will use PascalCase for the naming.

::: info TYPE

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

::: info

Type: `'enum' | 'asConst' | 'asPascalConst' | 'constEnum' | 'literal'` <br/>
Default: `'asConst'`

```typescript twoslash
import { pluginTs } from '@kubb/plugin-ts'

const plugin = pluginTs({
  enumType: 'enum',
})
```
:::

### enumSuffix

Set a suffix for the generated enums.

::: info TYPE

::: info

Type: `string` <br/>
Default: `''`

```typescript twoslash
import { pluginTs } from '@kubb/plugin-ts'

const plugin = pluginTs({
  enumSuffix: 'Enum',
})
```
:::

### dateType

Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.

::: info TYPE

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

::: info

Type: `'string' | 'date'` <br/>
Default: `'string'`

```typescript twoslash
import { pluginTs } from '@kubb/plugin-ts'

const plugin = pluginTs({
  dateType: 'string',
})
```
:::

### unknownType

Which type to use when the Swagger/OpenAPI file is not providing more information.

::: info TYPE

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

::: info
Type: `'any' | 'unknown'` <br/>
Default: `'any'`

```typescript twoslash
import { pluginTs } from '@kubb/plugin-ts'

const plugin = pluginTs({
  unknownType: 'any',
})
```
:::

### optionalType

Choose what to use as mode for an optional value.<br/>

::: info TYPE

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

::: info

Type: `'questionToken' | 'undefined' | 'questionTokenAndUndefined'` <br/>
Default: `'questionToken'`

```typescript twoslash
import { pluginTs } from '@kubb/plugin-ts'

const plugin = pluginTs({
  optionalType: 'questionToken',
})
```
:::

### oasType

Export an Oas object as Oas type with `import type { Infer } from '@kubb/plugin-ts/oas'` <br/>
See [infer](/plugins/plugin-ts/infer) in how to use the types with `@kubb/plugin-ts/oas`.<br/>

::: info
Type: `'infer' | false` <br/>

```typescript twoslash
import { pluginTs } from '@kubb/plugin-ts'

const plugin = pluginTs({
  oasType: 'infer',
})
```
:::


### include

Array containing include parameters to include tags/operations/methods/paths.

::: info TYPE

```typescript [Include]
export type Include = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
}
```

:::

::: info

Type: `Array<Include>` <br/>

```typescript twoslash
import { pluginTs } from '@kubb/plugin-ts'

const plugin = pluginTs({
  include: [
    {
      type: 'tag',
      pattern: 'store',
    },
  ],
})
```
:::

### exclude

Array containing exclude parameters to exclude/skip tags/operations/methods/paths.

::: info TYPE

```typescript [Exclude]
export type Exclude = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
}
```

:::

::: info

Type: `Array<Exclude>` <br/>

```typescript twoslash
import { pluginTs } from '@kubb/plugin-ts'

const plugin = pluginTs({
  exclude: [
    {
      type: 'tag',
      pattern: 'store',
    },
  ],
})
```
:::

### override

Array containing override parameters to override `options` based on tags/operations/methods/paths.

::: info TYPE

```typescript [Override]
export type Override = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
  options: PluginOptions
}
```

:::

::: info

Type: `Array<Override>` <br/>

```typescript twoslash
import { pluginTs } from '@kubb/plugin-ts'

const plugin = pluginTs({
  override: [
    {
      type: 'tag',
      pattern: 'pet',
      options: {
        enumType: "asConst"
      },
    },
  ],
})
```
:::

### transformers

#### transformers.name

Override the name of the TypeScript type that is getting generated, this will also override the name of the file.

::: info

Type: `(name: string, type?: "function" | "type" | "file" ) => string` <br/>

```typescript twoslash
import { pluginTs } from '@kubb/plugin-ts'

const plugin = pluginTs({
  transformers: {
    name: (name) => {
      return `${name}Client`
    },
  },
})
```
:::

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
        output: './types/{{tag}}Controller'
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
