---
layout: doc

title: \@kubb/plugin-oas
outline: deep
---

# @kubb/plugin-oas

With the Oas plugin, you can create a JSON schema out of a Swagger file.
Inside this package, you can also use some utils to create your own Swagger plugin.
We already provide a [react-query plugin](/plugins/plugin-tanstack-query) but if you want to create a plugin for SWR you can use this package to get the core utils.(check if a schema is v2 or v3, validate the schema, generate a OAS object, ...).

<hr/>

We are using [Oas](https://github.com/readmeio/oas) to convert a YAML/JSON to an Oas class(see `oasParser`) that will contain a lot of extra logic(read the $ref, get all the operations, get all models, ...).

The Swagger plugin also contains some classes and functions that can be used in your own plugin that needs Swagger:

- For example, we have [`getReference`](https://github.com/kubb-labs/kubb/blob/main/packages/swagger/src/utils/getReference.ts) that will return the ref based on the spec.

- Next to that we also have the class [`OperationGenerator`](https://github.com/kubb-labs/kubb/blob/main/packages/swagger/src/OperationGenerator.ts). This class contains the building blocks of getting the request, response, params, ....
  <br/>Just call `this.getSchemas` and you will retrieve an object contains all the info you need to set up a TypeScript type, React-Query hook,....

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/plugin-oas
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/plugin-oas
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/plugin-oas
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/plugin-oas
```

:::

## Options

### validate

Validate your [`input`](/config/input) based on `@readme/openapi-parser`
::: info
Type: `boolean` <br/>
Default: `true`

```typescript
import { pluginOas } from '@kubb/plugin-oas'

const plugin = pluginOas({
  validate: true,
})
```
:::

### output

#### output.path

Relative path to save the generated files(see generators).<br/>

::: info
Type: `string` <br/>
Default: `'schemas'`

::: code-group

```typescript
import { pluginOas } from '@kubb/plugin-oas'

const plugin = pluginOas({
  output: {
    path: './json',
  },
})
```

:::
### serverIndex

Which server to use from the array of `servers.url[serverIndex]`

For example:
- `0` will return `http://petstore.swagger.io/api`
- `1` will return `http://localhost:3000`

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
import { pluginOas } from '@kubb/plugin-oas'

const plugin = pluginOas({ serverIndex: 0 })
```

```typescript [serverIndex 1]
import { pluginOas } from '@kubb/plugin-oas'

const plugin = pluginOas({ serverIndex: 1 })
```

:::

### contentType

Define which contentType should be used.
By default, this is set based on the first used contentType.

::: info TYPE

```typescript
export type contentType = 'application/json' | (string & {})
```
:::

::: info
Type: `contentType` <br/>

```typescript
import { pluginOas } from '@kubb/plugin-oas'

const plugin = pluginOas({ contentType: 'application/json' })
```
:::


### oasClass <img src="/icons/experimental.svg"/>
Override some behaviour of the Oas class instance, see `@kubb/oas`.
::: info

```typescript
import { pluginOas } from '@kubb/plugin-oas'
import { Oas } from '@kubb/oas'

class oasClass extends Oas {

}

const plugin = pluginOas({
  oasClass
})
```
:::

### generators <img src="/icons/experimental.svg"/>
Define some generators to create files based on the operation and/or schema. See `createGenerator`.

All plugin are using generators to create files based on the OperationGenerator and SchemaGenerators.

An empty array will result in no schema's being generated, in v2 of Kubb we used `output: false`.

::: info

```typescript
import { pluginOas, createGenerator, PluginOas } from '@kubb/plugin-oas'
import { jsonGenerator } from '@kubb/plugin-oas/generators';

export const customGenerator = createGenerator<PluginOas>({
  name: 'plugin-oas',
  async schema({ schema, name, instance }) {
    return []
  }
})

const plugin = pluginOas({
  generators: [jsonGenerator,  customGenerator]
})
```
:::

### experimentalFilter <img src="/icons/experimental.svg"/>

::: info

```typescript
import { pluginOas } from '@kubb/plugin-oas'

const plugin = pluginOas({
  experimentalFilter: {
    methods: ['get'],
  },
})
```
:::

### experimentalSort <img src="/icons/experimental.svg"/>

::: info

```typescript
import { pluginOas } from '@kubb/plugin-oas'

const plugin = pluginOas({
  experimentalSort: {
    properties: ['description', 'default', 'type']
  },
})
```
:::

## Example

```typescript
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas({
      validate: true,
      output: {
        path: './json',
      },
      serverIndex: 0,
      contentType: 'application/json',
    }),
  ],
})
```

## Links

- [Oas](https://github.com/readmeio/oas)
