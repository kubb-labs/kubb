---
layout: doc

title: \@kubb/parser-ts
outline: deep
---

# @kubb/parser-ts

This library contains the building blocks that can be used to create TypeScript code. All of this is based on the TypeScript AST engine.
A good tool to visualize what AST is can be found on [TypeScript AST Viewer](https://ts-ast-viewer.com), here you can visualize the AST based on some TypeScript code.

To get started with TypeScript AST, I would suggest following this tutorial: [Generating TypeScript using AST's](https://nabeelvalley.co.za/docs/javascript/typescript-ast/).

## Installation

::: code-group
```shell [bun]
bun add @kubb/parser-ts
```

```shell [pnpm]
pnpm add @kubb/parser-ts
```

```shell [npm]
npm install @kubb/parser-ts
```

```shell [yarn]
yarn add @kubb/parser-ts
```
:::

## API
- `print`: Convert AST TypeScript nodes to a string based on the TypeScript printer.
- `format`: Format the generated code based on the TypeScript printer.

## Links

- [TypeScript AST Viewer](https://ts-ast-viewer.com)
- [Generating TypeScript using AST's](https://nabeelvalley.co.za/docs/javascript/typescript-ast/)
