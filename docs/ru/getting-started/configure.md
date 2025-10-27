---
layout: doc

title: Конфигурация
outline: deep
---

# Конфигурация
Kubb можно настроить с помощью конфигурационного файла (предпочтительно `kubb.config.ts`). Для этого мы используем [Cosmiconfig](https://github.com/davidtheclark/cosmiconfig) для загрузки конфигурации.

## Использование

Когда вы используете CLI Kubb, он автоматически читает конфигурационный файл из корневой директории вашего проекта и обрабатывает его в следующем порядке:
- `kubb.config.ts`
- `kubb.config.js`
- `kubb.config.mjs`
- `kubb.config.cjs`
- файл `.kubbrc`, написанный на JavaScript

Мы рекомендуем использовать формат `.ts` для конфигурационного файла и импортировать утилиту `defineConfig` из `@kubb/core`.
Этот помощник предоставляет подсказки типов и автодополнение в TypeScript, что поможет избежать ошибок в конфигурации.

> [!TIP]
> Вы также можете использовать `configs/kubb.config.ts` или `.config/kubb.config.ts` вместо `kubb.config.ts` в корне вашего проекта.

## DefineConfig

При использовании TypeScript/JavaScript следует рассмотреть использование `defineConfig`.

```typescript
export const defineConfig = (
  options:
    | MaybePromise<KubbUserConfig>
    | ((
      /** опции, полученные из флагов CLI */
      args: Args,
    ) => MaybePromise<KubbUserConfig>),
) => options
```

## Опции
Эта страница является справочником по различным опциям, которые вы можете использовать для настройки вашего конфига Kubb.
Установив следующие опции, вы можете переопределить стандартное поведение Kubb и даже расширить его с помощью своих плагинов.

### name
Имя для отображения в выводе CLI.

|       |          |
| ----: |:---------|
| Тип: | `string` |
| Обязательно: | `false`  |

::: code-group
```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  name: 'petStore',
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
})
```

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig([
  {
    name: 'petStore',
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
    },
  },
  {
    name: 'petStoreV2',
    root: '.',
    input: {
      path: './petStoreV2.yaml',
    },
    output: {
      path: './src/gen-v2',
    },
  },
])
```
:::

### root
Корневая директория проекта, которая может быть либо абсолютным путём, либо путём относительно расположения вашего файла `kubb.config.ts`.

|          |                |
|---------:|:---------------|
|    Тип: | `string`       |
| Обязательно: | `false`  |
| По умолчанию: | `process.cwd()` |


```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
})
```

### input
Вы можете использовать либо `input.path`, либо `input.data`, в зависимости от ваших конкретных потребностей.

#### input.path
Укажите ваш файл Swagger/OpenAPI, либо как абсолютный путь, либо как путь относительно [root](#root).

|           |                 |
|----------:|:----------------|
|     Тип: | `string`        |
| Обязательно: | `true`            |

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
})
```

#### input.data
Строка или объект, содержащий ваши данные Swagger/OpenAPI.

|           |                     |
|----------:|:--------------------|
|     Тип: | `string \| unknown` |
| Обязательно: | `true`              |


```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

import petStore from './petStore.yaml'

export default defineConfig({
  input: {
    data: petStore,
  },
  output: {
    path: './src/gen',
  },
})
```

### output

