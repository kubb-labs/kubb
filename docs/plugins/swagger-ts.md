---
layout: doc

title: \@kubb/swagger-ts
outline: deep
---
# @kubb/swagger-ts <a href="https://paka.dev/npm/@kubb/swagger-ts@latest/api">🦙</a>

With the Swagger TypeScript plugin you can create [TypeScript](https://www.typescriptlang.org/) types based on a Swagger file.

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/swagger-ts @kubb/swagger
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/swagger-ts @kubb/swagger
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/swagger-ts @kubb/swagger
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/swagger-ts @kubb/swagger
```

:::

## Options

### output
Relative path to save the TypeScript types. <br/>
When output is a file it will save all models inside that file else it will create a file per schema item.

::: info
Type: `string` <br/>
Default: `'types'`

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({ output: './models' })
  ]
})
```

:::

### groupBy
Group the TypeScript types based on the provided name.

#### type
Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### output
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

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({ 
      output: './types', 
      groupBy: { type: 'tag', output: './types/{{tag}}Controller' }, 
    }),
  ]
})
```
:::

### enumType
Choose to use `enum` or `as const` for enums. <br/>
`asConst` will use camelCase for the naming. <br/>
`asPascalConst` will use PascalCase for the naming.

::: info Type

::: code-group

```typescript ['enum']
enum PetType {
  Dog = 'dog',
  Cat = 'cat'
}
```

```typescript ['asConst']
const petType = {
  Dog: 'dog',
  Cat: cat'
} as const
```

```typescript ['asPascalConst']
const PetType = {
  Dog: 'dog',
  Cat: 'cat'
} as const
```
:::

::: info 

Type: `'enum' | 'asConst' | 'asPascalConst'` <br/>
Default: `'asConst'`

::: code-group

```typescript ['enum']
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({ 
      enumType: 'enum'
    }),
  ]
})
```

```typescript ['asConst']
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({ 
      enumType: 'asConst'
    }),
  ]
})
```

```typescript ['asPascalConst']
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({ 
      enumType: 'asPascalConst'
    }),
  ]
})
```

:::

### dateType
Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.

::: info type

::: code-group

```typescript ['string']
date: string
```

```typescript ['date']
date: Date
```
:::

::: info

Type: `'string' | 'date'` <br/>
Default: `'string'`


```typescript ['string']
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({ 
      dateType: 'string'
    }),
  ]
})
```


```typescript ['date']
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({ 
      dateType: 'date'
    }),
  ]
})
```

:::

### optionalType
Choose what to use as mode for an optional value.<br/>

::: info type

::: code-group

```typescript ['questionToken']
type?: string
```

```typescript ['undefined']
type: string | undefined
```

```typescript ['questionTokenAndUndefined']
type?: string | undefined`
```
:::

::: info

Type: `'questionToken' | 'undefined' | 'questionTokenAndUndefined'` <br/>
Default: `'questionToken'`

::: code-group

```typescript ['questionToken']
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({ 
      optionalType: 'questionToken'
    }),
  ]
})
```

```typescript ['undefined']
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({ 
      optionalType: 'undefined'
    }),
  ]
})
```

```typescript ['questionTokenAndUndefined']
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({ 
      optionalType: 'questionTokenAndUndefined'
    }),
  ]
})
```

:::

### skipBy
Array containing skipBy paramaters to exclude/skip tags/operations/methods/paths.

::: info type
```typescript [SkipBy]
export type SkipBy = {
  type: 'tag' | 'operationId' | 'path' | 'method' ; 
  pattern: string | RegExp 
}
```

::: 

::: info

Type: `Array<SkipBy>` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS(
      { 
        skipBy: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
      }
    )
  ]
})
```
:::


### overrideBy
Array containing overrideBy paramaters to override `options` based on tags/operations/methods/paths.

::: info type
```typescript [OverrideBy]
export type OverrideBy = {
  type: 'tag' | 'operationId' | 'path' | 'method' ; 
  pattern: string | RegExp 
  options: PluginOptions
}
```
::: 

::: info

Type: `Array<OverrideBy>` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS(
      { 
        overrideBy: [
          {
            type: 'tag',
            pattern: 'pet',
            options: {
              output: './custom',
            },
          },
        ],
      }
    )
  ]
})
```
:::


### transformers

#### name
Override the name of the TypeScript type that is getting generated, this will also override the name of the file.

::: info

Type: `(name: string) => string` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS(
      { 
        transformers: {
          name: (name) => {
            return `${name}Client`
          },
        },
      }
    )
  ]
})
```

:::


## Depended

- [`@kubb/swagger`](/plugins/swagger)

## Links

- [TypeScript](https://www.typescriptlang.org/)