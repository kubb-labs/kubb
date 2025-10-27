---
layout: doc

title: Базовое руководство
outline: deep
---

# Базовое руководство

Это руководство описывает, как настроить Kubb и использовать плагин [`@kubb/plugin-ts`](/ru/plugins/plugin-ts/) для генерации типов на основе файла `petStore.yaml`.

Настройка будет содержать с самого начала следующую структуру папок:

```
.
├── src
├── petStore.yaml
├── kubb.config.ts
└── package.json
```

## Шаг первый

Настройте файл `kubb.config.ts` на основе раздела [Быстрый старт](/ru/guide/quick-start).

Мы добавим плагины [`@kubb/plugin-oas`](/ru/plugins/plugin-oas/) и [`@kubb/plugin-ts`](/ru/plugins/plugin-ts/) (который зависит от плагина [`@kubb/plugin-oas`](/ru/plugins/plugin-oas/)). Вместе эти два плагина будут генерировать типы TypeScript.

Кроме того, мы также установим `generators` в пустой массив для плагина [`@kubb/plugin-oas`](/ru/plugins/plugin-oas), потому что нам не нужно, чтобы плагин генерировал для нас JSON-схемы.

- Для плагина [`@kubb/plugin-ts`](/ru/plugins/plugin-ts/) мы установим `output` в папку `models`.

::: code-group

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src',
    },
    plugins: [
      pluginOas(
        {
          generators: [],
          validate: true,
        },
      ),
      pluginTs(
        {
          output: {
            path: 'models',
          },
        },
      ),
    ],
  }
})
```

:::

Это приведет к следующей структуре папок после выполнения Kubb

```
.
├── src/
│   └── models/
│       ├── typeA.ts
│       └── typeB.ts
├── petStore.yaml
├── kubb.config.ts
└── package.json
```

## Шаг второй

Обновите файл `package.json` и установите `Kubb`, см. раздел [установка](/ru/getting-started/configure/).

Ваш `package.json` будет выглядеть следующим образом:

::: code-group

```json [package.json]
{
  "name": "your project",
  "scripts": {
    "generate": "kubb generate --config kubb.config.ts"
  },
  "dependencies": {
    "@kubb/cli": "latest",
    "@kubb/core": "latest",
    "@kubb/swagger": "latest",
    "@kubb/plugin-ts": "latest"
  }
}
```

:::

## Шаг третий

Запустите скрипт Kubb с помощью следующей команды.

::: code-group

```shell [bun]
bun run generate
```

```shell [pnpm]
pnpm run generate
```

```shell [npm]
npm run generate
```

```shell [yarn]
yarn run generate
```

:::

## Шаг четвертый

Выпейте пиво и наблюдайте, как Kubb генерирует ваши файлы.

<img src="/kubb-generate.gif" style="{ display: 'inline' }" alt="Генерация Kubb" />
