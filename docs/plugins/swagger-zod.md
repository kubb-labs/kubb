---
layout: doc

title: \@kubb/swagger-zod
outline: deep
---
# @kubb/swagger-zod

With the Swagger Zod plugin you can use [Zod](https://zod.dev/) to validate your schema's based on a Swagger file.

## Installation

::: code-group

```shell [bun]
bun add @kubb/swagger-zod
```

```shell [pnpm]
pnpm add @kubb/swagger-zod
```

```shell [npm]
npm install @kubb/swagger-zod
```

```shell [yarn]
yarn add @kubb/swagger-zod
```

:::


## Options

### output
Relative path to save the Zod schemas.
When output is a file it will save all models inside that file else it will create a file per schema item.

Type: `string` <br/>
Default: `"zod"`

### groupBy
Group the Zod schemas based on the provided name.

#### type
Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### output
Relative path to save the grouped Zod schemas.
`{{tag}}` will be replaced by the current tagName.

Type: `string` <br/>
Example: `zod/{{tag}}Controller` => `zod/PetController` <br/>
Default: `${output}/{{tag}}Controller`

#### exportAs
Name to be used for the `export * as {{exportAs}} from './`

Type: `string` <br/>
Default: `"{{tag}}Schemas"`


### skipBy
Array containing skipBy paramaters to exclude/skip tags/operations/methods/paths.

Type: `Array<SkipBy>` <br/>

#### [0]
Type: `{ type: 'tag' | 'operationId' | 'path' | 'method' ; pattern: string | RegExp }` <br/>

### transformers

#### name
Override the name of the Zod schema that is getting generated, this will also override the name of the file.

Type: `(name: string) => string` <br/>

## Depended

- [`@kubb/swagger`](/plugins/swagger)

## Links

- [Zod](https://zod.dev/)