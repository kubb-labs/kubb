---
layout: doc

title: Development
outline: deep
---

# Plugin core

::: warning Under construction
:::

This section describes the core plugin types and APIs.

## Context/this

When calling `this.` in a plugin, the `api` of the core plugin will be used.
::: details plugin.ts
<<< @/../packages/core/src/plugin.ts
:::

### this.config

For the current config, see `kubb.config.ts`.

- **Type:** `KubbConfig` <br/>

### this.plugins

Return all the plugins that are being used.

- **Type:** `Array<KubbPlugin>` <br/>

### this.plugin

The current plugin.

- **Type:** `KubbPlugin` <br/>

### this.logger

Instance of the Logger.

- **Type:** `Logger` <br/>

### this.fileManager

Instance of the fileManager.

- **Type:** `FileManager` <br/>

### this.pluginManager

Instance of the pluginManager.

- **Type:** `PluginManager` <br/>

### this.addFile

Add a file to the current fileManager.

- **Type:** `(...files: Array<KubbFile.File>): Promise<Array<KubbFile.File>>` <br/>

### this.resolvePath

This will be called pluginManager.resolvePath, see [Pluginmanager and resolving a path](/reference/pluginManager/#pluginmanager-resolvepath).

- **Type:** `(params: ResolvePathParams) => KubbFile.OptionalPath` <br/>

### this.resolveName

This will be called pluginManager.resolveName, see [Pluginmanager and resolving a name](/reference/pluginManager/#pluginmanager-resolvename).

- **Type:** `(params: ResolveNameParams) => string` <br/>

### this.cache

Store something in the cache, this cache can be used in every plugin.

- **Type:** `Cache<PluginCache>` <br/>
