---
title: Changelog
---

# Changelog

## 3.0.12
- [`plugin-zod`](/plugins/plugin-zod): 2xx as part of `operations.ts`

## 3.0.11
- [`core`](/plugins/core): Disabling output file extension
- [`plugin-oas`](/plugins/plugin-oas): Correct use of Jsdocs syntax for links
- [`core`](/plugins/core): Respect casing of parameters

## 3.0.10
- [`plugin-faker`](/plugins/plugin-faker): `data` should have a higher priority than faker defaults generation

## 3.0.9
- [`plugin-oas`](/plugins/plugin-oas): Allow nullable with default null option
- [`core`](/plugins/core): Correct use of `barrelType` for single files

## 3.0.8
- [`plugin-zod`](/plugins/plugin-zod): Blob as `z.instanceof(File)` instead of `string`

## 3.0.7
- [`core`](/plugins/core): Include single file exports in the main index.ts file.

## 3.0.6
- [`plugin-oas`](/plugins/plugin-oas/): Correct use of variables when a path/params contains _ or -
- [`core`](/plugins/core): `barrelType: 'propagate'` to make sure the core can still generate barrel files, even if the plugin will not have barrel files

## 3.0.5
- [`react`](/helpers/react//): Better error logging + wider range for `@kubb/react` peerDependency

## 3.0.4
- Upgrade external dependencies

## 3.0.3
- [`plugin-ts`](/plugins/plugin-ts/): `@deprecated` jsdoc tag for schemas

## 3.0.2
- [`plugin-react-query`](/plugins/plugin-react-query/): remove the requirement of [`plugin-client`](/plugins/plugin-client)
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): remove the requirement of [`plugin-client`](/plugins/plugin-client)
- [`plugin-vue-query`](/plugins/plugin-vue-query/): remove the requirement of [`plugin-client`](/plugins/plugin-client)
- [`plugin-solid-query`](/plugins/plugin-solid-query/): remove the requirement of [`plugin-client`](/plugins/plugin-client)

## 3.0.1
- [`plugin-faker`](/plugins/plugin-faker): Correct faker functions for uuid, pattern and email
- [`plugin-react-query`](/plugins/plugin-react-query/): allow disabling `useQuery`
- [`plugin-react-query`](/plugins/plugin-react-query/): use of `InfiniteData` TypeScript helper for infiniteQueries
- [`plugin-vue-query`](/plugins/plugin-vue-query/): use of `InfiniteData` TypeScript helper for infiniteQueries

## 3.0.0-beta.12
- [`plugin-react-query`](/plugins/plugin-react-query/): allow to disable the generation of useQuery or createQuery hooks.
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): allow to disable the generation of useQuery or createQuery hooks.
- [`plugin-vue-query`](/plugins/plugin-vue-query/): allow to disable the generation of useQuery or createQuery hooks.
- [`plugin-solid-query`](/plugins/plugin-solid-query/): allow to disable the generation of useQuery or createQuery hooks.
- [`plugin-swr`](/plugins/plugin-swr/): allow to disable the generation of useQuery or createQuery hooks.

## 3.0.0-beta.11
- [`plugin-ts`](/plugins/plugin-ts): enumType `'enum'` without export type in barrel files
- [`plugin-client`](/plugins/plugin-client): Allows you to set a custom base url for all generated calls

## 3.0.0-beta.10
- [`plugin-react-query`](/plugins/plugin-react-query/): `paramsType` with options `'inline'` and `'object'` to have control over the amount of parameters when calling one of the generated functions.
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): `paramsType` with options `'inline'` and `'object'` to have control over the amount of parameters when calling one of the generated functions.
- [`plugin-vue-query`](/plugins/plugin-vue-query/): `paramsType` with options `'inline'` and `'object'` to have control over the amount of parameters when calling one of the generated functions.
- [`plugin-solid-query`](/plugins/plugin-solid-query/): `paramsType` with options `'inline'` and `'object'` to have control over the amount of parameters when calling one of the generated functions.
- [`plugin-client`](/plugins/plugin-client/): `paramsType` with options `'inline'` and `'object'` to have control over the amount of parameters when calling one of the generated functions.

