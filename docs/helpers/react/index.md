---
layout: doc

title: \@kubb/react
outline: deep
---

# @kubb/react

The purpose of `@kubb/react` is to provide a set of tools and components specifically designed for building applications with React using the Kubb framework. Here are some key aspects of its functionality:

1. JSX: Utilize JSX to create files while harnessing the power of Kubb for orchestration.
2. Component Library: It includes pre-built components that can be used in file generation.
3. Type Safety: Since it is built on TypeScript, `@kubb/react` ensures type safety.
4. Uncoupled of Kubb: `@kubb/react` can be used without needing to use `@kubb/core` or a `kubb.config.ts` file.
5. Devtools: Because we use React, you easily attach the React Devtools, see [Debugging Kubb](/knowledge-base/how-tos/debugging).

In summary, `@kubb/react` serves as a bridge between the Kubb framework and React, offering tools, components, and type safety to streamline the creation of Files.

## Installation

::: code-group

```shell [bun]
bun add @kubb/react
```

```shell [pnpm]
pnpm add @kubb/react
```

```shell [npm]
npm install @kubb/react
```

```shell [yarn]
yarn add @kubb/react
```
:::

### Configure `tsconfig.json`

::: code-group

```json [tsconfig.json]
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@kubb/react" // [!code ++]
  }
}
```

### Usage
TODO

:::
