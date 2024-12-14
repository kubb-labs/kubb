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
5. DevTools: Because we use React, you easily attach the React DevTools, see [Debugging Kubb](/knowledge-base/debugging).

In summary, `@kubb/react` serves as a bridge between the Kubb framework and React, offering tools, components, and type safety to streamline the creation of Files.

## Installation

::: code-group

```shell [bun]
bun add -d @kubb/react
```

```shell [pnpm]
pnpm add -D @kubb/react
```

```shell [npm]
npm install --save-dev @kubb/react
```

```shell [yarn]
yarn add -D @kubb/react
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
