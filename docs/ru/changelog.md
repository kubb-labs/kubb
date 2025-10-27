---
title: История изменений
---

# История изменений

# 4.3.1
- [`react`](/ru/helpers/react/): обновление peerdeps `@kubb/react`
# 4.3.0
- [`plugin-zod`](/ru/plugins/plugin-zod): добавлена поддержка эксклюзивных минимума и максимума с `z.number().gt(5);` и `z.number().lt(5);`

# 4.2.2
- [`core`](/ru/plugins/core): исправление сбоя при некорректной версии патча Fabric

# 4.2.1
- обновление пакетов

# 4.2.0
- [`plugin-msw`](/ru/plugins/plugin-msw): генерация ответов для кодов статуса

# 4.1.4
- [`plugin-faker`](/ru/plugins/plugin-faker): добавлен необязательный параметр data для переопределения строк и чисел, сгенерированных faker по умолчанию
- [`plugin-client`](/ru/plugins/plugin-client): корректная обработка заголовка content-type для multipart/form-data
- [`plugin-zod`](/ru/plugins/plugin-zod): добавлен тип к операциям, генерируемым плагином zod

# 4.1.3
- [`plugin-msw`](/ru/plugins/plugin-msw): добавлен promise ответ к обработчикам msw

# 4.1.2
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): защита infinite hooks и упрощение типизации мутаций
- [`core`](/ru/plugins/core): генерация не удается при использовании регулярных выражений с флагами
- [`plugin-zod`](/ru/plugins/plugin-zod): url также должен устанавливать min и max при определении

# 4.1.1
- обновление внутренних пакетов

# 4.1.0
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): добавлен mutationOptions к react-query
- [`plugin-zod`](/ru/plugins/plugin-zod): использование `z.ZodType` при использовании Zod v4

# 4.0.2
- [`plugin-zod`](/ru/plugins/plugin-zod): корректная экранизация omit ключей с `'`
- [`plugin-client`](/ru/plugins/plugin-client): поддержка stringify при использовании `multipart/form-data`

# 4.0.1
- обновление внутренних пакетов

# 4.0.0
- [`plugin-ts`](/ru/plugins/plugin-ts): перечисления, сгенерированные с "asConst", имеют суффикс "Key"
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): unwrap в vue infinite query
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): выравнивание generic для infinite query с tanstack

# 3.18.4
- [`plugin-ts`](/ru/plugins/plugin-ts): хранение `usedEnumNames` в кеше, но не между сборками

# 3.18.3
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): корректный generic для infiniteQuery(проблема #1790)
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): корректный generic для infiniteQuery(проблема #1790)

# 3.18.2
- [`core`](/ru/plugins/core): обновление пакетов

# 3.18.1
- [`parser/ts`](/ru/parsers/parser-ts/): откат удаления prettier как форматировщика по умолчанию

# 3.18.0
- [`core`](/ru/plugins/core): поддержка пользовательских форматировщиков, таких как [Biome](https://biomejs.dev/) и [Prettier](https://prettier.io/)
- [`core`](/ru/plugins/core): поддержка пользовательских линтеров, таких как [Biome](https://biomejs.dev/), [Eslint](https://eslint.org/) и [Oxlint](https://oxc.rs/docs/guide/usage/linter)
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): использование `toURLPath` для mutationKey
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): использование `toURLPath` для mutationKey
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): использование `toURLPath` для mutationKey
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): использование `toURLPath` для mutationKey

# 3.17.1
- [`plugin-faker`](/ru/plugins/plugin-faker): корректная экранизация regex и без `new RegExp()`
- [`plugin-zod`](/ru/plugins/plugin-zod): корректная экранизация regex с использованием `new RegExp().source` под капотом
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): исправление ошибки typescript, связанной с тем, что `queryClient` не имеет значения по умолчанию
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): исправление ошибки typescript, связанной с тем, что `queryClient` не имеет значения по умолчанию
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): исправление ошибки typescript, связанной с тем, что `queryClient` не имеет значения по умолчанию
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): исправление ошибки typescript, связанной с тем, что `queryClient` не имеет значения по умолчанию

