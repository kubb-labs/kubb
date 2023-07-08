---
layout: doc

title: \@kubb/ts-codegen
outline: deep
---
# @kubb/ts-codegen

This library contains the building blocks that can be used to create TypeScript code. It's all based on TypeScript AST(a API of the TypeScript team to create different nodes).

A good tool to visualize what AST is can be found on [TypeScript AST Viewer](https://ts-ast-viewer.com), here you can paste in some TypeScript code and the tool will show you what the AST will be.

To get started with TypeScript AST, I would suggest following this tutorial: [Generating TypeScript using AST's](https://nabeelvalley.co.za/docs/javascript/typescript-ast/).

<hr/>

This library contains also the logic to `print` the nodes(convert AST to string) and it also hase the functionality to generate `index.ts` files based on a folder structure(see `writeIndexes`).

## Installation

::: code-group

```shell [bun]
bun add @kubb/ts-codegen
```

```shell [pnpm]
pnpm add @kubb/ts-codegen
```

```shell [npm]
npm install @kubb/ts-codegen
```

```shell [yarn]
yarn add @kubb/ts-codegen
```

:::

## Links

- [TypeScript AST Viewer](https://ts-ast-viewer.com)-
- [Generating TypeScript using AST's](https://nabeelvalley.co.za/docs/javascript/typescript-ast/)