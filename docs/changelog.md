---
title: Changelog
---

# Changelog

## 3.0.0-alpha.30
- [`plugin-react-query`](/plugins/plugin-react-query/): Use of `enabled` based on optional params
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): Use of `enabled` based on optional params
- [`plugin-vue-query`](/plugins/plugin-vue-query/): Use of `enabled` based on optional params
- [`plugin-solid-query`](/plugins/plugin-solid-query/): Use of `enabled` based on optional params

## 3.0.0-alpha.29
- [`plugin-react-query`](/plugins/plugin-react-query/): Support for cancellation of queries with the help of `signal`
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): Support for cancellation of queries with the help of `signal`
- [`plugin-vue-query`](/plugins/plugin-vue-query/): Support for cancellation of queries with the help of `signal`
- [`plugin-solid-query`](/plugins/plugin-solid-query/): Support for cancellation of queries with the help of `signal`


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

```typescript twoslash [kubb.config.ts]
import {defineConfig} from "@kubb/core"
import {pluginOas} from "@kubb/plugin-oas"
import {pluginTs} from "@kubb/plugin-ts"
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

```typescript twoslash [kubb.config.ts]
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

```typescript twoslash [kubb.config.ts]
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

```typescript twoslash [kubb.config.ts]
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
