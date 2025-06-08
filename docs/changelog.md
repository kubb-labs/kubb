---
title: Changelog
---

# Changelog

# 3.10.16
- [`plugin-ts`](/plugins/plugin-ts): constEnum should be treated as export * instead of export type *

# 3.10.15
- [`plugin-ts`](/plugins/plugin-ts): Nullable response for @kubb/plugin-ts and @kubb/plugin-zod plugins inconsistency

# 3.10.14
- [`plugin-faker`](/plugins/plugin-faker): Min and max is not applied to the faker functions when only one of them is defined
- [`core`](/plugins/core): uniqueBy for file.sources(isExportable and name)
- [`plugin-ts`](/plugins/plugin-ts): Duplicated enums on TypeScript types

# 3.10.13
- [`plugin-zod`](/plugins/plugin-zod): query parameter objects are no longer optional if at least one parameter is defaulted

# 3.10.12
- [`plugin-oas`](/plugins/plugin-oas): allow multiple `discriminator.mapping` with the same $ref

# 3.10.11
- [`plugin-zod`](/plugins/plugin-zod): update parser to include latest v4 of Zod

# 3.10.10
- [`plugin-react-query`](/plugins/plugin-react-query/): resolve typescript error
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): resolve typescript error
- [`plugin-vue-query`](/plugins/plugin-vue-query/): resolve typescript error
- [`plugin-solid-query`](/plugins/plugin-solid-query/): resolve typescript error

# 3.10.9
- [`core`](/plugins/core): update packages

# 3.10.8
- [`plugin-oas`](/plugins/plugin-oas): Caching of oas

# 3.10.7
- [`core`](/plugins/core): better support for Windows

# 3.10.6
- [`plugin-oas`](/plugins/plugin-oas): Improve tuple type generation

# 3.10.5
- [`plugin-oas`](/plugins/plugin-oas): Rewrite schemas with multiple types
- [`plugin-faker`](/plugins/plugin-faker): Fix types of enums nested in array

# 3.10.4
- [`plugin-mcp`](/plugins/plugin-mcp/): better use of MCP tools based on oas

# 3.10.3
- [`plugin-zod`](/plugins/plugin-zod): Better convert of `discriminator`

# 3.10.2
- [`plugin-react-query`](/plugins/plugin-react-query/): remove generic TQueryData when using suspense

# 3.10.1
- Update of internal libraries