# 3.17.0
- [`plugin-client`](/ru/plugins/plugin-client): экспорт метода при использовании `urlType`, как обсуждалось в [1828](https://github.com/kubb-labs/kubb/discussions/1828)

# 3.16.4
- [`plugin-zod`](/ru/plugins/plugin-zod): поддержка toZod для Zod v4

# 3.16.3
- [`plugin-msw`](/ru/plugins/plugin-msw): возврат contentType из ответа вместо запроса
- [`plugin-faker`](/ru/plugins/plugin-faker): обновление парсера Faker для работы с перечислениями во вложенных объектах

# 3.16.2
- обновление внутренних зависимостей

# 3.16.1
- [`plugin-client`](/ru/plugins/plugin-client): `validateStatus` как часть клиента axios
- [`plugin-ts`](/ru/plugins/plugin-ts): ERROR Warning: Encountered two children with the same key
- [`plugin-ts`](/ru/plugins/plugin-ts): не учитывает шаблон свойства для js doc

# 3.16.0
- [`core`](/ru/plugins/core): улучшение использования памяти за счет использования параллелизма

# 3.15.0
- [`plugin-swr`](/ru/plugins/plugin-swr/): опция `immutable` для отключения `revalidateIfStale`, `revalidateOnFocus` и `revalidateOnReconnect`, см. [https://swr.vercel.app/docs/revalidation#disable-automatic-revalidations](https://swr.vercel.app/docs/revalidation#disable-automatic-revalidations).
```typescript
const { data, error } = useGetOrderById(2) // [!code --]
const { data, error } = useGetOrderById(2, { immutable: true }) // [!code ++]
```

# 3.14.4
- [`plugin-oas`](/ru/plugins/plugin-oas): AnyOf, где используется `const`(пустая строка), не должен преобразовываться в nullable значение.
```
"anyOf": [
  {
    "const": "",
    "type": "string"
  },
  {
    "format": "email",
    "type": "string"
  }
]
```
```typescript
type Order ={
  status?: null | string // [!code --]
  status?: string // [!code ++]
}

```

# 3.14.3
- [`plugin-client`](/ru/plugins/plugin-client): поддержка формата Google api, например: `my-api/foo/v1/bar/{id}:search`
- [`plugin-msw`](/ru/plugins/plugin-msw): поддержка формата Google api, например: `my-api/foo/v1/bar/{id}:search`

# 3.14.2
- [`plugin-oas`](/ru/plugins/plugin-oas): обязательные свойства обрабатываются некорректно при использовании allOf

# 3.14.1
- [`parser/ts`](/ru/parsers/parser-ts/): исправлен порядок импорта и экспорта файлов при использовании `print` TypeScript + исправлена версия TypeScript

# 3.14.0
- [`cli`](/ru/helpers/cli/): команда cli `validate` для проверки Swagger/OpenAPI файла: `npx kubb validate --input swagger.json`
- [`cli`](/ru/helpers/cli/): команда cli `mcp` для запуска MCP клиента для взаимодействия с LLM(например, Claude): `npx kubb mcp`

# 3.13.2
- [`plugin-client`](/ru/plugins/plugin-client): ошибка затененных переменных при использовании `client`, использование `fetch` вместо этого, когда требуется импорт `@kubb/plugin-client/clients/axios`.

# 3.13.1
- [`plugin-client`](/ru/plugins/plugin-client): парсинг и проверка данных запроса с помощью Zod, включая FormData, перед отправкой клиенту.

# 3.13.0
- [`plugin-ts`](/ru/plugins/plugin-ts): добавлен `emptySchemaType`. используется когда схема "пустая" и по умолчанию равна значению unknownType, если не указано, что поддерживает обратную совместимость.
- [`plugin-zod`](/ru/plugins/plugin-zod): добавлен `emptySchemaType`. используется когда схема "пустая" и по умолчанию равна значению unknownType, если не указано, что поддерживает обратную совместимость.
- [`plugin-faker`](/ru/plugins/plugin-faker): добавлена опция `emptySchemaType`. используется когда схема "пустая" и по умолчанию равна значению unknownType, если не указано, что поддерживает обратную совместимость.

# 3.12.2
- [`core`](/ru/plugins/core): улучшенная поддержка Windows [обратные слеши](https://github.com/kubb-labs/kubb/issues/1776)

# 3.12.1
- [`plugin-zod`](/ru/plugins/plugin-zod): корректный импорт v4, когда importPath не определен

# 3.12.0
- [`plugin-zod`](/ru/plugins/plugin-zod): полная поддержка Zod v4

# 3.11.1
- [`plugin-oas`](/ru/plugins/plugin-oas): разрешение anyof при совместном использовании с allof

# 3.11.0
- [`plugin-oas`](/ru/plugins/plugin-oas): флаг discriminator, который может переопределить схему при использовании mapping(см. inherit), решает [https://github.com/kubb-labs/kubb/issues/1736](https://github.com/kubb-labs/kubb/issues/1736)
- [`plugin-zod`](/ru/plugins/plugin-zod): перечисления типа "number" парсятся в integers
- [`plugin-faker`](/ru/plugins/plugin-faker): несовместимый тип, используемый для true literal enum в query param

# 3.10.16
- [`plugin-ts`](/ru/plugins/plugin-ts): constEnum должен обрабатываться как export * вместо export type *

# 3.10.15
- [`plugin-ts`](/ru/plugins/plugin-ts): несоответствие nullable ответа для плагинов @kubb/plugin-ts и @kubb/plugin-zod

# 3.10.14
- [`plugin-faker`](/ru/plugins/plugin-faker): min и max не применяются к функциям faker, когда определен только один из них
- [`core`](/ru/plugins/core): uniqueBy для file.sources(isExportable и name)
- [`plugin-ts`](/ru/plugins/plugin-ts): дублирующие перечисления в TypeScript типах

# 3.10.13
- [`plugin-zod`](/ru/plugins/plugin-zod): объекты параметров запроса больше не являются необязательными, если хотя бы один параметр имеет значение по умолчанию

# 3.10.12
- [`plugin-oas`](/ru/plugins/plugin-oas): разрешение нескольких `discriminator.mapping` с одинаковым $ref

# 3.10.11
- [`plugin-zod`](/ru/plugins/plugin-zod): обновление парсера для включения последней v4 Zod

# 3.10.10
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): исправление ошибки typescript
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): исправление ошибки typescript
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): исправление ошибки typescript
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): исправление ошибки typescript

