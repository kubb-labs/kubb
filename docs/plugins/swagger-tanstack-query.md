---
layout: doc

title: \@kubb/swagger-tanstack-query
outline: deep
---


# @kubb/swagger-tanstack-query

With the Swagger Tanstack Query plugin you can create: 
- [react-query](https://tanstack.com/query/latest/docs/react) hooks based on an operation in the Swagger file.
- [solid-query](https://tanstack.com/query/latest/docs/solid) primitives based on an operation in the Swagger file.
- [svelte-query](https://tanstack.com/query/latest/docs/svelte) primitives based on an operation in the Swagger file.
- [vue-query](https://tanstack.com/query/latest/docs/vue) hooks based on an operation in the Swagger file.

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>] 
bun add @kubb/swagger-tanstack-query
```

```shell [pnpm <img src="/feature/pnpm.svg"/>] 
pnpm add @kubb/swagger-tanstack-query
```

```shell [npm <img src="/feature/npm.svg"/>] 
npm install @kubb/swagger-tanstack-query
```

```shell [yarn <img src="/feature/yarn.svg"/>] 
yarn add @kubb/swagger-tanstack-query
```

:::

## Options


### output
Output to save the @tanstack/query hooks.

Type: `string` <br/>
Default: `"hooks"`

### groupBy
Group the @tanstack/query hooks based on the provided name.

#### type
Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### output
Relative path to save the grouped @tanstack/query hooks.
`{{tag}}` will be replaced by the current tagName.

Type: `string` <br/>
Example: `hooks/{{tag}}Controller` => `hooks/PetController` <br/>
Default: `${output}/{{tag}}Controller`

#### exportAs
Name to be used for the `export * as {{exportAs}} from './`

Type: `string` <br/>
Default: `"{{tag}}Hooks"`

### client
Path to the client that will be used to do the API calls.
Relative to the root

Type: `string` <br/>
Default: `"@kubb/swagger-client/ts-client"`

### framework
Framework to be generated for.

Type: `'react' | 'solid' | 'svelte' | 'vue'` <br/>
Default: `"react"`

### infinite
When set, an infiniteQuery is getting created, example: 
```typescript
{
    output: './clients/hooks',
    skipBy: [
      {
        type: 'tag',
        pattern: 'store',
      },
    ],
    groupBy: { type: 'tag' },
    client: './src/client.ts',
    infinite: {}
  },
```

#### queryParam
Specify the params key used for `pageParam`.
Used inside `useInfiniteQuery`, `createInfiniteQueries`, `createInfiniteQuery`.

Type: `string` <br/>
Default: `"id"`


### skipBy
Array containing skipBy paramaters to exclude/skip tags/operations/methods/paths.

Type: `Array<SkipBy>` <br/>

#### [0]
Type: `{ type: 'tag' | 'operationId' | 'path' | 'method' ; pattern: string | RegExp }` <br/>

### transformers

#### name
Override the name of the hook that is getting generated, this will also override the name of the file.

Type: `(name: string) => string` <br/>


## Depended

- [`@kubb/swagger`](/plugins/swagger)
- [`@kubb/swagger-ts`](/plugins/swagger-ts)

## Links

- [Tanstack Query](https://tanstack.com/query)