# 3.10.0
- [`plugin-mcp`](/plugins/plugin-mcp/): create an [MCP](https://modelcontextprotocol.io) server based on your OpenAPI file and interact with an AI like Claude.

- ![Claud interaction](/screenshots/claude-interaction.gif)

# 3.9.5
- [`plugin-ts`](/plugins/plugin-ts): openapi description tag is not put into the JSDoc

# 3.9.4
- [`plugin-swr`](/plugins/plugin-swr/): query type inferred as any when generating SWR hooks with useSWR

# 3.9.3
- [`plugin-ts`](/plugins/plugin-ts): nullable: true now generates | null union

# 3.9.2
- [`plugin-client`](/plugins/plugin-client): exclude baseURL when not set

# 3.9.1
- [`plugin-zod`](/plugins/plugin-zod): reduce any's being used
- [`plugin-faker`](/plugins/plugin-faker): reduce any's being used

## 3.9.0
- [`core`](/plugins/core): add default banner feature to enhance generated file recognizability by [@akinoccc](https://github.com/akinoccc)

## 3.8.1
- [`plugin-zod`](/plugins/plugin-zod): support for Zod v4(beta)

## 3.8.0
- [`react`](/helpers/react/): Support for React 19 and expose `useState`, `useEffect`, `useRef` from `@kubb/react`

## 3.7.7
- [`plugin-oas`](/plugins/plugin-oas): support for contentType override/exclude/include

## 3.7.6
- [`plugin-client`](/plugins/plugin-client): Removing export of the url

## 3.7.5
- [`plugin-react-query`](/plugins/plugin-react-query/): support for custom QueryClient
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): support for custom QueryClient
- [`plugin-vue-query`](/plugins/plugin-vue-query/): support for custom QueryClient
- [`plugin-solid-query`](/plugins/plugin-solid-query/): support for custom QueryClient

## 3.7.4
- [`plugin-redoc`](/plugins/plugin-redoc): setup redoc without React dependency

## 3.7.3
- [`plugin-zod`](/plugins/plugin-zod): fixed version for [`@hono/zod-openapi`](https://github.com/honojs/middleware/issues/1109)

## 3.7.2
- [`plugin-client`](/plugins/plugin-client): method should be optional for default fetch and axios client

## 3.7.1
- [`plugin-faker`](/plugins/plugin-faker/): Improve formatting of fake dates and times

## 3.7.0
- [`plugin-cypress`](/plugins/plugin-cypress): support for `cy.request` with new plugin `@kubb/plugin-cypress`

## 3.6.5
- [`plugin-react-query`](/plugins/plugin-react-query/): `TVariables` set to `void` as default
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): `TVariables` set to `void` as default
- [`plugin-vue-query`](/plugins/plugin-vue-query/): `TVariables` set to `void` as default
- [`plugin-solid-query`](/plugins/plugin-solid-query/): `TVariables` set to `void` as default
- [`plugin-zod`](/plugins/plugin-zod): zod omit instead of `z.never`

## 3.6.4
- Update external packages

## 3.6.3
- [`plugin-oas`](/plugins/plugin-oas): extra checks for empty values for properties of a discriminator type
- [`plugin-react-query`](/plugins/plugin-react-query/): allow override of mutation context with TypeScript generic
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): allow override of mutation context with TypeScript generic
- [`plugin-vue-query`](/plugins/plugin-vue-query/): allow override of mutation context with TypeScript generic
- [`plugin-solid-query`](/plugins/plugin-solid-query/): allow override of mutation context with TypeScript generic
-
## 3.6.2
- [`plugin-zod`](/plugins/plugin-zod): handling circular dependency properly when using `ToZod` helper

## 3.6.1
- [`plugin-react-query`](/plugins/plugin-react-query/): validating the request using zod before making the HTTP call
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): validating the request using zod before making the HTTP call
- [`plugin-vue-query`](/plugins/plugin-vue-query/): validating the request using zod before making the HTTP call
- [`plugin-solid-query`](/plugins/plugin-solid-query/): validating the request using zod before making the HTTP call
- [`plugin-swr`](/plugins/plugin-swr/): validating the request using zod before making the HTTP call
- [`plugin-client`](/plugins/plugin-client): validating the request using zod before making the HTTP call

## 3.6.0
- [`plugin-zod`](/plugins/plugin-zod): Adds wrapOutput option to allow for further customizing the generated zod schemas, this makes it possible to use `OpenAPI` on top of your Zod schema.
```typescript
import { z } from '@hono/zod-openapi'

export const showPetByIdError = z
  .lazy(() => error)
  .openapi({
    examples: [
      { sample: { summary: 'A sample error', value: { code: 1, message: 'A sample error message' } } },
      { other_example: { summary: 'Another sample error', value: { code: 2, message: 'A totally specific message' } } },
    ],
  })
```
- [`plugin-oas`](/plugins/plugin-oas): discriminator mapping with literal types
``` typescript
export type FooBase = {
  /**
   * @type string
   */
-  $type: string;
+  $type: "type-string" | "type-number";
};
```
``` typescript
-export type FooNumber = FooBase {
+export type FooNumber = FooBase & {
+  /**
+   * @type string
+   */
+  $type: "type-number";
+
  /**
   * @type number
   */
  value: number;
};
```

## 3.5.13
- [`plugin-oas`](/plugins/plugin-oas): enum with whitespaces

## 3.5.12
- [`core`](/plugins/core): internal packages update

