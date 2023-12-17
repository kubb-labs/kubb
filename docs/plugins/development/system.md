---
layout: doc

title: Development
outline: deep
---

# Plugin system

::: warning Under construction
:::

Kubb provides a lightweight yet powerful plugin system to implement most of its functionality and allows the implementation of your plugin.

Plugins written by developers can generate code, resolve paths, resolve names and call other plugins.<br/>

Our plugin system is based on the following packages:

- [Rollup](https://github.com/rollup/rollup)
- [Unplugin](https://github.com/unjs/unplugin)
- [Snowpack](https://www.snowpack.dev/guides/plugins)

## Setup

Plugins provide a function similar to `(options?: PluginOptions) => KubbUserPluginWithLifeCycle` as an entry point.

### Plugin example

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
    resolvePath(baseName, directory, options) {
      const root = path.resolve(this.config.root, this.config.output.path)

      return path.resolve(root, output.path, baseName)
    },
    resolveName(name, type) {
      return camelCase(name)
    },
    async buildStart() {
      // run something when the build is started
    },
    async writeFile(source, writePath) {
      if (!writePath.endsWith('.ts') || !source) {
        return
      }

      return this.fileManager.write(source, writePath, { sanity: false })
    },
    async buildEnd() {
      // run something when the build is ended
    },
  }
})
```

```typescript [types.ts]
export type Options = {
  name: string
}

export type PluginOptions = PluginFactoryOptions<'kubb-custom-plugin', Options, Options>

// register your plugin to the `@kubb/core` typescript system
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

export default definePlugin
```

:::

Registering the plugin:

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import createPlugin from './index.ts'

export default defineConfig(() => {
  return {
    plugins: [
      createPlugin({ name: 'custom-name' }),
    ],
  }
})
```

### Naming Convention

The naming convention for plugins is as follows:

- The name of the plugin follows the format `@kubb/plugin-name` or `kubb-plugin-name`
- Use `PluginFactoryOptions` to create your pluginOptions that will be used to create some TypeScript autocompletes and validations.

Simplified `PluginFactoryOptions` type:

```typescript
export type PluginFactoryOptions<Name, Options, ResolveOptions, API, ResolvePathOptions, AppMeta>
```

### Template Repository

[`plugin-template`](https://github.com/kubb-project/plugin-template) is a minimal Kubb plugin template repository that you can use as a basis for developing your Kubb plugin.

## Configure

To get started with creating plugins you need to set some options for the `PluginManager`. <br>
More info about the lifecycle: [PluginManager Lifecycle](/reference/pluginManager/lifecycle)<br/>
More info about the `PluginContext` or `this`: [Plugin Core](/plugins/development/core)

::: tip
When using type PluginOptions with `PluginFactoryOptions` you will already receive better types, name will be what you have defined as the first parameter to `PluginFactoryOptions` instead of string.
:::

- **Type:** `KubbUserPluginWithLifeCycle` <br/>

### name

Name of your plugin

- **Type:** `string` <br/>

### options

Specify some options here that you want to expose for other plugins or for internal use.

- **Type:** `object` <br/>

### pre

Which plugin(s) should be executed before the current one.

- **Type:** `string[]` <br/>

### post

Which plugin(s) should be executed after the current one.

- **Type:** `string[]` <br/>

### api

Add some extra functionality to your plugin, here you can even use functions which is not possible with `options`.

- **Type:** `(this: Omit<PluginContext, "addFile">) => object` <br/>

### resolvePath

This will be called when pluginManager.resolvePath is called, see [Pluginmanager and resolving a path](/reference/pluginManager/#pluginmanager-resolvepath).

- **Type:** `(this: PluginContext, baseName: string, directory?: string | undefined, options?: object) => KubbFile.OptionalPath` <br/>

### resolveName

This will be called when pluginManager.resolveName is called, see [Pluginmanager and resolving a name](/reference/pluginManager/#pluginmanager-resolvename).

- **Type:** `(this: PluginContext, name: string, type?: "function" | "type" | "file" | undefined) => string)` <br/>

### buildStart

This will be called when the build starts, see [Lifecycle](/plugins/development/system#lifecycle).

- **Type:** `(this: PluginContext, kubbConfig: KubbConfig) => PossiblePromise<void>` <br/>

### buildEnd

This will be called when the build is done, see [Lifecycle](/plugins/development/system#lifecycle).

- **Type:** `(this: PluginContext) => PossiblePromise<void>` <br/>

### writeFile

This will be called when a new file is ready to be written to the fileSystem, see [Lifecycle](/plugins/development/system#lifecycle).

- **Type:** `(this: Omit<PluginContext, "addFile">, source: string | undefined, path: string) => PossiblePromise<string | void>` <br/>

### transform

This will be called just before we call writeFile, see [Lifecycle](/plugins/development/system#lifecycle). Here you can override the source/content of a file.

- **Type:** `(this: Omit<PluginContext, "addFile">, source: string, path: string) => PossiblePromise<TransformResult>` <br/>

## Lifecycle

The moment that `build` of `@kubb/core` is called or you trigger the CLI the following things will happen:

1. Read out the input defined in `input.path` and check if that file exists or use `input.data`.
2. If `output.clean` is set remove all files in `output.path`.
3. A new `PluginManager` instance is created.
4. The `PluginManager` instance will call `buildStart` of all plugins in parallel.
   1. Plugin A is using `buildStart` to add files to the `FileManager`.
   ```typescript
   async buildStart() {
     // creating a file `test.ts` with as source `export const hello = 'world'`
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
   2. Trigger `queueTask`.
5. The `PluginManager` instance will call `buildEnd` of all plugins in parallel.
6. Return all files that are generated.

<hr/>

#### Task

`queueTask` is triggered when a new file is added to the `FileManager`.

1. Process the file to get back the generated code with imports, exports and source done by `FileManager.getSource(file)`.
2. The `PluginManager` instance will call `transform` of all plugins and combine the returned string by using the `transformReducer`.
3. The `PluginManager` instance will call `writeFile` of all plugins when `output.write` is set to true(by default) and the first one to **NOT** return null will be used as the returned `KubbFile.File`.
