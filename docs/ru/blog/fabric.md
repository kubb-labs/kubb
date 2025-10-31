---
layout: doc

title: Представляем Fabric — гибкий способ создания и формирования файлов
outline: deep
date: 2025-11-01
summary: Fabric — это языково-независимый инструментарий для генерации кода и файлов с использованием JSX и TypeScript.
---

Опубликовано: 2025-11-01

# Представляем Fabric

Fabric — это новая библиотека из экосистемы `Kubb`, которая фокусируется на простом создании файлов.

В то время как `Kubb` популяризировал идею "генерации кода как рабочего процесса", `Fabric` фокусируется на том, чтобы сделать создание файлов максимально простым:
- ядро Fabric организует генерацию файлов, объединяя несколько файлов в один, управляя файлами (с очередью), интеллектуально объединяя или удаляя дубликаты импортов и экспортов;
- расширяемость через пользовательские плагины и парсеры, со встроенной поддержкой `TypeScript`, `JavaScript` и `JSX/TSX`;
- преобразование и запись файлов в файловую систему с помощью `fsPlugin`;
- использование `React` для определения файлов через JSX компоненты, предлагая декларативный и композируемый подход к генерации файлов.
```tsx
<File path={'/gen/name.ts'} baseName={'name.ts'}>
  <File.Source>
    <Const export name={'name'}>"fabric"</Const>
  </File.Source>
</File>
```

### Основные концепции

В основе `Fabric` лежат несколько простых идей.

- экземпляр `Fabric` содержит контекст: файлы, которые вы добавляете, плагины и парсеры, которые вы устанавливаете. Плагины могут подключаться к событиям жизненного цикла, таким как `write:start`, для анализа или создания дополнительных файлов;
- Fabric намеренно минималистичен, с плагинами для расширения функциональности Fabric. Например:
  - `fsPlugin` записывает файлы на диск;
  - `barrelPlugin` может создавать индексные бочки (`.index.ts`);
  - `graphPlugin` создает `graph.json` + `graph.html`, чтобы вы могли визуализировать связи между файлами;
  - интеграция с React (`react-fabric`) для простого создания файлов с помощью JSX компонентов.

### Быстрый старт

Установить Fabric

::: code-group
```shell [bun]
bun add -d @kubb/fabric-core
```

```shell [pnpm]
pnpm add -D @kubb/fabric-core
```

```shell [npm]
npm install --save-dev @kubb/fabric-core
```

```shell [yarn]
yarn add -D @kubb/fabric-core
```
:::

Создать простой скрипт, который генерирует несколько файлов:
::: code-group
```ts [build.ts]
import path from "node:path"
import process from "node:process"

import { createFabric, createFile } from '@kubb/fabric-core'
import { fsPlugin } from '@kubb/fabric-core/plugins'

async function main() {
  const fabric = createFabric()

  // Установить плагин записи в файловую систему
  fabric.use(fsPlugin)

  // Создать файл с одним или несколькими источниками
  const readme = createFile({
    baseName: 'README.md',
    path: path.join(process.cwd(), 'dist/README.md'),
    sources: [
      { name: 'intro', value: '# Hello from Fabric' },
      { name: 'usage', value: 'Generated with Fabric.' },
    ],
  })

  // добавить файл в очередь FileManager
  await fabric.addFile(readme)

  // Запустить процесс записи
  await fabric.write()
}

main()
```
```markdown [dist/README.md]
# Hello from Fabric

Generated with Fabric.
```
:::
Запустите его, и вы найдете сгенерированный `dist/README.md`.

### Практическое руководство: составление файлов как Lego

Давайте рассмотрим более полный пример, который показывает, как ядро Fabric и плагины работают вместе.

Мы сгенерируем:
- папку с генерируемыми файлами (`gen/`) с утилитой запроса и типизированным API-файлом;
- необязательный barrel-файл для экспорта публичных API;
- граф файлов, который можно открыть в браузере для визуализации вывода.

::: code-group
```ts [build.ts]
import path from 'node:path'
import process from 'node:process'

import { createFabric, createFile } from '@kubb/fabric-core'
import { barrelPlugin, graphPlugin, fsPlugin } from '@kubb/fabric-core/plugins'
import { typescriptParser } from '@kubb/fabric-core/parsers'

async function build() {
  const root = path.join(process.cwd())
  const outDir = path.join(root, 'gen')
  const fabric = createFabric()

  // использовать TypeScript
  fabric.use(typescriptParser)

  // Записать на диск
  fabric.use(fsPlugin)

  // Опционально: генерировать индексный barrel при записи файлов
  fabric.use(barrelPlugin, { root, mode: 'named' })

  // Опционально: генерировать граф файлов и открыть его в браузере
  fabric.use(graphPlugin, { root, open: false })

  const requestFile = createFile({
    baseName: 'request.ts',
    path: path.join(outDir, 'request.ts'),
    sources: [
      {
        name: 'request',
        value: `export async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) throw new Error('Request failed')
  return res.json() as Promise<T>
}
`,
        isExportable: true,
        isIndexable: true,
      },
    ],
  })

  const apiFile = createFile({
    baseName: 'api.ts',
    path: path.join(outDir, 'api.ts'),
    imports: [
      {
        name: ['request'],
        path: './request',
      }
    ],
    sources: [
      {
        name: 'getTodos',
        value: `export type Todo = { id: number; title: string; completed: boolean }