## 3.5.11
- [`core`](/plugins/core): internal packages update

## 3.5.10
- [`plugin-faker`](/plugins/plugin-faker/): returnType for faker functions

## 3.5.9
- [`plugin-faker`](/plugins/plugin-faker/): returnType for faker functions
- [`plugin-faker`](/plugins/plugin-faker/): only use min/max when both are set in the oas
- [`plugin-client`](/plugins/plugin-client): correct use of baseURL for fetch client
- [`plugin-msw`](/plugins/plugin-msw): support for `baseURL` without wildcards

## 3.5.8
- [`plugin-react-query`](/plugins/plugin-react-query/): support custom `contentType` per plugin
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): support custom `contentType` per plugin
- [`plugin-vue-query`](/plugins/plugin-vue-query/): support custom `contentType` per plugin
- [`plugin-solid-query`](/plugins/plugin-solid-query/): support custom `contentType` per plugin
- [`plugin-swr`](/plugins/plugin-swr/): support custom `contentType` per plugin
- [`plugin-client`](/plugins/plugin-client): support custom `contentType` per plugin

## 3.5.7
- [`react`](/helpers/react/): Bun does not follow the same node_modules structure, to resolve this we need to include the React bundle inside of `@kubb/react`. This will increase the size with 4MB.

## 3.5.6
- [`plugin-react-query`](/plugins/plugin-react-query/): support custom client in options
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): support custom client in options
- [`plugin-vue-query`](/plugins/plugin-vue-query/): support custom client in options
- [`plugin-solid-query`](/plugins/plugin-solid-query/): support custom client in options
- [`plugin-swr`](/plugins/plugin-swr/): support custom client in options

## 3.5.5
- [`plugin-client`](/plugins/plugin-client): support custom client in options
- [`plugin-faker`](/plugins/plugin-zod): `faker.number.string` with default min `Number.MIN_VALUE` and max set to `Number.MAX_VALUE`

## 3.5.4
- [`plugin-zod`](/plugins/plugin-zod): Support uniqueItems in Zod

## 3.5.3
- [`plugin-client`](/plugins/plugin-client): allow exporting custom client fetch function and use generated fetch when `pluginClient` is available
- [`plugin-react-query`](/plugins/plugin-react-query/): allow exporting custom client fetch function and use generated fetch when `pluginClient` is available
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): allow exporting custom client fetch function and use generated fetch when `pluginClient` is available
- [`plugin-vue-query`](/plugins/plugin-vue-query/): allow exporting custom client fetch function and use generated fetch when `pluginClient` is available
- [`plugin-solid-query`](/plugins/plugin-solid-query/): allow exporting custom client fetch function and use generated fetch when `pluginClient` is available
- [`plugin-swr`](/plugins/plugin-swr/): allow exporting custom client fetch function and use generated fetch when `pluginClient` is available


## 3.5.2
- [`plugin-faker`](/plugins/plugin-faker): `faker.number.float` with default min `Number.MIN_VALUE` and max set to `Number.MAX_VALUE`.
- [`plugin-oas`](/plugins/plugin-oas): remove duplicated keys when using `allOf` and applying required on fields

## 3.5.1
- [`core`](/plugins/core): build of `@kubb/core` with correct types
- [`plugin-oas`](/plugins/plugin-oas): allow `grouping`