# 3.10.9
- [`core`](/ru/plugins/core): обновление пакетов

# 3.10.8
- [`plugin-oas`](/ru/plugins/plugin-oas): кеширование oas

# 3.10.7
- [`core`](/ru/plugins/core): улучшенная поддержка Windows

# 3.10.6
- [`plugin-oas`](/ru/plugins/plugin-oas): улучшение генерации типов кортежей

# 3.10.5
- [`plugin-oas`](/ru/plugins/plugin-oas): переписывание схем с несколькими типами
- [`plugin-faker`](/ru/plugins/plugin-faker): исправление типов перечислений, вложенных в массив

# 3.10.4
- [`plugin-mcp`](/ru/plugins/plugin-mcp/): улучшенное использование инструментов MCP на основе oas

# 3.10.3
- [`plugin-zod`](/ru/plugins/plugin-zod): улучшенное преобразование `discriminator`

# 3.10.2
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): удалить generic TQueryData при использовании suspense

# 3.10.1
- обновление внутренних библиотек

# 3.10.0
- [`plugin-mcp`](/ru/plugins/plugin-mcp/): создание сервера [MCP](https://modelcontextprotocol.io) на основе вашего OpenAPI файла и взаимодействие с AI, таким как Claude.

- ![Claud interaction](/screenshots/claude-interaction.gif)

# 3.9.5
- [`plugin-ts`](/ru/plugins/plugin-ts): тег описания openapi не попадает в JSDoc

# 3.9.4
- [`plugin-swr`](/ru/plugins/plugin-swr/): тип запроса выводится как any при генерации SWR hooks с useSWR

# 3.9.3
- [`plugin-ts`](/ru/plugins/plugin-ts): nullable: true теперь генерирует | null union

# 3.9.2
- [`plugin-client`](/ru/plugins/plugin-client): исключение baseURL, когда не установлен

# 3.9.1
- [`plugin-zod`](/ru/plugins/plugin-zod): уменьшение использования any
- [`plugin-faker`](/ru/plugins/plugin-faker): уменьшение использования any

## 3.9.0
- [`core`](/ru/plugins/core): добавлена функция баннера по умолчанию для улучшения распознаваемости сгенерированных файлов от [@akinoccc](https://github.com/akinoccc)

## 3.8.1
- [`plugin-zod`](/ru/plugins/plugin-zod): поддержка Zod v4(beta)

## 3.8.0
- [`react`](/ru/helpers/react/): поддержка React 19 и экспорт `useState`, `useEffect`, `useRef` из `@kubb/react`

## 3.7.7
- [`plugin-oas`](/ru/plugins/plugin-oas): поддержка переопределения/исключения/включения contentType

## 3.7.6
- [`plugin-client`](/ru/plugins/plugin-client): удаление экспорта url

## 3.7.5
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): поддержка пользовательского QueryClient
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): поддержка пользовательского QueryClient
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): поддержка пользовательского QueryClient
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): поддержка пользовательского QueryClient

## 3.7.4
- [`plugin-redoc`](/ru/plugins/plugin-redoc): настройка redoc без зависимости React

