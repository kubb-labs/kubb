---
layout: doc

title: Migrating to Kubb v3
outline: deep
---

# Migrating to Kubb v3

## New Features

### Generators

> [!TIP]
> Generators are a replacements of `templates`

See [Generators](/knowledge-base/generators).

### kubb.config.ts
2 extra options have been added to the output:
#### `output.extension`
In the latest [Node.js](https://nodejs.org/api/esm.html#mandatory-file-extensions) version, file extensions are required, so we automatically add `.ts` to every file. However, not all projects use the latest Node.js configuration for extensions. With this option, you can remove the extension or use `.js` instead.

See [output.extension](/getting-started/configure#output-extension).

#### `output.barrelType`
Specify how `index.ts` files should be created, this will work for the root `index.ts` file. On plugin level there is also a new option to define this.

See [output.barrelType](/getting-started/configure#output-barreltype).

### Rewrite of the CLI
|          |           |
|---------:|:----------|
| Left: v3 | Right: v2 |

![React-DevTools](/screenshots/cli-speed.gif)
The CLI and core have been revamped for improved speed and in v3 it will also display more relevant information.
- Progressbar for the execution of plugins.
- Progressbar for the writing of files.
- Timestamps next to every command that is being executed.
- Better support for CI tools
- Use of TypeScript Strict
- 20-30% faster overall execution
- [Debug mode(`--debug`)](helpers/cli#debug) that will create 2 log files
  - `.kubb/kubb-DATE_STRING.log`
  - `.kubb/kubb-files.log`
- All issues can be seen here: [Kubb v3 ideas](https://github.com/kubb-labs/kubb/issues/1115)



## Breaking Changes

### Plugin renames
We previously used the name swagger to indicate that we only supported Swagger files. However, we now also support OpenAPI v3 and v3.1. This change allows for the potential integration of additional specifications beyond just OpenAPI files in the future.

> [!TIP]
> Default imports are also being removed in v3 so you need to import a plugin as follow(support for better treeshaking for ESM):
>
> `import { pluginReactQuery } from '@kubb/plugin-react-query'`

- `@kubb/swagger-client` becomes `@kubb/plugin-client`
- `@kubb/swagger-faker` becomes `@kubb/plugin-faker`
- `@kubb/swagger-msw` becomes `@kubb/plugin-msw`
- `@kubb/swagger` becomes `@kubb/plugin-oas`
- `@kubb/plugin-tanstack-query` becomes `@kubb/plugin-react-query` for [React](https://react.dev/)
- `@kubb/plugin-tanstack-query` becomes `@kubb/plugin-solid-query` for [Solid](https://www.solidjs.com/)
- `@kubb/plugin-tanstack-query` becomes `@kubb/plugin-svelte-query` for [Svelte](https://svelte.dev/)
- `@kubb/plugin-tanstack-query` becomes `@kubb/plugin-react-query` for [Vue](https://vuejs.org/)
- `@kubb/swagger-redoc` becomes `@kubb/plugin-redoc`
- `@kubb/swagger-swr` becomes `@kubb/plugin-swr`
- `@kubb/swagger-ts` becomes `@kubb/plugin-ts`
- `@kubb/swagger-zod` becomes `@kubb/plugin-zod`
- `@kubb/swagger-zodios` becomes `@kubb/plugin-zodios`


### Tanstack-query
We will discontinue support for (Tanstack-Query](https://tanstack.com/query/latest/docs/framework/react/overview) v4 in favor of v5. If you still require generation for v4, you can use [Kubb v2](https://v2.kubb.dev).
Additionally, each framework will now be packaged separately instead of being included in a single package that contains code for all frameworks.


|  Framework | Packages                      |
|-----------:|:------------------------------|
|  `'react'` | `'@kubb/plugin-react-query'`  |
|  `'solid'` | `'@kubb/plugin-solid-query'`  |
| `'svelte'` | `'@kubb/plugin-svelte-query'` |
|    `'vue'` | `'@kubb/plugin-vue-query'`    |


```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'
import { pluginReactQuery } from '@kubb/plugin-react-query' // [!code ++]
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
    pluginTanstackQuery({ // [!code --]
      output: { // [!code --]
        path: './hooks', // [!code --]
      }, // [!code --]
      framework: 'react', // [!code --]
    }), // [!code --]
    pluginReactQuery({ // [!code ++]
      output: { // [!code ++]
        path: './hooks', // [!code ++]
      }, // [!code ++]
    }), // [!code ++]
  ],
})
```

### MSW
We will discontinue support for (MSW](https://mswjs.io/) v1 in favour of using v2. If you still need to have generation for v1, you could use [Kubb v2](https://v2.kubb.dev).


### Output
- `output.banner`: Add some code in the beginning of every file
- `output.footer`: Add some code in the end of every file
- `output.exportType`: Behaviour stayed the same, we renamed the option to `output.barrelType` and simplified the values.
```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core"
import { pluginOas } from "@kubb/plugin-oas"
import { pluginTs } from "@kubb/plugin-ts"
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginClient({
      output: {
        exportType: false, // [!code --]
        barrelType: false, // [!code ++]
      },
    }),
    pluginClient({
      output: {
        exportType: 'barrel', // [!code --]
        barrelType: 'all', // [!code ++]
      },
    }),
    pluginClient({
      output: {
        exportType: 'barrelNamed', // [!code --]
        barrelType: 'named', // [!code ++]
      },
    }),
  ],
})
```
- `output.extName`: Rather than defining this in every plugin, we chose to move it to [`output.extension`](/getting-started/configure#output-extension).
```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core"
import { pluginOas } from "@kubb/plugin-oas"
import { pluginTs } from "@kubb/plugin-ts"
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    extension() { // [!code ++]
      return { // [!code ++]
        '.ts': '.js', // [!code ++]
      } // [!code ++]
    }, // [!code ++]
  },
  plugins: [
    pluginOas(),
    pluginClient({
      output: {
        path: './clients/axios',
        extName: '.js', // [!code --]
      },
    }),
  ],
})
```
- `output.exportAs`: This property was only usable for `@kubb/plugin-client` where we wanted to combine the functionality under one controller function.
::: code-group
```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core"
import { pluginOas } from "@kubb/plugin-oas"
import { pluginTs } from "@kubb/plugin-ts"
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginClient({
      output: {
        path: './clients/axios',
        exportAs: 'clients' // [!code --]
      },
      group: { // [!code ++]
        type: 'tag', // [!code ++]
        name({ group }){ // [!code ++]
          return `${group}Controller` // [!code ++]
        } // [!code ++]
      } // [!code ++]
    }),
  ],
})
```
```typescript [src/gen/clients/axios/petController/petService.ts]
import { addPet } from './addPet.js'
import { deletePet } from './deletePet.js'

export function petService() {
  return { addPet, deletePet }
}

```
:::

### Group
- `group.output`: Removed in favour of using `group.name`, the output will automatically be created based on the `root`, `output.path` and `output.path` of the selected plugin.
```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core"
import { pluginOas } from "@kubb/plugin-oas"
import { pluginTs } from "@kubb/plugin-ts"
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginClient({
      group: {
        type: 'tag',
        output: './clients/axios/{{tag}}Service', // [!code --]
        name: ({ group }) => `${group}Service`, // [!code ++]
      },
    }),
  ],
})
```
- `group.exportAs`: This property was only usable for `@kubb/plugin-client` where we wanted to combine the functionality under one controller function.
::: code-group
```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core"
import { pluginOas } from "@kubb/plugin-oas"
import { pluginTs } from "@kubb/plugin-ts"
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginClient({
      output: {
        path: './clients/axios',
      },
      group: {
        exportAs: 'clients',
        name({ group }){
          return `${group}Controller`
        }
      }
    }),
  ],
})
```
```typescript [src/gen/clients/axios/petController/petService.ts]
import { addPet } from './addPet.js'
import { deletePet } from './deletePet.js'

export function petService() {
  return { addPet, deletePet }
}

```
:::


### More
- Minimal support of Node 20
- Refactor of grouping(use of name instead of output) and output based on `output` of the current plugin
- Removal of the Zodios plugin

## Plugin Specific changes

### @kubb/plugin-oas
We used `openapi-format` before to already filter out some Operations or Paths but in v3 this has been removed in favour of using [https://github.com/thim81/openapi-format](https://github.com/thim81/openapi-format) before using your Swagger/OpenAPI in Kubb.

- `experimentalFilter`
- `experimentalSort`

See [Filter And Sort](/knowledge-base/filter-and-sort).

### @kubb/plugin-client
- `client.importPath` becomes `importPath`
- `operations` will control the creation of a file with all operations grouped by methods.
- `parser` will make it possible to chose between using no parser(`client`) or using Zod(`zod`).

### @kubb/plugin-ts
- `enumType` `'asPascalConst'` has been removed as an option.
- `enumSuffix` will be `'enum'` by default.
- `mapper` can be used to override which TypeScript TsNode that should be used.


### @kubb/plugin-zod
- `typedSchema` becomes `inferred`
- `operations` will control the creation of a file with all operations grouped by methods.
- `mapper` can be used to override which Zod primitives that should be used.

### @kubb/plugin-faker
- `mapper` can be used to override which Faker functionality that should be used.

### @kubb/plugin-swr
- `dataReturnType` becomes `client.dataReturnType`
- `pathParamsType` same as in `@kubb/plugin-client`
- `parser` same as in `@kubb/plugin-client`
- `query.key` same as in `@kubb/plugin-react-query`
- `query.methods` same as in `@kubb/plugin-react-query`
- `query.importPath` same as in `@kubb/plugin-react-query`
- `mutation.key` same as in `@kubb/plugin-react-query`
- `mutation.methods` same as in `@kubb/plugin-react-query`
- `mutation.importPath` same as in `@kubb/plugin-react-query`

### @kubb/plugin-react-query
- `dataReturnType` becomes `client.dataReturnType`
- `pathParamsType` same as in `@kubb/plugin-client`
- `parser` same as in `@kubb/plugin-client`
- `query.queryKey` becomes `query.key`
- `queryOptions` has been removed as an option
- `mutate.key` becomes `mutation.key`
- `mutate.methods` becomes `mutation.methods`
- `mutate.importPath` becomes `mutation.importPath`
- Mutations will include a generated `mutationkey`
- `enabled` will be generated based on which params are required
- Support for `signal`, this makes it possible to cancel a request
- Removal of `mutate.variablesType` and use `'mutate'` as default

