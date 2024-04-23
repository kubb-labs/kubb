---
layout: doc

title: \@kubb/swagger
outline: deep
---

# @kubb/swagger <a href="https://paka.dev/npm/@kubb/swagger@latest/api">🦙</a>

With the Swagger plugin, you can create a JSON schema out of a Swagger file.
Inside this package, you can also use some utils to create your own Swagger plugin.
We already provide a [react-query plugin](/plugins/swagger-tanstack-query) but if you want to create a plugin for SWR you can use this package to get the core utils.(check if a schema is v2 or v3, validate the schema, generate a OAS object, ...).

<hr/>

We are using [Oas](https://github.com/readmeio/oas) to convert a YAML/JSON to an Oas class(see `oasParser`) that will contain a lot of extra logic(read the $ref, get all the operations, get all models, ...).

The Swagger plugin also contains some classes and functions that can be used in your own plugin that needs Swagger:

- For example, we have [`getReference`](https://github.com/kubb-labs/kubb/blob/main/packages/swagger/src/utils/getReference.ts) that will return the ref based on the spec.

- Next to that we also have the class [`OperationGenerator`](https://github.com/kubb-labs/kubb/blob/main/packages/swagger/src/OperationGenerator.ts). This class contains the building blocks of getting the request, response, params, ....
  <br/>Just call `this.getSchemas` and you will retrieve an object contains all the info you need to set up a TypeScript type, React-Query hook,....

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/swagger
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/swagger
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/swagger
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/swagger
```

:::

## Options

### validate

Validate your [`input`](/config/input) based on `@apidevtools/swagger-parser`
::: info
Type: `boolean` <br/>
Default: `true`

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ validate: true }),
  ],
})
```

:::

### output

#### output.path

Relative path to save the JSON models.<br/>
False will not generate the schema JSONs.

::: info
Type: `string | false` <br/>
Default: `'schemas'`

::: code-group

```typescript [output string]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({
      output: {
        path: './json',
      },
    }),
  ],
})
```

```typescript [output false]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
  ],
})
```

:::

### serverIndex

Which server to use from the array of `servers.url[serverIndex]`

For example `0` will return `http://petstore.swagger.io/api` and `1` will return `http://localhost:3000`

::: info

Type: `number` <br/>
Default: `0`

::: code-group

```yaml [OpenAPI]
openapi: 3.0.3
info:
  title: Swagger Example
  description:
  license:
    name: Apache 2.0
    url: http://www.apache.org/licenses/LICENSE-2.0.html
  version: 1.0.0
servers:
- url: http://petstore.swagger.io/api
- url: http://localhost:3000
```

```typescript [serverIndex 0]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ serverIndex: 0 }), // use of `http://petstore.swagger.io/api`
  ],
})
```

```typescript [serverIndex 1]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ serverIndex: 1 }), // use of `http://localhost:3000`
  ],
})
```

:::

### contentType

Override contentType that will be used for requests and responses.

::: info type

```typescript
export type contentType = 'application/json' | (string & {})
```

:::

::: info
Type: `contentType` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ contentType: 'application/json' }),
  ],
})
```

:::

## Depended

- [`@kubb/core`](/plugins/core/)

## Links

- [Oas](https://github.com/readmeio/oas)