## 3.7.3
- [`plugin-zod`](/ru/plugins/plugin-zod): фиксированная версия для [`@hono/zod-openapi`](https://github.com/honojs/middleware/issues/1109)

## 3.7.2
- [`plugin-client`](/ru/plugins/plugin-client): метод должен быть необязательным для клиента fetch и axios по умолчанию

## 3.7.1
- [`plugin-faker`](/ru/plugins/plugin-faker/): улучшенное форматирование фиктивных дат и времени

## 3.7.0
- [`plugin-cypress`](/ru/plugins/plugin-cypress): поддержка `cy.request` с новым плагином `@kubb/plugin-cypress`

## 3.6.5
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): `TVariables` установлен в `void` по умолчанию
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): `TVariables` установлен в `void` по умолчанию
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): `TVariables` установлен в `void` по умолчанию
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): `TVariables` установлен в `void` по умолчанию
- [`plugin-zod`](/ru/plugins/plugin-zod): zod omit вместо `z.never`

## 3.6.4
- обновление внешних пакетов

## 3.6.3
- [`plugin-oas`](/ru/plugins/plugin-oas): дополнительные проверки пустых значений для свойств типа discriminator
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): разрешение переопределения контекста мутации с помощью TypeScript generic
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): разрешение переопределения контекста мутации с помощью TypeScript generic
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): разрешение переопределения контекста мутации с помощью TypeScript generic
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): разрешение переопределения контекста мутации с помощью TypeScript generic

## 3.6.2
- [`plugin-zod`](/ru/plugins/plugin-zod): правильная обработка циклических зависимостей при использовании помощника `ToZod`

## 3.6.1
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): проверка запроса с помощью zod перед выполнением HTTP-вызова
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): проверка запроса с помощью zod перед выполнением HTTP-вызова
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): проверка запроса с помощью zod перед выполнением HTTP-вызова
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): проверка запроса с помощью zod перед выполнением HTTP-вызова
- [`plugin-swr`](/ru/plugins/plugin-swr/): проверка запроса с помощью zod перед выполнением HTTP-вызова
- [`plugin-client`](/ru/plugins/plugin-client): проверка запроса с помощью zod перед выполнением HTTP-вызова

## 3.6.0
- [`plugin-zod`](/ru/plugins/plugin-zod): добавлена опция wrapOutput для дальнейшей настройки генерируемых zod схем, что делает возможным использование `OpenAPI` поверх вашей схемы Zod.
```typescript
import { z } from '@hono/zod-openapi'

export const showPetByIdError = z
  .lazy(() => error)
  .openapi({
    examples: [
      { sample: { summary: 'A sample error', value: { code: 1, message: 'A sample error message' } } },
      { other_example: { summary: 'Another sample error', value: { code: 2, message: 'A totally specific message' } } },
    ],
  })
```
- [`plugin-oas`](/ru/plugins/plugin-oas): discriminator mapping с literal типами
``` typescript
export type FooBase = {
  /**
   * @type string
   */
-  $type: string;
+  $type: "type-string" | "type-number";
};
```
``` typescript
-export type FooNumber = FooBase {
+export type FooNumber = FooBase & {
+  /**
+   * @type string
+   */
+  $type: "type-number";
+
  /**
   * @type number
   */
  value: number;
};
```

## 3.5.13
- [`plugin-oas`](/ru/plugins/plugin-oas): перечисление с пробелами

## 3.5.12
- [`core`](/ru/plugins/core): обновление внутренних пакетов

## 3.5.11
- [`core`](/ru/plugins/core): обновление внутренних пакетов

## 3.5.10
- [`plugin-faker`](/ru/plugins/plugin-faker/): returnType для функций faker

## 3.5.9
- [`plugin-faker`](/ru/plugins/plugin-faker/): returnType для функций faker
- [`plugin-faker`](/ru/plugins/plugin-faker/): использование min/max только когда оба установлены в oas
- [`plugin-client`](/ru/plugins/plugin-client): корректное использование baseURL для клиента fetch
- [`plugin-msw`](/ru/plugins/plugin-msw): поддержка `baseURL` без wildcards

## 3.5.8
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): поддержка пользовательского `contentType` для каждого плагина
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): поддержка пользовательского `contentType` для каждого плагина
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): поддержка пользовательского `contentType` для каждого плагина
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): поддержка пользовательского `contentType` для каждого плагина
- [`plugin-swr`](/ru/plugins/plugin-swr/): поддержка пользовательского `contentType` для каждого плагина
- [`plugin-client`](/ru/plugins/plugin-client): поддержка пользовательского `contentType` для каждого плагина

