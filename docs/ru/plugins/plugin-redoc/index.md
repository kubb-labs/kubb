---
layout: doc

title: \@kubb/plugin-redoc
outline: deep
---

# @kubb/plugin-redoc

С плагином Redoc вы можете создавать красивую документацию.

## Установка

::: code-group

```shell [bun]
bun add -d @kubb/plugin-redoc
```

```shell [pnpm]
pnpm add -D @kubb/plugin-redoc
```

```shell [npm]
npm install --save-dev @kubb/plugin-redoc
```

```shell [yarn]
yarn add -D @kubb/plugin-redoc
```
:::

## Опции

### output
#### output.path

Вывод для сгенерированной документации.
Для генерации мы используем [https://redocly.com/](https://redocly.com/).

|           |                |
|----------:|:---------------|
|     Type: | `string`       |
| Required: | `false`        |
|  Default: | `'docs.html'`  |


## Пример

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginRedoc } from '@kubb/plugin-redoc'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginRedoc({
      output: {
        path: './docs/index.html',
      },
    }),
  ],
})
```

## Ссылки

- [https://redocly.com/](https://redocly.com/)
