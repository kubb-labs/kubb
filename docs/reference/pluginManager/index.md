---
layout: doc

title: PluginManager
outline: deep
---

# PluginManager <Badge type="info" text="@kubb/core" />

The `PluginManager` instance contains the building blocks in executing plugins(in a specific order). This contains a queue system, the `FileManager`, `resolvePath` that will be used to retreive a path needed for plugin x and also `resolveName` to retreive a name that can be used for a function/file/type.

::: tip
Here we also create the core plugin with the link(see `this.`) to the `PluginManager`.
:::

### pluginManager.plugins

Array of plugins with the [lifecycle](/reference/pluginManager/lifecycle) hooks included. This also adds the core plugin. Behind the scene we also convert the api prop from a function to an object.

- **Type:** `KubbPluginWithLifeCycle` <br/>

### pluginManager.fileManager

Instance of the [FileManager](/reference/filemManager).

- **Type:** `FileManager` <br/>

### pluginManager.events

The `PluginManager` is triggering some events when a plugin will be exectued(`execute`), when a plugin has been executed (`executed`) and when something goes wrong (`error`).

```typescript [Events]
type Events = {
  execute: [executer: Executer]
  executed: [executer: Executer]
  error: [error: Error]
}
```

- **Type:** `Events` <br/>

### pluginManager.queue

Instance of the queue.

- **Type:** `Queue` <br/>

### pluginManager.config

The config that has been set in `kubb.config.ts`.

- **Type:** `KubbConfig` <br/>

### pluginManager.executed

Array of all executed plugins.

- **Type:** `Array<Executer>` <br/>

### pluginManager.logger

Instance of the logger.

- **Type:** `Logger` <br/>

### pluginManager.resolvePath

Every plugin can set `resolvePath` and when you then call `pluginManager.resolvePath` it will try to find the first resolvePath(based on the plugins array) and use that return value as the path. <br/>

It is also possible to set `pluginKey` as an option. If that's the case it will try to find the plugin with that `pluginKey` and use the return value of that specific plugin as the path.

- **Type:** `(params: ResolvePathParams): KubbFile.OptionalPath` <br/>

### pluginManager.resolveName

Every plugin can set `resolveName` and when you then call `pluginManager.resolveName` it will try to find the first resolveName(based on the plugins array) and use that return value as the name(function, file or type). <br/>

It is also possible to set `pluginKey` as an option. If that's the case it will try to find the plugin with that `pluginKey` and use the return value of that specific plugin as the name.

- **Type:** `(params: ResolveNameParams): string` <br/>

### pluginManager.on

Instead of calling `pluginManager.events.on` you can use `pluginManager.on`. This one also has better types.

- **Type:** `(eventName: keyof Events, handler: (...eventArg: any) => void` <br/>

### pluginManager.hookForPlugin

Run a specific hookName for plugin x.

### pluginManager.hookForPluginSync

Run a specific hookName for plugin x.

### pluginManager.hookFirst

First non-null result stops and will return it's value.

### pluginManager.hookFirstSync

First non-null result stops and will return it's value.

### pluginManager.hookParallel

Run all plugins in parallel(order will be based on `this.plugin` and if `pre` or `post` is set).

### pluginManager.hookReduceArg0

Chain all plugins, `reduce` can be passed through to handle every returned value. The return value of the first plugin will be used as the first parameter for the plugin after that.

### pluginManager.hookParallel

Run all plugins in sequential(order will be based on `this.plugin` and if `pre` or `post` is set).