## 3.5.7
- [`react`](/ru/helpers/react/): Bun не следует той же структуре node_modules, чтобы решить это, нам нужно включить пакет React внутрь `@kubb/react`. Это увеличит размер на 4MB.

## 3.5.6
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): поддержка пользовательского клиента в опциях
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): поддержка пользовательского клиента в опциях
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): поддержка пользовательского клиента в опциях
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): поддержка пользовательского клиента в опциях
- [`plugin-swr`](/ru/plugins/plugin-swr/): поддержка пользовательского клиента в опциях

## 3.5.5
- [`plugin-client`](/ru/plugins/plugin-client): поддержка пользовательского клиента в опциях
- [`plugin-faker`](/ru/plugins/plugin-zod): `faker.number.string` с min по умолчанию `Number.MIN_VALUE` и max установлен в `Number.MAX_VALUE`

## 3.5.4
- [`plugin-zod`](/ru/plugins/plugin-zod): поддержка uniqueItems в Zod

## 3.5.3
- [`plugin-client`](/ru/plugins/plugin-client): разрешение экспорта пользовательской функции fetch клиента и использование сгенерированного fetch, когда доступен `pluginClient`
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): разрешение экспорта пользовательской функции fetch клиента и использование сгенерированного fetch, когда доступен `pluginClient`
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): разрешение экспорта пользовательской функции fetch клиента и использование сгенерированного fetch, когда доступен `pluginClient`
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): разрешение экспорта пользовательской функции fetch клиента и использование сгенерированного fetch, когда доступен `pluginClient`
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): разрешение экспорта пользовательской функции fetch клиента и использование сгенерированного fetch, когда доступен `pluginClient`
- [`plugin-swr`](/ru/plugins/plugin-swr/): разрешение экспорта пользовательской функции fetch клиента и использование сгенерированного fetch, когда доступен `pluginClient`


## 3.5.2
- [`plugin-faker`](/ru/plugins/plugin-faker): `faker.number.float` с min по умолчанию `Number.MIN_VALUE` и max установлен в `Number.MAX_VALUE`.
- [`plugin-oas`](/ru/plugins/plugin-oas): удаление дублированных ключей при использовании `allOf` и применении required к полям

## 3.5.1
- [`core`](/ru/plugins/core): сборка `@kubb/core` с корректными типами
- [`plugin-oas`](/ru/plugins/plugin-oas): разрешение `grouping`

## 3.5.0
- [`core`](/ru/plugins/core): поддержка баннера с контекстом для Oas
```typescript
pluginTs({
  output: {
    path: 'models',
    banner(oas) {
      return `// version: ${oas.api.info.version}`
    },
  },
}),
```

## 3.4.6
- [`core`](/ru/plugins/core): игнорирование акронимов при переключении регистра на pascal или camelcase

## 3.4.5
- [`plugin-client`](/ru/plugins/plugin-client): если клиент не получает тело (no content), то возникает ошибка парсинга JSON
- [`plugin-zod`](/ru/plugins/plugin-zod): использование `as ToZod` вместо `satisfies ToZod`

## 3.4.4
- [`plugin-client`](/ru/plugins/plugin-client): url в текстовом формате вместо использования URL

## 3.4.3
- [`plugin-oas`](/ru/plugins/plugin-oas): корректное использование группировки для path и tags

## 3.4.2
- [`plugin-oas`](/ru/plugins/plugin-oas): удаление дублированных ключей, когда установлены в required

## 3.4.1
- [`plugin-faker`](/ru/plugins/plugin-faker): min и max не применялись к функциям faker

## 3.4.0
- [`plugin-client`](/ru/plugins/plugin-client): разделение URI (с параметрами) от запроса
- [`plugin-client`](/ru/plugins/plugin-client): добавление заголовка в объект ответа
- [`plugin-client`](/ru/plugins/plugin-client): использование URL и SearchParams для поддержки queryParams для fetch

## 3.3.5
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): queryOptions с пользовательским типом Error
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): queryOptions с пользовательским типом Error
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): queryOptions с пользовательским типом Error
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): queryOptions с пользовательским типом Error
- [`react`](/ru/helpers/react/): importPath без расширений


## 3.3.4
- [`plugin-ts`](/ru/plugins/plugin-ts): minLength, maxLength, pattern как часть jsdocs
- [`plugin-client`](/ru/plugins/plugin-client): baseURL может быть undefined, не бросать ошибку в этом случае

## 3.3.3
- [`react`](/ru/helpers/react/): использование `@kubb/react` в качестве importSource для jsx(React 17, React 18, React 19 могут использоваться вместе с Kubb)
- [`cli`](/ru/helpers/cli/): использование `@kubb/react` в качестве importSource для jsx(React 17, React 18, React 19 могут использоваться вместе с Kubb)

## 3.3.2
- [`react`](/ru/helpers/react/): поддержка `div` и других базовых элементов для возврата из `@kubb/react`

## 3.3.1
- [`plugin-zod`](/ru/plugins/plugin-zod): использование утилиты `tozod` для создания схемы на основе типа

## 3.3.0
- [`plugin-client`](/ru/plugins/plugin-client): `client` для использования `fetch` или `axios` в качестве HTTP-клиента
- [`plugin-zod`](/ru/plugins/plugin-zod): использование литерала регулярного выражения вместо конструктора RegExp
- [`plugin-ts`](/ru/plugins/plugin-ts): переключение между использованием type или interface при создании типов

## 3.2.0
- [`plugin-msw`](/ru/plugins/plugin-msw): `paramsCasing` для определения регистра параметров
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): `paramsCasing` для определения регистра параметров
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): `paramsCasing` для определения регистра параметров
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): `paramsCasing` для определения регистра параметров
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): `paramsCasing` для определения регистра параметров
- [`plugin-client`](/ru/plugins/plugin-client): `paramsCasing` для определения регистра параметров

## 3.1.0
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): группировка API клиентов по структуре пути
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): группировка API клиентов по структуре пути
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): группировка API клиентов по структуре пути
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): группировка API клиентов по структуре пути
- [`plugin-msw`](/ru/plugins/plugin-msw): группировка API клиентов по структуре пути
```typescript
group: {
  type: 'path',
  name: ({ group }) => {
    const firstSegment = group.split('/')[1];
    return firstSegment;
  }
}
```
```typescript
findPetsByStatusHandler((info) => {
  const { params } = info
  if (params.someKey) {
    return new Response(
      JSON.stringify({ error: 'some error response' }),
      { status: 400 }
    );
  }
  return new Response(
    JSON.stringify({ newData: 'new data' }),
    { status: 200 }
  );
})

