---
layout: doc

title: Plugins
outline: deep
---

# Plugins

Plugins are a great way to extend Kubb's basic functionality. Even the package `@kubb/core` is a plugin, which also contains the building blocks in creating your own plugin. We have already written some plugins so you can easily get started with TypeScript or ReactQuery.

::: tip
Do you have an idea or a specific change is needed, feel free to <a href="https://github.com/kubb-project/kubb/issues/new/choose">create an issue</a>.
:::

<hr/>

## Template

The easiest way to get started with creating your own Kubb plugin is to use our [template on GitHub](https://github.com/kubb-project/plugin-template) or clone the following repo [https://github.com/kubb-project/plugin-template](https://github.com/kubb-project/plugin-template).

```shell
$ git clone https://github.com/kubb-project/plugin-template.git
```

### Code snippet

```typescript
import pathParser from 'node:path'

import { createPlugin, getPathMode, validatePlugins, writeIndexes, KubbPlugin } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import type { File } from '@kubb/core'
import type { PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

export const pluginName = 'plugin-demo' satisfies PluginOptions['name']
export const pluginKey = [pluginName] satisfies PluginOptions['key']

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'demo' } = options
  let pluginsOptions: [KubbPlugin<SwaggerPluginOptions>]

  return {
    name: pluginName,
    options,
    resolvePath(fileName, directory, options) {
      const root = pathParser.resolve(this.config.root, this.config.output.path)
      const mode = getPathMode(pathParser.resolve(root, output))

      if (mode === 'file') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return pathParser.resolve(root, output)
      }

      return pathParser.resolve(root, output, fileName)
    },
    resolveName(name) {
      return camelCase(name, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: camelCaseTransformMerge })
    },
    async buildStart() {
      // const [swaggerPlugin] = pluginsOptions
      // const oas = await swaggerApi.getOas()

      const files: File[] = [
        {
          fileName: 'test.ts',
          path: this.resolvePath({
            fileName: 'test.ts',
            pluginName,
          })!,
          source: "export const hello = 'world';",
        },
      ]
      await this.addFile(...files)

      console.log('Build start')
    },
    async buildEnd() {
      if (this.config.output.write === false) {
        return
      }

      const root = pathParser.resolve(this.config.root, this.config.output.path)
      const files = await writeIndexes(root, { extensions: /\.ts/, exclude: [/schemas/, /json/] })

      if (files) {
        await this.addFile(...files)
      }

      console.log('Build end')
    },
  }
})
```

Our plugin system is based on some ideas of the following packages:

- [Rollup's](https://github.com/rollup/rollup/blob/master/docs/05-plugin-development.md)
- [Unplugin](https://github.com/unjs/unplugin)
- [Snowpack](https://www.snowpack.dev/guides/plugins)