## 3.0.0-beta.9
- [`plugin-msw`](/plugins/plugin-msw): `parser` option to disable faker generation
  - `'faker'` will use `@kubb/plugin-faker` to generate the data for the response
  - `'data'` will use your custom data to generate the data for the response
- [`plugin-msw`](/plugins/plugin-msw): Siblings for better AST manipulation

## 3.0.0-beta.8
- [`plugin-zod`](/plugins/plugin-zod): Siblings for better AST manipulation

## 3.0.0-beta.7
- Upgrade external packages

## 3.0.0-beta.6
- [`plugin-faker`](/plugins/plugin-faker): Min/Max for type array to generate better `faker.helpers.arrayElements` functionality

## 3.0.0-beta.5
- [`plugin-zod`](/plugins/plugin-zod): Discard `optional()` if there is a `default()` to ensure the output type is not `T | undefined`

## 3.0.0-beta.4
- Upgrade external packages

## 3.0.0-beta.3
- [`plugin-zod`](/plugins/plugin-zod/): Added coercion for specific types only
```typescript
type coercion=  boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
```

## 3.0.0-beta.2
- Upgrade external packages

## 3.0.0-beta.1
- Upgrade external packages

## 3.0.0-alpha.31
- [`plugin-client`](/plugins/plugin-client/): Generate `${tag}Service` controller file related to group x when using `group`(no need to specify `group.exportAs`)
- [`plugin-core`](/plugins/core/): Removal of `group.exportAs`
- [`plugin-core`](/plugins/core/): Removal of `group.output` in favour of `group.name`(no need to specify the output/root)
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
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginClient({
      output: {
        path: './clients/axios',
      },
      // group: { type: 'tag', output: './clients/axios/{{tag}}Service' }, // [!code --]
      group: { type: 'tag', name: ({ group }) => `${group}Service` }, // [!code ++]
    }),
  ],
})
```

## 3.0.0-alpha.30
- [`plugin-core`](/plugins/core/): Removal of `output.extName` in favour of `output.extension`
- [`plugin-core`](/plugins/core/): Removal of `exportType` in favour of `barrelType`


## 3.0.0-alpha.29
- [`plugin-react-query`](/plugins/plugin-react-query/): Support for cancellation of queries with the help of `signal`
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): Support for cancellation of queries with the help of `signal`
- [`plugin-vue-query`](/plugins/plugin-vue-query/): Support for cancellation of queries with the help of `signal`
- [`plugin-solid-query`](/plugins/plugin-solid-query/): Support for cancellation of queries with the help of `signal`
- [`plugin-react-query`](/plugins/plugin-react-query/): Use of `enabled` based on optional params
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): Use of `enabled` based on optional params
- [`plugin-vue-query`](/plugins/plugin-vue-query/): Use of `enabled` based on optional params
- [`plugin-solid-query`](/plugins/plugin-solid-query/): Use of `enabled` based on optional params

## 3.0.0-alpha.28
- [`plugin-zod`](/plugins/plugin-zod/): Respect order of `z.tuple`

## 3.0.0-alpha.27
- [`plugin-swr`](/plugins/plugin-swr/): Support for TypeScript `strict` mode
- [`plugin-react-query`](/plugins/plugin-react-query/): Support for TypeScript `strict` mode and use of data object for `mutationFn: async(data: {})`
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): Support for TypeScript `strict` mode and use of data object for `mutationFn: async(data: {})`
- [`plugin-vue-query`](/plugins/plugin-vue-query/): Support for TypeScript `strict` mode and use of data object for `mutationFn: async(data: {})`
- [`plugin-solid-query`](/plugins/plugin-solid-query/): Support for TypeScript `strict` mode and use of data object for `mutationFn: async(data: {})`


## 3.0.0-alpha.26
- [`plugin-swr`](/plugins/plugin-swr/): Expose queryKey and mutationKey for the SWR plugin
- 'generators' option for all plugins

## 3.0.0-alpha.25
- [`plugin-react-query`](/plugins/plugin-react-query/): Use of MutationKeys for `useMutation`
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): Use of MutationKeys for `createMutation`
- [`plugin-vue-query`](/plugins/plugin-vue-query/): Use of MutationKeys for `useMutation`


## 3.0.0-alpha.24
- [`plugin-oas`](/plugins/plugin-oas/): Support for [discriminator](https://swagger.io/specification/?sbsearch=discriminator)


## 3.0.0-alpha.23
- [`plugin-client`](/plugins/plugin-client/): Use of uppercase for httpMethods, `GET` instead of `get`, `POST` instead of `post`, ...

## 3.0.0-alpha.22
- [`plugin-faker`](/plugins/plugin-faker/): Use of `faker.image.url()` instead of `faker.image.imageUrl()`
- [`plugin-zod`](/plugins/plugin-zod/): Enums should use `z.literal` when format is set to number, string or boolean

::: code-group

```yaml [input]
enum:
  type: boolean
  enum:
    - true
    - false