```

## 3.0.14
- [`core`](/ru/plugins/core): обновление пакетов

## 3.0.13
- [`core`](/ru/plugins/core): обновление пакетов
- [`plugin-oas`](/ru/plugins/plugin-oas): применение required к полям, унаследованным с помощью allOf

## 3.0.12
- [`plugin-zod`](/ru/plugins/plugin-zod): 2xx как часть `operations.ts`

## 3.0.11
- [`core`](/ru/plugins/core): отключение расширения выходного файла
- [`plugin-oas`](/ru/plugins/plugin-oas): корректное использование синтаксиса Jsdocs для ссылок
- [`core`](/ru/plugins/core): соблюдение регистра параметров

## 3.0.10
- [`plugin-faker`](/ru/plugins/plugin-faker): `data` должен иметь более высокий приоритет, чем генерация faker по умолчанию

## 3.0.9
- [`plugin-oas`](/ru/plugins/plugin-oas): разрешение nullable с опцией default null
- [`core`](/ru/plugins/core): корректное использование `barrelType` для отдельных файлов

## 3.0.8
- [`plugin-zod`](/ru/plugins/plugin-zod): Blob как `z.instanceof(File)` вместо `string`

## 3.0.7
- [`core`](/ru/plugins/core): включение экспорта отдельных файлов в основной файл index.ts.

## 3.0.6
- [`plugin-oas`](/ru/plugins/plugin-oas/): корректное использование переменных, когда путь/параметры содержат _ или -
- [`core`](/ru/plugins/core): `barrelType: 'propagate'` для того, чтобы ядро могло генерировать barrel файлы, даже если плагин не будет иметь barrel файлов

## 3.0.5
- [`react`](/ru/helpers/react//): улучшенное логирование ошибок + более широкий диапазон для peerDependency `@kubb/react`

## 3.0.4
- обновление внешних зависимостей

## 3.0.3
- [`plugin-ts`](/ru/plugins/plugin-ts/): тег jsdoc `@deprecated` для схем

## 3.0.2
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): удаление требования [`plugin-client`](/ru/plugins/plugin-client)
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): удаление требования [`plugin-client`](/ru/plugins/plugin-client)
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): удаление требования [`plugin-client`](/ru/plugins/plugin-client)
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): удаление требования [`plugin-client`](/ru/plugins/plugin-client)

## 3.0.1
- [`plugin-faker`](/ru/plugins/plugin-faker): корректные функции faker для uuid, pattern и email
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): разрешение отключения `useQuery`
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): использование TypeScript помощника `InfiniteData` для infiniteQueries
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): использование TypeScript помощника `InfiniteData` для infiniteQueries

## 3.0.0-beta.12
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): разрешение отключения генерации useQuery или createQuery hooks.
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): разрешение отключения генерации useQuery или createQuery hooks.
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): разрешение отключения генерации useQuery или createQuery hooks.
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): разрешение отключения генерации useQuery или createQuery hooks.
- [`plugin-swr`](/ru/plugins/plugin-swr/): разрешение отключения генерации useQuery или createQuery hooks.

## 3.0.0-beta.11
- [`plugin-ts`](/ru/plugins/plugin-ts): enumType `'enum'` без export type в barrel файлах
- [`plugin-client`](/ru/plugins/plugin-client): разрешение установки пользовательского базового url для всех сгенерированных вызовов

## 3.0.0-beta.10
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): `paramsType` с опциями `'inline'` и `'object'` для контроля количества параметров при вызове одной из сгенерированных функций.
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): `paramsType` с опциями `'inline'` и `'object'` для контроля количества параметров при вызове одной из сгенерированных функций.
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): `paramsType` с опциями `'inline'` и `'object'` для контроля количества параметров при вызове одной из сгенерированных функций.
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): `paramsType` с опциями `'inline'` и `'object'` для контроля количества параметров при вызове одной из сгенерированных функций.
- [`plugin-client`](/ru/plugins/plugin-client/): `paramsType` с опциями `'inline'` и `'object'` для контроля количества параметров при вызове одной из сгенерированных функций.

## 3.0.0-beta.9
- [`plugin-msw`](/ru/plugins/plugin-msw): опция `parser` для отключения генерации faker
  - `'faker'` будет использовать `@kubb/plugin-faker` для генерации данных для ответа
  - `'data'` будет использовать ваши пользовательские данные для генерации данных для ответа
- [`plugin-msw`](/ru/plugins/plugin-msw): Siblings для лучшей манипуляции AST

## 3.0.0-beta.8
- [`plugin-zod`](/ru/plugins/plugin-zod): Siblings для лучшей манипуляции AST

## 3.0.0-beta.7
- обновление внешних пакетов

## 3.0.0-beta.6
- [`plugin-faker`](/ru/plugins/plugin-faker): Min/Max для типа array для генерации лучшей функциональности `faker.helpers.arrayElements`

## 3.0.0-beta.5
- [`plugin-zod`](/ru/plugins/plugin-zod): отказ от `optional()`, если есть `default()`, чтобы гарантировать, что тип вывода не `T | undefined`

## 3.0.0-beta.4
- обновление внешних пакетов

## 3.0.0-beta.3
- [`plugin-zod`](/ru/plugins/plugin-zod/): добавлено приведение только для определенных типов
```typescript
type coercion=  boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
```

## 3.0.0-beta.2
- обновление внешних пакетов

## 3.0.0-beta.1
- обновление внешних пакетов

## 3.0.0-alpha.31
- [`plugin-client`](/ru/plugins/plugin-client/): генерация файла контроллера `${tag}Service`, связанного с группой x при использовании `group`(не нужно указывать `group.exportAs`)
- [`plugin-core`](/ru/plugins/core/): удаление `group.exportAs`
- [`plugin-core`](/ru/plugins/core/): удаление `group.output` в пользу `group.name`(не нужно указывать output/root)
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
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginClient({
      output: {
        path: './clients/axios',
      },
      // group: { type: 'tag', output: './clients/axios/{{tag}}Service' }, // [!code --]
      group: { type: 'tag', name: ({ group }) => `${group}Service` }, // [!code ++]
    }),
  ],
})
```