## 3.5.0
- [`core`](/plugins/core): support banner with context for Oas
```typescript
pluginTs({
  output: {
    path: 'models',
    banner(oas) {
      return `// version: ${oas.api.info.version}`
    },
  },
}),
```

## 3.4.6
- [`core`](/plugins/core): ignore acronyms when doing casing switch to pascal or camelcase

## 3.4.5
- [`plugin-client`](/plugins/plugin-client): if client receives no body (no content) then it throws JSON parsing error
- [`plugin-zod`](/plugins/plugin-zod): use of `as ToZod` instead of `satisfies ToZod`

## 3.4.4
- [`plugin-client`](/plugins/plugin-client): url in text format instead of using URL

## 3.4.3
- [`plugin-oas`](/plugins/plugin-oas): correct use of grouping for path and tags

## 3.4.2
- [`plugin-oas`](/plugins/plugin-oas): remove duplicated keys when set in required

## 3.4.1
- [`plugin-faker`](/plugins/plugin-faker): min and max was not applied to the faker functions

## 3.4.0
- [`plugin-client`](/plugins/plugin-client): decouple URI (with params) from fetching
- [`plugin-client`](/plugins/plugin-client): add header in response object
- [`plugin-client`](/plugins/plugin-client): use of URL and SearchParams to support queryParams for fetch

## 3.3.5
- [`plugin-react-query`](/plugins/plugin-react-query/): queryOptions with custom Error type
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): queryOptions with custom Error type
- [`plugin-vue-query`](/plugins/plugin-vue-query/): queryOptions with custom Error type
- [`plugin-solid-query`](/plugins/plugin-solid-query/): queryOptions with custom Error type
- [`react`](/helpers/react/): importPath without extensions


## 3.3.4
- [`plugin-ts`](/plugins/plugin-ts): minLength, maxLength, pattern as part of the jsdocs
- [`plugin-client`](/plugins/plugin-client): baseURL could be undefined, do not throw error if that is the case

## 3.3.3
- [`react`](/helpers/react/): Use of `@kubb/react` as importSource for jsx(React 17, React 18, React 19 could be used next to Kubb)
- [`cli`](/helpers/cli/): Use of `@kubb/react` as importSource for jsx(React 17, React 18, React 19 could be used next to Kubb)

## 3.3.2
- [`react`](/helpers/react/): Support `div` and other basic elements to be returned by `@kubb/react`

## 3.3.1
- [`plugin-zod`](/plugins/plugin-zod): Use of `tozod` util to create schema based on a type

## 3.3.0
- [`plugin-client`](/plugins/plugin-client): `client` to use `fetch` or `axios` as HTTP client
- [`plugin-zod`](/plugins/plugin-zod): Use Regular expression literal instead of RegExp-contructor
- [`plugin-ts`](/plugins/plugin-ts): Switch between the use of type or interface when creating types

## 3.2.0
- [`plugin-msw`](/plugins/plugin-msw): `paramsCasing` to define casing for params
- [`plugin-react-query`](/plugins/plugin-react-query/): `paramsCasing` to define casing for params
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): `paramsCasing` to define casing for params
- [`plugin-vue-query`](/plugins/plugin-vue-query/): `paramsCasing` to define casing for params
- [`plugin-solid-query`](/plugins/plugin-solid-query/): `paramsCasing` to define casing for params
- [`plugin-client`](/plugins/plugin-client): `paramsCasing` to define casing for params

## 3.1.0
- [`plugin-react-query`](/plugins/plugin-react-query/): Group API clients by path structure
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): Group API clients by path structure
- [`plugin-vue-query`](/plugins/plugin-vue-query/): Group API clients by path structure
- [`plugin-solid-query`](/plugins/plugin-solid-query/): Group API clients by path structure
- [`plugin-msw`](/plugins/plugin-msw): Group API clients by path structure
```typescript
group: {
  type: 'path',
  name: ({ group }) => {
    const firstSegment = group.split('/')[1];
    return firstSegment;
  }
}
```
```typescript
findPetsByStatusHandler((info) => {
  const { params } = info
  if (params.someKey) {
    return new Response(
      JSON.stringify({ error: 'some error response' }),
      { status: 400 }
    );
  }
  return new Response(
    JSON.stringify({ newData: 'new data' }),
    { status: 200 }
  );
})

```

## 3.0.14
- [`core`](/plugins/core): Upgrade packages

## 3.0.13
- [`core`](/plugins/core): Upgrade packages
- [`plugin-oas`](/plugins/plugin-oas): Applying required on fields inherited using allOf

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
