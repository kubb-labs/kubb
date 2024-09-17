---
layout: doc

title: \@kubb/react
outline: deep
---

# @kubb/react

Use React to create templates/variants for any plugin.

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

<hr/>

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

:::