## 3.0.0-alpha.30
- [`plugin-core`](/ru/plugins/core/): удаление `output.extName` в пользу `output.extension`
- [`plugin-core`](/ru/plugins/core/): удаление `exportType` в пользу `barrelType`


## 3.0.0-alpha.29
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): поддержка отмены запросов с помощью `signal`
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): поддержка отмены запросов с помощью `signal`
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): поддержка отмены запросов с помощью `signal`
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): поддержка отмены запросов с помощью `signal`
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): использование `enabled` на основе необязательных параметров
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): использование `enabled` на основе необязательных параметров
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): использование `enabled` на основе необязательных параметров
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): использование `enabled` на основе необязательных параметров

## 3.0.0-alpha.28
- [`plugin-zod`](/ru/plugins/plugin-zod/): соблюдение порядка `z.tuple`

## 3.0.0-alpha.27
- [`plugin-swr`](/ru/plugins/plugin-swr/): поддержка режима TypeScript `strict`
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): поддержка режима TypeScript `strict` и использование объекта data для `mutationFn: async(data: {})`
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): поддержка режима TypeScript `strict` и использование объекта data для `mutationFn: async(data: {})`
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): поддержка режима TypeScript `strict` и использование объекта data для `mutationFn: async(data: {})`
- [`plugin-solid-query`](/ru/plugins/plugin-solid-query/): поддержка режима TypeScript `strict` и использование объекта data для `mutationFn: async(data: {})`


