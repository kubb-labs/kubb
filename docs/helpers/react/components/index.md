---
layout: doc

title: \@kubb/react
outline: deep
---

# @kubb/react <a href="https://paka.dev/npm/@kubb/react@latest/api">🦙</a>

Use React to create templates/variants for any plugin.

<hr/>

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
