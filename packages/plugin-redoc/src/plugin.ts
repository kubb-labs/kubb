import path from 'node:path'

import { PluginManager, createPlugin } from '@kubb/core'
import { pluginOasName } from '@kubb/plugin-oas'

import type { Plugin } from '@kubb/core'
import { trimExtName } from '@kubb/core/fs'
import type { PluginOas } from '@kubb/plugin-oas'
import { getPageHTML } from './redoc.tsx'
import type { PluginRedoc } from './types.ts'

export const pluginRedocName = 'plugin-redoc' satisfies PluginRedoc['name']

export const pluginRedoc = createPlugin<PluginRedoc>((options) => {
  const { output = { path: 'docs.html' } } = options

  return {
    name: pluginRedocName,
    options: {
      output,
      name: trimExtName(output.path),
    },
    pre: [pluginOasName],
    async buildStart() {
      const [swaggerPlugin]: [Plugin<PluginOas>] = PluginManager.getDependedPlugins<PluginOas>(this.plugins, [pluginOasName])
      const oas = await swaggerPlugin.context.getOas()

      await oas.dereference()

      const root = path.resolve(this.config.root, this.config.output.path)
      const pageHTML = await getPageHTML(oas.api)

      await this.fileManager.write(path.resolve(root, output.path || './docs.html'), pageHTML)
    },
  }
})