export async function getTodos() {
  return request<Todo[]>('/api/todos')
}
`,
        isExportable: true,
        isIndexable: true,
      },
    ],
  })

  await fabric.addFile(requestFile, apiFile)

  await fabric.write()
}

build()
```
```ts [gen/index.ts]
export { request } from "./request.ts"
export { getTodos } from "./api.ts"
```
```ts [gen/request.ts]
export async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) throw new Error('Request failed')
  return res.json() as Promise<T>
}
```

```ts [gen/api.ts]
import { request } from './request'

export type Todo = { id: number; title: string; completed: boolean }

export async function getTodos() {
  return request<Todo[]>('/api/todos')
}
```
:::

Когда запускается жизненный цикл `write`, каждый плагин получает возможность:
- проверить файлы;
- создать дополнительные файлы (например, `graph.json` / `graph.html`);
- преобразовать или агрегировать содержимое;
- наконец, сохранить на диск через `fsPlugin`.

`graphPlugin` может создать страницу `graph.html` рядом с вашим выводом. Откройте её, чтобы визуализировать связи файлов, что отлично подходит для отладки больших скриптов генерации.

### Интеграция с React: react‑fabric

Fabric также содержит пакет `react-fabric`, позволяющий использовать JSX компоненты и синтаксис для создания файлов.
- вспомогательный метод `createReactFabric` для замены создателя `createFabric`;
- `reactPlugin`, который добавит `fabric.render` и `fabric.renderToString`.

Вот небольшой пример, использующий компоненты React для создания файлов.

::: code-group

```tsx [build.tsx]
import path from 'node:path'
import process from 'node:process'

import { fsPlugin } from '@kubb/react-fabric/plugins'
import { createReactFabric, File, Const } from '@kubb/react-fabric'
import { typescriptParser } from "@kubb/react-fabric/parsers"

async function build() {
  const root = path.join(process.cwd())
  const outDir = path.join(root, 'gen')

  const fabric = createReactFabric()

  // использовать TypeScript
  fabric.use(typescriptParser)
  // Записать на диск
  fabric.use(fsPlugin)

  // Рендерить React шаблоны в строки и обернуть как файлы
  const component = () => {
    return (
      <File path={path.resolve(outDir, 'name.ts')} baseName={'name.ts'}>
        <File.Source>
          <Const export asConst name={'name'}>
            "fabric"
          </Const>
        </File.Source>
      </File>
    )
  }

  fabric.render(component)

  await fabric.write()
}

build()
```

```ts [gen/name.ts]
export const name = 'fabric' as const
```
:::

Несколько приятных особенностей этого подхода:
- вы можете повторно использовать компоненты React как шаблоны кода без пользовательского языка шаблонов;
- легко читаемый код с множеством готовых компонентов, таких как `<File/>`, `<Const/>`, `<Type/>` и другие;
- вы по-прежнему получаете тот же жизненный цикл Fabric и плагины.


### Почему Fabric?
- простота использования: Fabric организует создание файлов и автоматически ставит задачи в очередь при необходимости;
- осведомленность о среде выполнения: Fabric автоматически использует правильный код среды выполнения для `Bun` или `Node`;
- расширяемость: расширяйте возможности Fabric с помощью плагинов и парсеров для поддержки новых функций или языков;
- независимость от фреймворка: используйте собственный рендерер (например, `React`) или придерживайтесь простого JavaScript с `createFile`.

### Что дальше
Fabric молод, и мы активно собираем отзывы. Если вы попробуете его:
- поделитесь тем, что вы создали, и какие плагины использовали;
- предложите интеграции, которые вы хотели бы увидеть в следующий раз.

### Коротко
- Fabric — это целевая библиотека для создания и организации файлов;
- она использует жизненный цикл плагинов для преобразования и записи вывода;
- интеграция с React (`react-fabric`) позволяет использовать JSX компоненты для создания файлов;
- плагин graph помогает понять сложные выводы с первого взгляда.

Попробуйте, и дайте нам знать, что вы сгенерировали!