```
```typescript [output]
z.enum(["true", "false"]) // [!code --]
z.union([z.literal(true), z.literal(false)]) // [!code ++]
```
:::
- [`plugin-ts`](/plugins/plugin-ts/): Use of `readonly` for references($ref)
- [`plugin-client`](/plugins/plugin-client/): Use of type `Error` when no errors are set for an operation


## 3.0.0-alpha.21
- [`plugin-zod`](/plugins/plugin-zod/): Use of `x-nullable` and `nullable` for additionalProperties.

## 3.0.0-alpha.20

- Separate plugin/package for Solid-Query: `@kubb/plugin-solid-query`

```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core"
import { pluginOas } from "@kubb/plugin-oas"
import { pluginTs } from "@kubb/plugin-ts"
import { pluginSolidQuery } from '@kubb/plugin-solid-query' // [!code ++]
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'  // [!code --]

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginSolidQuery({
      output: {
        path: './hooks',
      },
    })
  ],
})

```

- Separate plugin/package for Svelte-Query: `@kubb/plugin-svelte-query`

```typescript [kubb.config.ts]
import {defineConfig} from "@kubb/core"
import {pluginOas} from "@kubb/plugin-oas"
import {pluginTs} from "@kubb/plugin-ts"
import { pluginSvelteQuery } from '@kubb/plugin-svelte-query' // [!code ++]
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'  // [!code --]

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginSvelteQuery({
      output: {
        path: './hooks',
      },
    })
  ],
})

```


- Separate plugin/package for Vue-Query:  `@kubb/plugin-vue-query`

```typescript [kubb.config.ts]
import {defineConfig} from "@kubb/core"
import {pluginOas} from "@kubb/plugin-oas"
import {pluginTs} from "@kubb/plugin-ts"
import { pluginVueQuery } from '@kubb/plugin-vue-query' // [!code ++]
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'  // [!code --]

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginVueQuery({
      output: {
        path: './hooks',
      },
    })
  ],
})

```

## 3.0.0-alpha.16

- Separate plugin/package for React-Query: `@kubb/plugin-react-query`

```typescript [kubb.config.ts]
import {defineConfig} from "@kubb/core"
import {pluginOas} from "@kubb/plugin-oas"
import {pluginTs} from "@kubb/plugin-ts"
import { pluginReactQuery } from '@kubb/plugin-react-query' // [!code ++]
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'  // [!code --]

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginReactQuery({
      output: {
        path: './hooks',
      },
    })
  ],
})

```
