---
layout: doc

title: \@kubb/swagger-zodios
outline: deep
---
# @kubb/swagger-zodios

With the Swagger zodios plugin you can use [zodios](https://github.com/ecyrbe/zodios) to validate your schema's based on a Swagger file.

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>] 
bun add @kubb/swagger-zodios
```

```shell [pnpm <img src="/feature/pnpm.svg"/>] 
pnpm add @kubb/swagger-zodios
```

```shell [npm <img src="/feature/npm.svg"/>] 
npm install @kubb/swagger-zodios
```

```shell [yarn <img src="/feature/yarn.svg"/>] 
yarn add @kubb/swagger-zodios
```

:::


## Options


### output
Output to save the zodios instance.

Type: `string` <br/>
Default: `"zodios.ts"`

## Depended

- [`@kubb/swagger`](/plugins/swagger)
- [`@kubb/swagger-zod`](/plugins/swagger-zod)

## Links

- [zodios](https://github.com/ecyrbe/zodios)