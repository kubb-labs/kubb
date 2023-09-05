---
layout: doc

title: \@kubb/swagger-ts
outline: deep
---
# @kubb/swagger-ts

With the Swagger TypeScript plugin you can create [TypeScript](https://www.typescriptlang.org/) types based on a Swagger file.

## Installation

::: code-group

```shell [bun]
bun add @kubb/swagger-ts
```

```shell [pnpm]
pnpm add @kubb/swagger-ts
```

```shell [npm]
npm install @kubb/swagger-ts
```

```shell [yarn]
yarn add @kubb/swagger-ts
```

:::

## Options

### output
Relative path to save the TypeScript types.
When output is a file it will save all models inside that file else it will create a file per schema item.

Type: `string` <br/>
Default: `"models"`

### groupBy
Group the TypeScript types based on the provided name.

#### type
Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### output
Relative path to save the grouped TypeScript Types.
`{{tag}}` will be replaced by the current tagName.

Type: `string` <br/>
Example: `models/{{tag}}Controller` => `models/PetController` <br/>
Default: `${output}/{{tag}}Controller`

### enumType
Choose to use `enum` or `as const` for enums. <br/>
`asConst` will use camelCase for the naming. <br/>
`asPascalConst` will use PascalCase for the naming.

Type: `'enum' | 'asConst' | 'asPascalConst'` <br/>
Default: `'asConst'`

### dateType
Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.

Type: `'string' | 'date'` <br/>
Default: `'string'`


### skipBy
Array containing skipBy paramaters to exclude/skip tags/operations/methods/paths.

Type: `Array<SkipBy>` <br/>

#### [0]
Type: `{ type: 'tag' | 'operationId' | 'path' | 'method' ; pattern: string | RegExp }` <br/>

### transformers

#### name
Override the name of the TypeScript type that is getting generated, this will also override the name of the file.

Type: `(name: string) => string` <br/>


## Depended

- [`@kubb/swagger`](/plugins/swagger)

## Links

- [TypeScript](https://www.typescriptlang.org/)