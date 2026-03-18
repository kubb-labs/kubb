---
layout: doc

title: Kubb Plugin Manager - Plugin System Guide
description: Understand Kubb's plugin system. Create custom plugins, plugin lifecycle, and plugin dependencies.
outline: deep
---

# PluginDriver <Badge type="info" text="@kubb/core" />

The `PluginDriver` instance contains the building blocks for executing plugins in a specific order. The instance includes a queue system, the `FileManager`, `resolvePath` to retrieve a path needed for plugin x, and `resolveName` to retrieve a name that can be used for a function, file, or type.

> [!TIP]
> Here we also create the core plugin with the link(see `this.`) to the `PluginDriver`.

### pluginDriver.plugins

An array of plugins with the lifecycle hooks included. This also adds the core plugin. Behind the scenes, the API prop is converted from a function to an object.

- **Type:** `KubbPluginWithLifeCycle` <br/>

### pluginDriver.fileManager

Instance of the [FileManager](/reference/filemManager).

- **Type:** `FileManager` <br/>

### pluginDriver.events

The `PluginDriver` triggers events when a plugin executes (`execute`), when a plugin has completed (`executed`), and when an error occurs (`error`).

```typescript [Events]
type Events = {
  execute: [executer: Executer]
  executed: [executer: Executer]
  error: [error: Error]
}
```

- **Type:** `Events` <br/>

### pluginDriver.queue

Instance of the queue.

- **Type:** `Queue` <br/>

### pluginDriver.config

The config that has been set in `kubb.config.ts`.

- **Type:** `KubbConfig` <br/>

### pluginDriver.executed

Array of all executed plugins.

- **Type:** `Array<Executer>` <br/>


### pluginDriver.resolvePath

Every plugin can set `resolvePath`. When you call `pluginDriver.resolvePath`, it finds the first resolvePath based on the plugins array and uses that return value as the path.

You can set `pluginKey` as an option. If provided, it finds the plugin with that `pluginKey` and uses the return value of that specific plugin as the path.

- **Type:** `(params: ResolvePathParams): KubbFile.OptionalPath` <br/>

### pluginDriver.resolveName

Every plugin can set `resolveName`. When you call `pluginDriver.resolveName`, it finds the first resolveName based on the plugins array and uses that return value as the name for a function, file, or type.

You can set `pluginKey` as an option. If provided, it finds the plugin with that `pluginKey` and uses the return value of that specific plugin as the name.

- **Type:** `(params: ResolveNameParams): string` <br/>

### pluginDriver.on

Instead of calling `pluginDriver.events.on`, you can use `pluginDriver.on`. This method also has better types.

- **Type:** `(eventName: keyof Events, handler: (...eventArg: any) => void` <br/>

### pluginDriver.hookForPlugin

Run a specific hookName for plugin x.

### pluginDriver.hookForPluginSync

Run a specific hookName for plugin x.

### pluginDriver.hookFirst

First non-null result stops and will return its value.

### pluginDriver.hookFirstSync

First non-null result stops and will return its value.

### pluginDriver.hookParallel

Run all plugins in parallel. Order is based on `this.plugin` and whether `pre` or `post` is set.

### pluginDriver.hookReduceArg0

Chain all plugins using `reduce` to handle every returned value. The return value of the first plugin is used as the first parameter for the plugin after that.

### pluginDriver.hookSequential

Run all plugins sequentially. Order is based on `this.plugin` and whether `pre` or `post` is set.
