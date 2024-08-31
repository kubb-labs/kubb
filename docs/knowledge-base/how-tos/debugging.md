---
layout: doc

title: Debugging Kubb
outline: deep
---

# Debugging Kubb

## React DevTools

Kubb supports React DevTools out-of-the-box. To enable integration with React DevTools, import the devtools package in your `kubb.config.ts` config file.

![React-DevTools](/screenshots/react-devtools.png)

> [!NOTE]
> Kubb will already run `npx react-devtools` as part of the `@kubb/react/devtools` import.

### Installation
Before you can use the React DevTools, install the React package.

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/react
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/react
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/react
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/react
```

### Update `kubb.config.ts`
:::

```typescript{1} twoslash
import '@kubb/react/devtools' // [!code ++]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginTs(),
  ],
})
```

After it starts up, you should see the component tree of your CLI. You can even inspect all components.
> [!NOTE]
> Kubb will already filter out some internal components like:
>
> `KubbApp`, `KubbRoot`, `KubbErrorBoundary`, `kubb-text`, `kubb-import` and `kubb-export`.

The internal components `kubb-text`, `kubb-file`, `kubb-source`, `kubb-import`, and `kubb-export` are utilized to convert the React tree into a file that accurately includes the necessary imports, exports, and source code.

> [!IMPORTANT]
> You must manually quit your CLI via `Ctrl+C` after you're done testing.

![React-DevTools](/screenshots/react-devtools.gif)

## Node debugging

Because Kubb is a cli tool you need to use `NODE_OPTIONS='--inspect-brk' kubb`.

`--inspect-brk` will make sure the debugger already stops so you can set and use breakpoints.

## Links

- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Node debugging](https://www.youtube.com/watch?v=i9hOCvBDMMg)
