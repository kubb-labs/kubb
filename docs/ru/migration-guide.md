---
layout: doc

title: Миграция на Kubb v3
outline: deep
---

# Миграция на Kubb v3

## Новые возможности

### Generators

> [!TIP]
> Generators — это замена `templates`

См. [Generators](/ru/knowledge-base/generators).

### kubb.config.ts
К выходным данным добавлены 2 дополнительные опции:
#### `output.extension`
В последней версии [Node.js](https://nodejs.org/api/esm.html#mandatory-file-extensions) требуются расширения файлов, поэтому мы автоматически добавляем `.ts` к каждому файлу. Однако не все проекты используют последнюю конфигурацию Node.js для расширений. С помощью этой опции вы можете удалить расширение или использовать `.js` вместо этого.

См. [output.extension](/ru/getting-started/configure#output-extension).

#### `output.barrelType`
укажите, как должны создаваться файлы `index.ts`, это будет работать для корневого файла `index.ts`. На уровне плагина также есть новая опция для определения этого.

См. [output.barrelType](/ru/getting-started/configure#output-barreltype).

### Переписывание CLI
|          |           |
|---------:|:----------|
| Слева: v3 | Справа: v2 |

![React-DevTools](/screenshots/cli-speed.gif)
CLI и ядро были переработаны для повышения скорости, и в v3 также будет отображаться более релевантная информация.
- индикатор выполнения для выполнения плагинов.
- индикатор выполнения для записи файлов.
- временные метки рядом с каждой выполняемой командой.
- улучшенная поддержка инструментов CI
- использование TypeScript Strict
- на 20-30% более быстрое выполнение в целом
- [режим отладки(`--debug`)](helpers/cli#debug), который создаст 2 лог-файла
  - `.kubb/kubb-DATE_STRING.log`
  - `.kubb/kubb-files.log`
- все проблемы можно увидеть здесь: [Kubb v3 ideas](https://github.com/kubb-labs/kubb/issues/1115)


## Критические изменения

### Переименование плагинов
Ранее мы использовали название swagger, чтобы указать, что мы поддерживаем только файлы Swagger. Однако теперь мы также поддерживаем OpenAPI v3 и v3.1. Это изменение позволяет потенциально интегрировать дополнительные спецификации, помимо файлов OpenAPI, в будущем.

> [!TIP]
> Импорты по умолчанию также удаляются в v3, поэтому вам нужно импортировать плагин следующим образом(поддержка лучшего tree-shaking для ESM):
>
> `import { pluginReactQuery } from '@kubb/plugin-react-query'`

- `@kubb/swagger-client` становится `@kubb/plugin-client`
- `@kubb/swagger-faker` становится `@kubb/plugin-faker`
- `@kubb/swagger-msw` становится `@kubb/plugin-msw`
- `@kubb/swagger` становится `@kubb/plugin-oas`
- `@kubb/plugin-tanstack-query` становится `@kubb/plugin-react-query` для [React](https://react.dev/)
- `@kubb/plugin-tanstack-query` становится `@kubb/plugin-solid-query` для [Solid](https://www.solidjs.com/)
- `@kubb/plugin-tanstack-query` становится `@kubb/plugin-svelte-query` для [Svelte](https://svelte.dev/)
- `@kubb/plugin-tanstack-query` становится `@kubb/plugin-react-query` для [Vue](https://vuejs.org/)
- `@kubb/swagger-redoc` становится `@kubb/plugin-redoc`
- `@kubb/swagger-swr` становится `@kubb/plugin-swr`
- `@kubb/swagger-ts` становится `@kubb/plugin-ts`
- `@kubb/swagger-zod` становится `@kubb/plugin-zod`
- `@kubb/swagger-zodios` становится `@kubb/plugin-zodios`


### Tanstack-query
Мы прекратим поддержку (Tanstack-Query](https://tanstack.com/query/latest/docs/framework/react/overview) v4 в пользу v5. Если вам все еще требуется генерация для v4, вы можете использовать [Kubb v2](https://v2.kubb.dev).
Кроме того, каждый фреймворк теперь будет упакован отдельно, а не включен в один пакет, содержащий код для всех фреймворков.

|  Фреймворк | Пакеты                        |
|-----------:|:------------------------------|
|  `'react'` | `'@kubb/plugin-react-query'`  |
|  `'solid'` | `'@kubb/plugin-solid-query'`  |
| `'svelte'` | `'@kubb/plugin-svelte-query'` |
|    `'vue'` | `'@kubb/plugin-vue-query'`    |


```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query' // [!code --]
import { pluginReactQuery } from '@kubb/plugin-react-query' // [!code ++]
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
    pluginTanstackQuery({ // [!code --]
      output: { // [!code --]
        path: './hooks', // [!code --]
      }, // [!code --]
      framework: 'react', // [!code --]
    }), // [!code --]
    pluginReactQuery({ // [!code ++]
      output: { // [!code ++]
        path: './hooks', // [!code ++]
      }, // [!code ++]
    }), // [!code ++]
  ],
})
```

### MSW
Мы прекратим поддержку (MSW](https://mswjs.io/) v1 в пользу использования v2. Если вам все еще нужно генерировать моки для v1, вы можете использовать [Kubb v2](https://v2.kubb.dev).

### Output
- `output.banner`: добавление кода в начало каждого файла
- `output.footer`: добавление кода в конец каждого файла
- `output.exportType`: поведение осталось прежним, мы переименовали опцию в `output.barrelType` и упростили значения.
```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core"
import { pluginOas } from "@kubb/plugin-oas"
import { pluginTs } from "@kubb/plugin-ts"
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginClient({
      output: {
        exportType: false, // [!code --]
        barrelType: false, // [!code ++]
      },
    }),
    pluginClient({
      output: {
        exportType: 'barrel', // [!code --]
        barrelType: 'all', // [!code ++]
      },
    }),
    pluginClient({
      output: {
        exportType: 'barrelNamed', // [!code --]
        barrelType: 'named', // [!code ++]
      },
    }),
  ],
})
```
- `output.extName`: вместо того, чтобы определять это в каждом плагине, мы решили переместить его в [`output.extension`](/ru/getting-started/configure#output-extension).
```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core"
import { pluginOas } from "@kubb/plugin-oas"
import { pluginTs } from "@kubb/plugin-ts"
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    extension: { // [!code ++]
      '.ts': '.js', // [!code ++]
    }, // [!code ++]
  },
  plugins: [
    pluginOas(),
    pluginClient({
      output: {
        path: './clients/axios',
        extName: '.js', // [!code --]
      },
    }),
  ],
})
```
- `output.exportAs`: это свойство было применимо только для `@kubb/plugin-client`, где мы стремились объединить функциональность в один контроллер. В v3 использование `group` уже создаст файл контроллера.
::: code-group
```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core"
import { pluginOas } from "@kubb/plugin-oas"
import { pluginTs } from "@kubb/plugin-ts"
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginClient({
      output: {
        path: './clients/axios',
        exportAs: 'clients' // [!code --]
      },
      group: { // [!code ++]
        type: 'tag', // [!code ++]
        name({ group }){ // [!code ++]
          return `${group}Controller` // [!code ++]
        } // [!code ++]
      } // [!code ++]
    }),
  ],
})
```
```typescript [src/gen/clients/axios/petController/petService.ts]
import { addPet } from './addPet.js'
import { deletePet } from './deletePet.js'

export function petService() {
  return { addPet, deletePet }
}

```
:::

### Group
- `group.output`: удалено в пользу использования `group.name`, выходные данные будут автоматически создаваться на основе `root`, `output.path` и `output.path` выбранного плагина.
```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core"
import { pluginOas } from "@kubb/plugin-oas"
import { pluginTs } from "@kubb/plugin-ts"
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginClient({
      group: {
        type: 'tag',
        output: './clients/axios/{{tag}}Service', // [!code --]
        name: ({ group }) => `${group}Service`, // [!code ++]
      },
    }),
  ],
})
```
- `group.exportAs`: это свойство было применимо только для `@kubb/plugin-client`, где мы стремились объединить функциональность в один контроллер. В v3 использование `group` уже создаст файл контроллера.
::: code-group
```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core"
import { pluginOas } from "@kubb/plugin-oas"
import { pluginTs } from "@kubb/plugin-ts"
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginClient({
      output: {
        path: './clients/axios',
      },
      group: {
        exportAs: 'clients',
        name({ group }){
          return `${group}Controller`
        }
      }
    }),
  ],
})
```
```typescript [src/gen/clients/axios/petController/petService.ts]
import { addPet } from './addPet.js'
import { deletePet } from './deletePet.js'

export function petService() {
  return { addPet, deletePet }
}

```
:::


### Дополнительно
- минимальная поддержка Node 20
- рефакторинг группировки(использование name вместо output) и вывод на основе `output` текущего плагина
- удаление плагина Zodios

## Изменения для конкретных плагинов

### @kubb/plugin-oas
Раньше мы использовали `openapi-format` для фильтрации некоторых операций или путей, но в v3 это было удалено в пользу использования [https://github.com/thim81/openapi-format](https://github.com/thim81/openapi-format) перед использованием вашего Swagger/OpenAPI в Kubb.

- `experimentalFilter`
- `experimentalSort`

См. [Filter And Sort](/ru/knowledge-base/filter-and-sort).

### @kubb/plugin-client
- `client.importPath` становится `importPath`
- `operations` будет контролировать создание файла со всеми операциями, сгруппированными по методам.
- `parser` позволит выбрать между отсутствием парсера(`client`) или использованием Zod(`zod`).
- `paramsType` позволит иметь один объект для передачи ваших pathParams, params, headers и data.

### @kubb/plugin-ts
- `enumType` `'asPascalConst'` был удален как опция.
- `enumSuffix` будет `'enum'` по умолчанию.
- `mapper` может использоваться для переопределения того, какой TypeScript TsNode следует использовать.


### @kubb/plugin-zod
- `typedSchema` становится `inferred`
- `operations` будет контролировать создание файла со всеми операциями, сгруппированными по методам.
- `mapper` может использоваться для переопределения того, какие примитивы Zod следует использовать.

### @kubb/plugin-faker
- `mapper` может использоваться для переопределения того, какую функциональность Faker следует использовать.

### @kubb/plugin-swr
- `dataReturnType` становится `client.dataReturnType`
- `pathParamsType` так же, как в `@kubb/plugin-client`
- `parser` так же, как в `@kubb/plugin-client`
- `queryKey` так же, как в `@kubb/plugin-react-query`
- `query.methods` так же, как в `@kubb/plugin-react-query`
- `query.importPath` так же, как в `@kubb/plugin-react-query`
- `mutationKey` так же, как в `@kubb/plugin-react-query`
- `mutation.methods` так же, как в `@kubb/plugin-react-query`
- `mutation.importPath` так же, как в `@kubb/plugin-react-query`
- `paramsType` позволит иметь один объект для передачи ваших pathParams, params, headers и data.

### @kubb/plugin-react-query
- `dataReturnType` становится `client.dataReturnType`
- `pathParamsType` так же, как в `@kubb/plugin-client`
- `parser` так же, как в `@kubb/plugin-client`
- `queryOptions` был удален как опция
- `mutate.methods` становится `mutation.methods`
- `mutate.importPath` становится `mutation.importPath`
- мутации будут включать сгенерированный `mutationkey`
- `enabled` будет генерироваться на основе того, какие параметры обязательны
- поддержка `signal`, что позволяет отменить запрос
- удаление `mutate.variablesType` и использование `'mutate'` по умолчанию
- `paramsType` позволит иметь один объект для передачи ваших pathParams, params, headers и data.

### @kubb/plugin-msw
- `parser` для переключения между использованием Faker(`'faker'`) для ваших данных или определением собственных данных с помощью `'data'`.
- по умолчанию использование функции с параметром `data` для переопределения ответа MSW.
```typescript
export const addPetHandler = http.post('*/pet', function handler(info) { // [!code --]
  return new Response(JSON.stringify(createAddPetMutationResponse()), { // [!code --]
    headers: { // [!code --]
      'Content-Type': 'application/json', // [!code --]
    }, // [!code --]
  }) // [!code --]
}) // [!code --]

export function addPetHandler(data?: AddPetMutationResponse) { // [!code ++]
  return http.post('*/pet', function handler(info) { // [!code ++]
    return new Response(JSON.stringify(createAddPetMutationResponse(data)), { // [!code ++]
      headers: { // [!code ++]
        'Content-Type': 'application/json', // [!code ++]
      }, // [!code ++]
    }) // [!code ++]
  }) // [!code ++]
} // [!code ++]
```
