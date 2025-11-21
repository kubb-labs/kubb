---
layout: doc

title: Разработка
outline: deep
---

# Система плагинов

::: warning В разработке
:::

Kubb предоставляет легкую, но мощную систему плагинов для реализации большинства своих функций и позволяет реализовать ваш плагин.

Плагины, написанные разработчиками, могут генерировать код, разрешать пути, разрешать имена и вызывать другие плагины.<br/>

Наша система плагинов основана на следующих пакетах:

- [Rollup](https://github.com/rollup/rollup)
- [Unplugin](https://github.com/unjs/unplugin)
- [Snowpack](https://www.snowpack.dev/guides/plugins)

## Настройка

Плагины предоставляют функцию, похожую на `(options?: PluginOptions) => KubbUserPluginWithLifeCycle` в качестве точки входа.

### Пример плагина

::: code-group

```typescript [plugin.ts]
import path from 'node:path'

import { camelCase } from '@kubb/core/transformers'

import type { PluginOptions } from './types.ts'

export const pluginName = 'kubb-custom-plugin' satisfies PluginOptions['name']
export const pluginKey: PluginOptions['key'] = [pluginName] satisfies PluginOptions['key']

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const {
    name,
  } = options

  return {
    name: pluginName,
    options,
    pre: [],
    resolvePath(baseName, mode, options) {
      const root = path.resolve(this.config.root, this.config.output.path)

      return path.resolve(root, output.path, baseName)
    },
    resolveName(name, type) {
      return camelCase(name)
    },
    async buildStart() {
      // запустить что-то при начале сборки
    },
    async writeFile(source, writePath) {
      if (!writePath.endsWith('.ts') || !source) {
        return
      }

      return this.fileManager.write(source, writePath, { sanity: false })
    },
    async buildEnd() {
      // запустить что-то при завершении сборки
    },
  }
})
```

```typescript [types.ts]
export type Options = {
  name: string
}

export type PluginOptions = PluginFactoryOptions<'kubb-custom-plugin', Options, Options>

// зарегистрируйте ваш плагин в системе typescript `@kubb/core`
declare module '@kubb/core' {
  export interface _Register {
    ['kubb-custom-plugin']: PluginOptions
  }
}
```

```typescript [index.ts]
import { definePlugin } from './plugin.ts'

export { definePlugin, pluginKey, pluginName } from './plugin.ts'
export * from './types.ts'
```

:::

Регистрация плагина:

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { definePlugin } from './index.ts'

export default defineConfig(() => {
  return {
    plugins: [
      definePlugin({ name: 'custom-name' }),
    ],
  }
})
```

### Соглашение об именовании

Соглашение об именовании для плагинов следующее:

- имя плагина следует формату `@kubb/plugin-name` или `kubb-plugin-name`
- используйте `PluginFactoryOptions` для создания ваших pluginOptions, которые будут использоваться для создания автозаполнения и валидации TypeScript

Упрощенный тип `PluginFactoryOptions`:

```typescript
export type PluginFactoryOptions<Name, Options, ResolveOptions, API, ResolvePathOptions, AppMeta>
```

### Шаблонный репозиторий

[`plugin-template`](https://github.com/kubb-labs/plugin-template) - это минимальный шаблонный репозиторий плагина Kubb, который вы можете использовать в качестве основы для разработки вашего плагина Kubb.

## Настройка

Чтобы начать создавать плагины, вам нужно установить некоторые опции для `PluginManager`. <br>
Больше информации о жизненном цикле: [PluginManager Lifecycle](/ru/knowledge-base/pluginManager/lifecycle)<br/>
Больше информации о `PluginContext` или `this`: [Plugin Core](/ru/knowledge-base/plugins/core)

> [!TIP]
> При использовании типа PluginOptions с `PluginFactoryOptions` вы уже получите лучшие типы, name будет тем, что вы определили как первый параметр для `PluginFactoryOptions` вместо string.


- **Тип:** `KubbUserPluginWithLifeCycle` <br/>

### name

Имя вашего плагина

- **Тип:** `string` <br/>

### options

Укажите здесь некоторые опции, которые вы хотите предоставить для других плагинов или для внутреннего использования.

- **Тип:** `object` <br/>

### pre

Какой плагин(ы) должны быть выполнены перед текущим.

- **Тип:** `string[]` <br/>

### post

Какой плагин(ы) должны быть выполнены после текущего.

- **Тип:** `string[]` <br/>

### api

Добавьте дополнительную функциональность в ваш плагин, здесь вы даже можете использовать функции, что невозможно с `options`.

- **Тип:** `(this: Omit<PluginContext, "addFile">) => object` <br/>

### resolvePath

Будет вызвано, когда вызывается pluginManager.resolvePath, см. [Pluginmanager и разрешение пути](/ru/knowledge-base/pluginManager/#pluginmanager-resolvepath).

- **Тип:** `(this: PluginContext, baseName: string, mode?: 'file' | 'directory', options?: object) => KubbFile.OptionalPath` <br/>

### resolveName

Будет вызвано, когда вызывается pluginManager.resolveName, см. [Pluginmanager и разрешение имени](/ru/knowledge-base/pluginManager/#pluginmanager-resolvename).

- **Тип:** `(this: PluginContext, name: string, type?: "function" | "type" | "file" | undefined) => string)` <br/>

### buildStart

Будет вызвано, когда начинается сборка, см. [Lifecycle](/ru/knowledge-base/plugins/system#lifecycle).

- **Тип:** `(this: PluginContext, kubbConfig: KubbConfig) => PossiblePromise<void>` <br/>

### buildEnd

Будет вызвано, когда сборка завершена, см. [Lifecycle](/ru/knowledge-base/plugins/system#lifecycle).

- **Тип:** `(this: PluginContext) => PossiblePromise<void>` <br/>

### writeFile

Будет вызвано, когда новый файл готов к записи в файловую систему, см. [Lifecycle](/ru/knowledge-base/plugins/system#lifecycle).

- **Тип:** `(this: Omit<PluginContext, "addFile">, source: string | undefined, path: string) => PossiblePromise<string | void>` <br/>

### transform

Будет вызвано непосредственно перед вызовом writeFile, см. [Lifecycle](/ru/knowledge-base/plugins/system#lifecycle). Здесь вы можете переопределить источник/содержимое файла.

- **Тип:** `(this: Omit<PluginContext, "addFile">, source: string, path: string) => PossiblePromise<TransformResult>` <br/>

## Жизненный цикл

В момент вызова `build` из `@kubb/core` или запуска CLI произойдет следующее:

1. Чтение входных данных, определенных в `input.path`, и проверка существования этого файла или использование `input.data`.
2. Если установлен `output.clean`, удаление всех файлов в `output.path`.
3. Создание нового экземпляра `PluginManager`.
4. Экземпляр `PluginManager` вызовет `buildStart` всех плагинов параллельно.
   1. Плагин A использует `buildStart` для добавления файлов в `FileManager`.
   ```typescript
   async buildStart() {
     // создание файла `test.ts` с источником `export const hello = 'world'`
     await this.addFile({
       path: './src/gen/test.ts',
       baseName: 'test.ts',
       source: "export const hello = 'world'",
       imports: [],
       meta: {
         pluginKey: this.plugin.key,
       },
     })
   }
   ```
   2. Запуск `queueTask`.
5. Экземпляр `PluginManager` вызовет `buildEnd` всех плагинов параллельно.
6. Возврат всех сгенерированных файлов.

<hr/>

#### Task

`queueTask` запускается, когда новый файл добавляется в `FileManager`.

1. Обработка файла для получения сгенерированного кода с импортами, экспортами и источником, выполняемая `FileManager.getSource(file)`.
2. Экземпляр `PluginManager` вызовет `transform` всех плагинов и объединит возвращенную строку с помощью `transformReducer`.
3. Экземпляр `PluginManager` вызовет `writeFile` всех плагинов, когда `output.write` установлен в true (по умолчанию), и первый, кто **НЕ** вернет null, будет использован как возвращаемый `KubbFile.File`.
