---
layout: doc

title: \@kubb/swagger-swr
outline: deep
---
# @kubb/swagger-swr <a href="https://paka.dev/npm/@kubb/swagger-swr@latest/api">🦙</a>

With the Swagger SWR plugin you can create [SWR hooks](https://swr.vercel.app/) based on an operation in the Swagger file.

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/swagger-swr
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/swagger-swr
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/swagger-swr
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/swagger-swr
```

:::

## Options


### output
Output to save the SWR hooks.

Type: `string` <br/>
Default: `"hooks"`

### groupBy
Group the SWR hooks based on the provided name.

#### type
Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### output
::: v-pre
Relative path to save the grouped SWR hooks.
`{{tag}}` will be replaced by the current tagName.
:::

::: v-pre
Type: `string` <br/>
Example: `hooks/{{tag}}Controller` => `hooks/PetController` <br/>
Default: `${output}/{{tag}}Controller`
:::

#### exportAs
::: v-pre
Name to be used for the `export * as {{exportAs}} from './`
:::

::: v-pre
Type: `string` <br/>
Default: `"{{tag}}SWRHooks"`
:::

### client <Badge type="danger" text="deprecated" />
Path to the client that will be used to do the API calls.
Relative to the root

Type: `string` <br/>
Default: `"@kubb/swagger-client/client"`

Deprecated. Use `clientImportPath` instead. It will be skipped if `clientImportPath` is provided.

### clientImportPath
Path to the client import path that will be used to do the API calls.
It will be used as `import client from '${clientImportPath}'`.
It allow both relative and absolute path. the path will be applied as is,
so relative path shoule be based on the file being generated.

Type: `string` <br/>
Default: `"@kubb/swagger-client/client"`

### dataReturnType <Badge type="warning" text="experimental" />
ReturnType that needs to be used when calling client().

`Data` will return ResponseConfig[data]. <br/>
`Full` will return ResponseConfig.

Type: `string` <br/>
Default: `"data"`

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

- [SWR](https://swr.vercel.app/)