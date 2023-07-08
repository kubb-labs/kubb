---
layout: doc

title: \@kubb/swagger-client
outline: deep
---
# @kubb/swagger-client

With the Swagger client plugin you can create [Axios](https://axios-http.com/docs/intro) API calls.

## Installation

::: code-group

```shell [bun]
bun add @kubb/swagger-client
```

```shell [pnpm]
pnpm add @kubb/swagger-client
```

```shell [npm]
npm install @kubb/swagger-client
```

```shell [yarn]
yarn add @kubb/swagger-client
```

:::


## Options


### output
Output to save the clients.

Type: `string` <br/>
Default: `"clients"`

### groupBy
Group the clients based on the provided name.

#### type
Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### output
Relative path to save the grouped clients.
`{{tag}}` will be replaced by the current tagName.

Type: `string` <br/>
Example: `clients/{{tag}}Controller` => `clients/PetController` <br/>
Default: `${output}/{{tag}}Controller`

#### exportAs
Name to be used for the `export * as {{exportAs}} from './`

Type: `string` <br/>
Default: `"{{tag}}Service"`

### client
Path to the client that will be used to do the API calls.
Relative to the root

Type: `string` <br/>
Default: `"@kubb/swagger-client/ts-client"`

### skipBy
Array containing skipBy paramaters to exclude/skip tags/operations/methods/paths.

Type: `Array<SkipBy>` <br/>

#### [0]
Type: `{ type: 'tag' | 'operationId' | 'path' | 'method' ; pattern: string | RegExp }` <br/>

## Depended

- [`@kubb/swagger`](/plugins/swagger)
- [`@kubb/swagger-ts`](/plugins/swagger-ts)

## Links

- [Axios](https://axios-http.com/docs/intro)