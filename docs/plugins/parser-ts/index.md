---
layout: doc

title: \@kubb/parser-ts
outline: deep
---

# @kubb/parser-ts <a href="https://paka.dev/npm/@kubb/parser-ts@latest/api">🦙</a>

This library contains the building blocks that can be used to create TypeScript code. It's all based on TypeScript AST(an API of the TypeScript team to create AST nodes).

A good tool to visualize what AST is can be found on [TypeScript AST Viewer](https://ts-ast-viewer.com), here you can see what the AST code would be based on some TypeScript code.

To get started with TypeScript AST, I would suggest following this tutorial: [Generating TypeScript using AST's](https://nabeelvalley.co.za/docs/javascript/typescript-ast/).

<hr/>

This library contains also the logic to `print` the nodes(convert AST to string) and it also has the functionality to generate `index.ts` files based on a folder structure(see `writeIndexes`).

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/parser-ts
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/parser-ts
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/parser-ts
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/parser-ts
```

:::

## Links

- [TypeScript AST Viewer](https://ts-ast-viewer.com)
- [Generating TypeScript using AST's](https://nabeelvalley.co.za/docs/javascript/typescript-ast/)