## 3.0.0-alpha.26
- [`plugin-swr`](/ru/plugins/plugin-swr/): экспорт queryKey и mutationKey для плагина SWR
- опция 'generators' для всех плагинов

## 3.0.0-alpha.25
- [`plugin-react-query`](/ru/plugins/plugin-react-query/): использование MutationKeys для `useMutation`
- [`plugin-svelte-query`](/ru/plugins/plugin-svelte-query/): использование MutationKeys для `createMutation`
- [`plugin-vue-query`](/ru/plugins/plugin-vue-query/): использование MutationKeys для `useMutation`


## 3.0.0-alpha.24
- [`plugin-oas`](/ru/plugins/plugin-oas/): поддержка [discriminator](https://swagger.io/specification/?sbsearch=discriminator)


## 3.0.0-alpha.23
- [`plugin-client`](/ru/plugins/plugin-client/): использование верхнего регистра для httpMethods, `GET` вместо `get`, `POST` вместо `post`, ...

## 3.0.0-alpha.22
- [`plugin-faker`](/ru/plugins/plugin-faker/): использование `faker.image.url()` вместо `faker.image.imageUrl()`
- [`plugin-zod`](/ru/plugins/plugin-zod/): перечисления должны использовать `z.literal`, когда формат установлен в number, string или boolean

::: code-group

```yaml [input]
enum:
  type: boolean
  enum:
    - true
    - false
```
```typescript [output]
z.enum(["true", "false"]) // [!code --]
z.union([z.literal(true), z.literal(false)]) // [!code ++]
```
:::
- [`plugin-ts`](/ru/plugins/plugin-ts/): использование `readonly` для ссылок($ref)
- [`plugin-client`](/ru/plugins/plugin-client/): использование типа `Error`, когда для операции не установлены ошибки


## 3.0.0-alpha.21
- [`plugin-zod`](/ru/plugins/plugin-zod/): использование `x-nullable` и `nullable` для additionalProperties.

## 3.0.0-alpha.20

- отдельный плагин/пакет для Solid-Query: `@kubb/plugin-solid-query`

```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core"
import { pluginOas } from "@kubb/plugin-oas"
import { pluginTs } from "@kubb/plugin-ts"
import { pluginSolidQuery } from '@kubb/plugin-solid-query' // [!code ++]
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'  // [!code --]

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginSolidQuery({
      output: {
        path: './hooks',
      },
    })
  ],
})

```

- отдельный плагин/пакет для Svelte-Query: `@kubb/plugin-svelte-query`

```typescript [kubb.config.ts]
import {defineConfig} from "@kubb/core"
import {pluginOas} from "@kubb/plugin-oas"
import {pluginTs} from "@kubb/plugin-ts"
import { pluginSvelteQuery } from '@kubb/plugin-svelte-query' // [!code ++]
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'  // [!code --]

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginSvelteQuery({
      output: {
        path: './hooks',
      },
    })
  ],
})

```


- отдельный плагин/пакет для Vue-Query:  `@kubb/plugin-vue-query`

```typescript [kubb.config.ts]
import {defineConfig} from "@kubb/core"
import {pluginOas} from "@kubb/plugin-oas"
import {pluginTs} from "@kubb/plugin-ts"
import { pluginVueQuery } from '@kubb/plugin-vue-query' // [!code ++]
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'  // [!code --]

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginVueQuery({
      output: {
        path: './hooks',
      },
    })
  ],
})

```

## 3.0.0-alpha.16

- отдельный плагин/пакет для React-Query: `@kubb/plugin-react-query`

```typescript [kubb.config.ts]
import {defineConfig} from "@kubb/core"
import {pluginOas} from "@kubb/plugin-oas"
import {pluginTs} from "@kubb/plugin-ts"
import { pluginReactQuery } from '@kubb/plugin-react-query' // [!code ++]
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'  // [!code --]

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginReactQuery({
      output: {
        path: './hooks',
      },
    })
  ],
})

```
