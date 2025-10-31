---
layout: doc

title: Быстрый старт
outline: deep
---

<script setup>

import { version } from '../../../packages/core/package.json'

</script>

# Быстрый старт

## Установка <Badge type="tip" :text="version" />

### Предварительные требования

- Node.js <Badge type="tip" text="&gt;20" />
- версия TypeScript <Badge type="tip" text="&gt;4.7" />

> [!INFO]
> Версии Node.js до Node.js 20 больше не поддерживаются. Для использования Kubb выполните миграцию на Node.js 20 или выше.

> [!INFO]
> **Kubb имеет минимальную поддержку TypeScript версии 4.7**.
Если вы используете более старую версию TypeScript, выполните миграцию на версию 4.7 или новее для использования Kubb. Учтите, что на момент написания этой статьи TypeScript 4.6 уже почти два года.

### Установка Kubb
Вы можете установить Kubb через [bun](https://bun.sh/), [pnpm](https://pnpm.io/), [npm](https://www.npmjs.com/) или [yarn](https://yarnpkg.com/).

::: code-group
```shell [bun]
bun add -d @kubb/cli @kubb/core
```

```shell [pnpm]
pnpm add -D @kubb/cli @kubb/core
```

```shell [npm]
npm install --save-dev @kubb/cli @kubb/core
```

```shell [yarn]
yarn add -D @kubb/cli @kubb/core
```
:::

## Использование с CLI

> [!TIP]
> При использовании оператора `import` вам нужно установить `"type": "module"` в вашем `package.json`.
> Вы также можете переименовать ваш файл в `kubb.config.mjs` для использования ESM или `kubb.config.cjs` для CJS.
>
> Если вы используете пользовательскую конфигурацию, укажите её с помощью `--config kubb.config.js` или `--config FILE_NAME.js`.

Самый простой способ начать работу с Kubb — настроить ваш `package.json` для включения Kubb. Создайте файл настройки `kubb.config.ts` и запустите команду **Kubb generate**.
Kubb автоматически определит, какой файл или конфигурацию использовать, на основе [порядка](/ru/getting-started/configure#usage).

::: code-group
```json [package.json]
"scripts": {
  "generate": "kubb generate"
}
```

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
    },
    plugins: [],
  }
})
```
```shell [bash]
bun run generate
# или
pnpm run generate
# или
npm run generate
# или
yarn run generate
# или
npx kubb generate
```
:::

![React-DevTools](/screenshots/cli.gif)

## Использование с Node.js
Когда CLI не является опцией, вы можете использовать пакет `@kubb/core` для запуска генерации. Это то же самое, что и CLI, но без интерфейса или прогресс-бара.
```typescript [index.ts]
import { write } from '@kubb/fs'
import { build, getSource } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginClient } from '@kubb/plugin-client'

const { error, files, pluginManager } = await build({
  config: {
    root: '.',
    input: {
      data: '',
    },
    output: {
      path: './gen',
    },
    plugins: [
      pluginOas(),
      pluginClient(),
    ]
  },
})


for (const file of files) {
  const source = await getSource(file)

  await write(source, file.path)
}
```

## Пример

::: code-group
```typescript twoslash [single]
import { defineConfig } from '@kubb/core'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
    },
    plugins: [],
  }
})
```

```typescript twoslash [multiple]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig(() => {
  return [
    {
      root: '.',
      input: {
        path: './petStore.yaml',
      },
      output: {
        path: './src/gen',
      },
      plugins: [
        pluginOas({}),
        pluginTs({}),
        pluginReactQuery({}),
      ],
    },
    {
      root: '.',
      input: {
        path: './petStore2.yaml',
      },
      output: {
        path: './src/gen2',
      },
      plugins: [
        pluginOas({}),
        pluginTs({}),
        pluginReactQuery({}),
      ],
    },
  ]
})
```
:::


Если вы ищете полностью работающий пример, посмотрите наш [простой пример на CodesSandbox](https://codesandbox.io/s/github/kubb-labs/kubb/tree/main/examples/typescript).
