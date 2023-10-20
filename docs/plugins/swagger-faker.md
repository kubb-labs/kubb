---
layout: doc

title: \@kubb/swagger-faker
outline: deep
---
# @kubb/swagger-faker <a href="https://paka.dev/npm/@kubb/swagger-faker@latest/api">🦙</a>

With the Swagger Faker plugin you can use [Faker](https://fakerjs.dev/) to create mocks based on a Swagger file.

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/swagger-faker
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/swagger-faker
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/swagger-faker
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/swagger-faker
```

:::


## Options


### output
Relative path to save the Faker mocks.
When output is a file it will save all models inside that file else it will create a file per schema item.

Type: `string` <br/>
Default: `'mocks'`

### groupBy
Group the Faker mocks based on the provided name.

#### type
Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### output
::: v-pre
Relative path to save the grouped Faker mocks.
`{{tag}}` will be replaced by the current tagName.
:::

::: v-pre
Type: `string` <br/>
Example: `mocks/{{tag}}Controller` => `mocks/PetController` <br/>
Default: `${output}/{{tag}}Controller`
:::

#### exportAs
Name to be used for the `export * as {{exportAs}} from './`

::: v-pre
Type: `string` <br/>
Default: `'{{tag}}Mocks'`
:::

### skipBy
Array containing skipBy paramaters to exclude/skip tags/operations/methods/paths.

Type: `Array<SkipBy>` <br/>

#### [0]
Type: `{ type: 'tag' | 'operationId' | 'path' | 'method' ; pattern: string | RegExp }` <br/>

### transformers

#### name
Override the name of the faker data that is getting generated, this will also override the name of the file.

Type: `(name: string) => string` <br/>

### dateType
Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.

Type: `'string' | 'date'` <br/>
Default: `'string'`


## Depended

- [`@kubb/swagger`](/plugins/swagger)
- [`@kubb/swagger-ts`](/plugins/swagger-ts)

## Links

- [Faker](https://fakerjs.dev/)