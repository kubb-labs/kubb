---
layout: doc

title: Отладка Kubb
outline: deep
---

# Отладка Kubb <a href="/plugins/react"><Badge type="info" text="@kubb/react" /></a>

## React DevTools

Kubb поддерживает React DevTools из коробки. Чтобы включить интеграцию с React DevTools, импортируйте пакет devtools в ваш конфигурационный файл `kubb.config.ts`.

![React-DevTools](/screenshots/react-devtools.png)

> [!NOTE]
> Kubb уже запустит `npx react-devtools` как часть импорта `@kubb/react/devtools`.

### Установка
Прежде чем использовать React DevTools, установите пакет React.

> [!IMPORTANT]
> Минимальная версия Kubb `v3.0.0-alpha.11`.

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

### Обновление `kubb.config.ts`
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

После запуска вы должны увидеть дерево компонентов вашего CLI. Вы даже можете инспектировать все компоненты.
> [!NOTE]
> Kubb уже отфильтрует некоторые внутренние компоненты, такие как:
>
> `KubbApp`, `KubbRoot`, `KubbErrorBoundary`, `kubb-text`, `kubb-file`, `kubb-source`, `kubb-import` и `kubb-export`.

Внутренние компоненты `kubb-text`, `kubb-file`, `kubb-source`, `kubb-import` и `kubb-export` используются для преобразования дерева React в файл, который точно включает необходимые импорты, экспорты и исходный код.

> [!IMPORTANT]
> Вы должны вручную завершить работу вашего CLI через `Ctrl+C` после того, как закончите тестирование.

![React-DevTools](/screenshots/react-devtools.gif)

## Отладка Node

Поскольку Kubb является инструментом CLI, вам нужно использовать `NODE_OPTIONS='--inspect-brk' kubb`.

`--inspect-brk` гарантирует, что отладчик уже остановится, чтобы вы могли устанавливать и использовать точки останова.

## Ссылки

- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Отладка Node](https://www.youtube.com/watch?v=i9hOCvBDMMg)