#### output.path
Путь, куда будут экспортированы все сгенерированные файлы.
Это может быть абсолютный путь или путь относительно указанной опции [root](#root).

|           |                 |
|----------:|:----------------|
|     Тип: | `string`        |
| Обязательно: | `true`            |


```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
})
```

#### output.clean
Очищать выходную директорию перед каждой сборкой.

|           |           |
|----------:|:----------|
|     Тип: | `boolean` |
| Обязательно: | `false`   |

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
})
```

#### output.format
Указывает инструмент форматирования, который будет использоваться.


> [!IMPORTANT]
> По умолчанию мы используем [Prettier](https://prettier.io/). Начиная с Kubb `v3.17.1` Prettier включён как зависимость, что обеспечивает обратную совместимость.


- `'prettier'`: использует [Prettier](https://prettier.io/) для форматирования кода.
- `'biome'`: использует [Biome](https://biomejs.dev/) для форматирования кода.

|           |                                  |
|----------:|:---------------------------------|
|     Тип: | `'prettier' \| 'biome' \| false` |
| Обязательно: | `false`                          |
|  По умолчанию: | `prettier`                       |


#### output.lint
Указывает инструмент форматирования, который будет использоваться.

- `'eslint'`: представляет использование [Eslint](https://eslint.org/), широко используемого линтера JavaScript.
- `'biome'`: представляет линтер [Biome](https://biomejs.dev/), современный инструмент для сканирования кода.
- `'oxlint'`: представляет инструмент [Oxlint](https://oxc.rs/docs/guide/usage/linter) для линтинга.

|           |                                            |
|----------:|:-------------------------------------------|
|     Тип: | `'eslint' \| 'biome' \| 'oxlint' \| false` |
| Обязательно: | `false`                                    |

#### output.write
Сохранять файлы в файловую систему.

|           |           |
|----------:|:----------|
|     Тип: | `boolean` |
| Обязательно: | `true`    |
|  По умолчанию: | `true`     |


```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
    write: true,
  },
})
```

#### output.extension
Переопределить расширение для генерируемых импортов и экспортов. По умолчанию каждый плагин добавляет расширение.

|           |                          |
|----------:|:-------------------------|
|     Тип: | `Record<KubbFile.Extname, KubbFile.Extname>`                |
| Обязательно: | `false`                  |
|  По умолчанию: | `{ '.ts': '.ts'}` |


```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    extension: {
      '.ts': '.js',
    },
  },
})
```

#### output.barrelType
Укажите, как должны создаваться файлы `index.ts`. Вы также можете отключить генерацию barrel файлов здесь. Хотя у каждого плагина есть своя опция `barrelType`, эта настройка контролирует создание корневого barrel файла, такого как `src/gen/index.ts`.

|           |                             |
|----------:|:----------------------------|
|     Тип: | `'all' \| 'named' \| false` |
| Обязательно: | `false`                     |
|  По умолчанию: | `'named'`                   |


```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
    barrelType: 'all',
  },
})
```

#### output.defaultBanner
Добавить стандартный баннер в начало каждого сгенерированного файла. Это дает понять, что файл был сгенерирован Kubb.
|           |                             |
|----------:|:----------------------------|
|     Тип: | `'simple' | 'full' | false` |
| Обязательно: | `false`                     |
|  По умолчанию: | `'simple'`                   |

- `'simple'`: добавит только баннер со ссылкой на Kubb
```
/**
* Generated by Kubb (https://kubb.dev/).
* Do not edit manually.
*
* Source: petStore.yaml
*/
```
- `'full'`: добавит источник, заголовок, описание и используемую версию OpenAPI


```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
    defaultBanner: false,
  },
})
```

### plugins

|           |                         |
|----------:|:------------------------|
|     Тип: | `Array<KubbUserPlugin>` |
| Обязательно: | `false`                 |


Массив плагинов Kubb, используемых для генерации. Каждый плагин может иметь дополнительные настраиваемые опции (определённые в самом плагине). Если плагин зависит от другого плагина, возникнет ошибка, если необходимая зависимость отсутствует. Подробнее см. "pre".
Как использовать и настроить плагины, см. [plugins](/ru/knowledge-base/plugins/).

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas({
      output: {
        path: 'schemas',
      },
      validate: true,
    }),
  ],
})
```

## Примеры

### Базовый

> [!TIP]
> При использовании оператора `import` вам нужно установить `"type": "module"` в вашем `package.json`.
> Вы также можете переименовать ваш файл в `kubb.config.mjs` для использования ESM или `kubb.config.cjs` для CJS.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
})
```

### Условный
Если конфиг должен определяться условно на основе флагов CLI опций, его можно экспортировать как функцию.
Здесь вы можете выбрать между возвратом опций конфига **синхронно** или **асинхронно**.

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig(({ config, watch, logLevel }) => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
  }
})
```

### Несколько плагинов

> [!TIP]
> Начиная с версии `2.x.x` или выше, мы также поддерживаем использование нескольких версий одного и того же плагина.

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
    },
    plugins: [
      pluginOas(
        {
          output: {
            path: 'schemas',
          },
        },
      ),
      pluginOas(
        {
          output: {
            path: 'schemas2',
          },
        },
      ),
    ],
  }
})
```

### Несколько конфигов

> [!TIP]
> Начиная с версии `2.x.x` или выше, мы также поддерживаем использование нескольких конфигов.

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'

export default defineConfig([
  {
    name: 'petStore',
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
    },
    plugins: [
      pluginOas(
        {
           output: {
            path: 'schemas',
          },
        },
      ),
    ],
  },
  {
    name: 'petStoreV2',
    root: '.',
    input: {
      path: './petStoreV2.yaml',
    },
    output: {
      path: './src/gen-v2',
    },
    plugins: [
      pluginOas(
        {
          output: {
            path: 'schemas',
          },
        },
      ),
    ],
  },
])
```
