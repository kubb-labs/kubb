---
layout: doc

title: Plugins
outline: deep
---

# Plugins

## Create your own plugin

The easiest way to get started is to use our [template on GitHub](https://github.com/kubb-project/plugin-template) or clone the following repo [https://github.com/kubb-project/plugin-template](https://github.com/kubb-project/plugin-template).

### Code snippet

```typescript
import fs from "fs"

import { PluginFactoryOptions, write } from "@kubb/core"
import type { PluginFactoryOptions } from "@kubb/core"

type Options = {
  version: "3" | "2"
}

type MyPluginOptions = PluginFactoryOptions<"myPlugin", Options, false>

export default createPlugin<MyPluginOptions>(({ version }) => {
  return {
    name: "myPlugin",
    validate(plugins) {
      const corePlugin = plugins.find((plugin) => plugin.name === "core")

      if (!corePlugin) {
        return { message: `This plugin depends on the core plugin.` }
      }

      return true
    },
    async buildStart(kubbConfig) {
      console.log("Build start with config", kubbConfig)
    },
    async resolvePath(fileName, directory, options) {
      console.log("Build is resolving with fileName: ", fileName)
      if (!directory) {
        return null
      }
      return path.resolve(directory, fileName)
    },
     async resolveName(name) {
      return name.toUpperCase();
    },
    async load(path) {
      console.log("Build is loading in file: ", path)
    },
    async transform(code, path) {
      if (path.endsWith(".ts")) {
        return code + "const hello = 'world'"
      }
    },
    async writeFile(code, path) {
      if (!path.endsWith(".ts") || !code) {
        return
      }

      await fs.writeFile(path, code)
    },
    async buildEnd() {
      console.log("Build end")
    },
  }
})
```


## FAQ

Plugin system is based on: 
- [Rollup's](https://github.com/rollup/rollup/blob/master/docs/05-plugin-development.md) plugin system with some minor changes.
- [Unplugin](https://github.com/unjs/unplugin)
- [Snowpack](https://www.snowpack.dev/guides/plugins)
