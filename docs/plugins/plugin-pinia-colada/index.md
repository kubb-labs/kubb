---
layout: doc

title: \@kubb/plugin-pinia-colada
outline: deep
---

# @kubb/plugin-pinia-colada <Badge type="tip" text="beta" />

> This feature is currently in beta. The API may change in future releases.

Create Pinia Colada hooks based on an operation.

## Playground

<iframe
  src="https://codesandbox.io/embed/github/kubb-labs/kubb/tree/main/examples/pinia-colada?fontsize=14&module=%2Fsrc%2Fgen%2Fhooks%2FuseFindPetsByStatus.ts&theme=dark&view=preview"
  :style="{
    width: '100%',
    height: '500px',
    border: 0,
    borderRadius: '4px',
    overflow: 'hidden'
  }"
  title="pinia-colada"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
/>

## Installation

::: code-group

```shell [bun]
bun add -d @kubb/plugin-pinia-colada
```

```shell [pnpm]
pnpm add -D @kubb/plugin-pinia-colada
```

```shell [npm]
npm install --save-dev @kubb/plugin-pinia-colada
```

```shell [yarn]
yarn add -D @kubb/plugin-pinia-colada
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
|  Default: | `'hooks'` |

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
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                               |

#### output.footer
Add a footer text at the end of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                               |

### contentType
<!--@include: ../core/contentType.md-->

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

### client

#### client.importPath
<!--@include: ../plugin-client/importPath.md-->

#### client.dataReturnType
<!--@include: ../plugin-client/dataReturnType.md-->

#### client.baseURL
<!--@include: ../plugin-client/baseURL.md-->

#### client.bundle
<!--@include: ../plugin-client/bundle.md-->

### paramsType
<!--@include: ../plugin-client/paramsType.md-->

### paramsCasing
<!--@include: ../plugin-client/paramsCasing.md-->

### pathParamsType
<!--@include: ../plugin-client/pathParamsType.md-->

### parser
<!--@include: ../plugin-client/parser.md-->

### query

Configure the behavior of query hooks generation. <br/>
To disable query hooks generation pass `false`.

|           |                          |
|----------:|:-------------------------|
|     Type: | `Query \| false`         |
| Required: | `false`                  |

```typescript [Query]
type Query = {
  /**
   * Define which HttpMethods can be used for queries
   * @default ['get']
   */
  methods: Array<HttpMethod>
  /**
   * Path to the useQuery that will be used to do the useQuery functionality.
   * It will be used as `import { useQuery } from '${importPath}'`.
   * It allows both relative and absolute path.
   * the path will be applied as is, so relative path should be based on the file being generated.
   * @default '@pinia/colada'
   */
  importPath?: string
}
```

#### query.methods

Define which HttpMethods can be used for queries, this will be used to determine if a method can be used for the `useQuery` hook.

|           |                  |
|----------:|:-----------------|
|     Type: | `Array<'get'>`   |
| Required: | `false`          |
|  Default: | `['get']`        |

#### query.importPath

Path to the useQuery that will be used to do the useQuery functionality. <br/>
It will be used as `import { useQuery } from '${importPath}'`. <br/>
It allows both relative and absolute path. <br/>
the path will be applied as is, so relative path should be based on the file being generated.

|           |                  |
|----------:|:-----------------|
|     Type: | `string`         |
| Required: | `false`          |
|  Default: | `'@pinia/colada'` |

### mutation

Configure the behavior of mutation hooks generation. <br/>
To disable mutation hooks generation pass `false`.

|           |                          |
|----------:|:-------------------------|
|     Type: | `Mutation \| false`      |
| Required: | `false`                  |

```typescript [Mutation]
type Mutation = {
  /**
   * Define which HttpMethods can be used for mutations
   * @default ['post', 'put', 'patch', 'delete']
   */
  methods: Array<HttpMethod>
  /**
   * Path to the useMutation that will be used to do the useMutation functionality.
   * It will be used as `import { useMutation } from '${importPath}'`.
   * It allows both relative and absolute path.
   * the path will be applied as is, so relative path should be based on the file being generated.
   * @default '@pinia/colada'
   */
  importPath?: string
}
```

#### mutation.methods

Define which HttpMethods can be used for mutations, this will be used to determine if a method can be used for the `useMutation` hook.

|           |                                      |
|----------:|:-------------------------------------|
|     Type: | `Array<'post' \| 'put' \| 'patch' \| 'delete'>` |
| Required: | `false`                              |
|  Default: | `['post', 'put', 'patch', 'delete']` |

#### mutation.importPath

Path to the useMutation that will be used to do the useMutation functionality. <br/>
It will be used as `import { useMutation } from '${importPath}'`. <br/>
It allows both relative and absolute path. <br/>
the path will be applied as is, so relative path should be based on the file being generated.

|           |                  |
|----------:|:-----------------|
|     Type: | `string`         |
| Required: | `false`          |
|  Default: | `'@pinia/colada'` |

### queryKey

Customize the queryKey

|           |                                                                                                                                                     |
|----------:|:----------------------------------------------------------------------------------------------------------------------------------------------------|
|     Type: | `(props: { operation: Operation; schemas: OperationSchemas; casing: 'camelcase' \| undefined }) => unknown[]`                                       |
| Required: | `false`                                                                                                                                             |

### mutationKey

Customize the mutationKey

|           |                                                                                                                                                     |
|----------:|:----------------------------------------------------------------------------------------------------------------------------------------------------|
|     Type: | `(props: { operation: Operation; schemas: OperationSchemas; casing: 'camelcase' \| undefined }) => unknown[]`                                       |
| Required: | `false`                                                                                                                                             |

## Example

```typescript
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginPiniaColada } from '@kubb/plugin-pinia-colada'
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
    pluginTs(),
    pluginPiniaColada({
      output: {
        path: './hooks',
      },
      client: {
        importPath: '@kubb/plugin-client/clients/axios',
      },
    }),
  ],
})
```

## Links

- [Pinia Colada Documentation](https://pinia-colada.esm.dev/)
- [Pinia Colada GitHub](https://github.com/posva/pinia-colada)
