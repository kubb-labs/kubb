---
layout: doc

title: \@kubb/swagger-client
outline: deep
---

# @kubb/swagger-client <a href="https://paka.dev/npm/@kubb/swagger-client@latest/api">🦙</a>

With the Swagger client plugin you can create [Axios](https://axios-http.com/docs/intro) API calls.

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/swagger-client @kubb/swagger-ts @kubb/swagger
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/swagger-client @kubb/swagger-ts @kubb/swagger
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/swagger-client @kubb/swagger-ts @kubb/swagger
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/swagger-client @kubb/swagger-ts @kubb/swagger
```

:::

## Options

### output

#### output.path

Output to save the clients.
::: info
Type: `string` <br/>
Default: `'clients'`

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({
      output: false,
    }),
    createSwaggerTS({}),
    createSwaggerClient({
      output: {
        path: './axios',
      },
    }),
  ],
})
```

:::

#### output.exportAs

Name to be used for the `export * as {{exportAs}} from './'`

::: info
Type: `string` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({
      output: false,
    }),
    createSwaggerTS({}),
    createSwaggerClient({
      output: {
        exportAs: 'clients',
      },
    }),
  ],
})
```

:::

#### output.extName

Add an extension to the generated imports and exports, default it will not use an extension

::: info
Type: `string` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({
      output: false,
    }),
    createSwaggerTS({}),
    createSwaggerClient({
      output: {
        extName: '.js',
      },
    }),
  ],
})
```

:::

#### output.exportType

Define what needs to exported, here you can also disable the export of barrel files

::: info
Type: `'barrel' | 'barrelNamed' | false` <br/>

:::

### group

Group the clients based on the provided name.

#### group.type

Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### group.output

::: v-pre
Relative path to save the grouped clients.
`{{tag}}` will be replaced by the current tagName.
:::

::: v-pre
Type: `string` <br/>
Example: `clients/{{tag}}Controller` => `clients/PetController` <br/>
Default: `${output}/{{tag}}Controller`
:::

#### group.exportAs

::: v-pre
Name to be used for the `export * as {{exportAs}} from './`
:::

::: v-pre
Type: `string` <br/>
Default: `'{{tag}}Service'`
:::

::: info

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        output: {
          path: './clients/axios',
        },
        group: { type: 'tag', output: './clients/axios/{{tag}}Service' },
      },
    ),
  ],
})
```

:::

### client

#### client.importPath

Path to the client import path that will be used to do the API calls.<br/>
It will be used as `import client from '${client.importPath}'`.<br/>
It allow both relative and absolute path. the path will be applied as is,
so relative path shoule be based on the file being generated.

::: info
Type: `string` <br/>
Default: `'@kubb/swagger-client/client'`

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        client: {
          importPath: '../../client.ts',
        },
      },
    ),
  ],
})
```

:::

### dataReturnType

ReturnType that needs to be used when calling client().

`'data'` will return ResponseConfig[data]. <br/>
`'full'` will return ResponseConfig.

::: info type

::: code-group

```typescript ['data']
export async function getPetById<TData>(
  petId: GetPetByIdPathParams,
): Promise<ResponseConfig<TData>["data"]> {
  ...
}
```

```typescript ['full']
export async function getPetById<TData>(
  petId: GetPetByIdPathParams,
): Promise<ResponseConfig<TData>> {
  ...
}
```

:::

::: info

Type: `'data' | 'full'` <br/>
Default: `'data'`

::: code-group

```typescript ['data']
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        dataReturnType: 'data',
      },
    ),
  ],
})
```

```typescript ['full']
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        dataReturnType: 'full',
      },
    ),
  ],
})
```

:::

### pathParamsType

How to pass your pathParams.

`'object'` will return the pathParams as an object. <br/>
`'inline'` will return the pathParams as comma separated params.

::: info type

::: code-group

```typescript ['object']
export async function getPetById<TData>(
  { petId }: GetPetByIdPathParams,
): Promise<ResponseConfig<TData>> {
  ...
}
```

```typescript ['inline']
export async function getPetById<TData>(
  petId: GetPetByIdPathParams,
): Promise<ResponseConfig<TData>> {
  ...
}
```

:::

::: info

Type: `'object' | 'inline'` <br/>
Default: `'data'`

::: code-group

```typescript ['object']
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        pathParamsType: 'object',
      },
    ),
  ],
})
```

```typescript ['inline']
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        pathParamsType: 'inline',
      },
    ),
  ],
})
```

:::

### include

Array containing include parameters to include tags/operations/methods/paths.

::: info type

```typescript [Include]
export type Include = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
}
```

:::

::: info

Type: `Array<Include>` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        include: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
      },
    ),
  ],
})
```

:::

### exclude

Array containing exclude parameters to exclude/skip tags/operations/methods/paths.

::: info type

```typescript [Exclude]
export type Exclude = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
}
```

:::

::: info

Type: `Array<Exclude>` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
      },
    ),
  ],
})
```

:::

### override

Array containing override parameters to override `options` based on tags/operations/methods/paths.

::: info type

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

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        override: [
          {
            type: 'tag',
            pattern: 'pet',
            options: {
              output: {
                path: './custom',
              },
            },
          },
        ],
      },
    ),
  ],
})
```

:::

### transformers

#### transformers.name

Override the name of the client that is getting generated, this will also override the name of the file.

::: info

Type: `(name: string, type?: "function" | "type" | "file" ) => string` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        transformers: {
          name: (name) => {
            return `${name}Client`
          },
        },
      },
    ),
  ],
})
```

:::

### templates

Make it possible to override one of the templates. <br/>

::: tip
See [templates](/reference/templates) for more information about creating templates.<br/>
Set `false` to disable a template.
:::

::: info type

```typescript [Templates]
import type { Client, Operations } from '@kubb/swagger-client/components'

export type Templates = {
  operations?: typeof Operations.templates | false
  client?: typeof Client.templates | false
}
```

:::

::: info

Type: `Templates` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

import { templates } from './CustomClientTemplate'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        templates: {
          client: templates,
        },
      },
    ),
  ],
})
```

<<< @/../examples/client/templates/client/index.tsx

:::

## Depended

- [`@kubb/swagger`](/plugins/swagger/)
- [`@kubb/swagger-ts`](/plugins/swagger-ts/)

## Links

- [Axios](https://axios-http.com/docs/intro)
