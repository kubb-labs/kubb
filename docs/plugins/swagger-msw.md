---
layout: doc

title: \@kubb/swagger-msw
outline: deep
---
# @kubb/swagger-msw

With the MSW plugin you can use [MSW](https://mswjs.io/) to create API mocks based on a Swagger file.

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/swagger-msw
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/swagger-msw
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/swagger-msw
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/swagger-msw
```

:::


## Options


### output
Relative path to save the MSW mocks.
When output is a file it will save all models inside that file else it will create a file per schema item.

Type: `string` <br/>
Default: `"mocks"`

### groupBy
Group the MSW mocks based on the provided name.

#### type
Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### output
Relative path to save the grouped MSW mocks.
`\{\{tag\}\}` will be replaced by the current tagName.

Type: `string` <br/>
Example: `mocks/\{\{tag\}\}Controller` => `mocks/PetController` <br/>
Default: `${output}/\{\{tag\}\}Controller`

#### exportAs
Name to be used for the `export * as \{\{exportAs\}\} from './`

Type: `string` <br/>
Default: `"\{\{tag\}\}Handlers"`

### skipBy
Array containing skipBy paramaters to exclude/skip tags/operations/methods/paths.

Type: `Array<SkipBy>` <br/>

#### [0]
Type: `{ type: 'tag' | 'operationId' | 'path' | 'method' ; pattern: string | RegExp }` <br/>

### transformers

#### name
Override the name of the MSW data that is getting generated, this will also override the name of the file.

Type: `(name: string) => string` <br/>



## Depended

- [`@kubb/swagger`](/plugins/swagger)
- [`@kubb/swagger-ts`](/plugins/swagger-ts)
- [`@kubb/swagger-faker`](/plugins/swagger-faker)

## Links

- [MSW](https://mswjs.io/)