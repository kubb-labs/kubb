---
layout: doc

title: \@kubb/swagger-faker
outline: deep
---
# @kubb/swagger-faker

With the Swagger Faker plugin you can use [Faker](https://fakerjs.dev/) to create mocks based on a Swagger file.

## Installation

::: code-group

```shell [pnpm]
pnpm add @kubb/swagger-faker
```

```shell [npm]
npm install @kubb/swagger-faker
```

```shell [yarn]
yarn add @kubb/swagger-faker
```

:::


## Options


### output
Relative path to save the Faker mocks.
When output is a file it will save all models inside that file else it will create a file per schema item.

Type: `string` <br/>
Default: `"mocks"`

### groupBy
Group the Faker mocks based on the provided name.

#### type
Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### output
Relative path to save the grouped Faker mocks.
`{{tag}}` will be replaced by the current tagName.

Type: `string` <br/>
Example: `mocks/{{tag}}Controller` => `mocks/PetController` <br/>
Default: `${output}/{{tag}}Controller`

#### exportAs
Name to be used for the `export * as {{exportAs}} from './`

Type: `string` <br/>
Default: `"{{tag}}Mocks"`

### skipBy
Array containing skipBy paramaters to exclude/skip tags/operations/methods/paths.

Type: `Array<SkipBy>` <br/>

#### [0]
Type: `{ type: 'tag' | 'operationId' | 'path' | 'method' ; pattern: string | RegExp }` <br/>


## Depended

- [`@kubb/swagger`](/plugins/swagger)
- [`@kubb/swagger-ts`](/plugins/swagger-ts)

## Links

- [Faker](https://fakerjs.dev/)