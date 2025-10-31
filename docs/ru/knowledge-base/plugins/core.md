---
layout: doc

title: Разработка
outline: deep
---

# Основной плагин

::: warning В разработке
:::

Этот раздел описывает основные типы и API плагинов.

## Context/this

При вызове `this.` в плагине будет использоваться `api` основного плагина.
::: details plugin.ts
<<< @/../packages/core/src/plugin.ts
:::

### this.config

Для текущей конфигурации см. `kubb.config.ts`.

- **Тип:** `KubbConfig` <br/>

### this.plugins

Вернуть все плагины, которые используются.

- **Тип:** `Array<KubbPlugin>` <br/>

### this.plugin

Текущий плагин.

- **Тип:** `KubbPlugin` <br/>

### this.logger

Экземпляр Logger.

- **Тип:** `Logger` <br/>

### this.fileManager

Экземпляр fileManager.

- **Тип:** `FileManager` <br/>

### this.pluginManager

Экземпляр pluginManager.

- **Тип:** `PluginManager` <br/>

### this.addFile

Добавить файл в текущий fileManager.

- **Тип:** `(...files: Array<KubbFile.File>): Promise<Array<KubbFile.File>>` <br/>

### this.resolvePath

Будет вызвано pluginManager.resolvePath, см. [Pluginmanager и разрешение пути](/ru/knowledge-base/pluginManager/#pluginmanager-resolvepath).

- **Тип:** `(params: ResolvePathParams) => KubbFile.OptionalPath` <br/>

### this.resolveName

Будет вызвано pluginManager.resolveName, см. [Pluginmanager и разрешение имени](/ru/knowledge-base/pluginManager/#pluginmanager-resolvename).

- **Тип:** `(params: ResolveNameParams) => string` <br/>

### this.cache

Сохранить что-то в кеше, этот кеш может использоваться в каждом плагине.

- **Тип:** `Cache<PluginCache>` <br/>
