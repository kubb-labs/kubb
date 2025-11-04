import path from 'node:path'
import type { Plugin } from '@kubb/core'
import { createPlugin } from '@kubb/core'
import type { PluginOas } from '@kubb/plugin-oas'
import { pluginOasName } from '@kubb/plugin-oas'
import { getPageHTML } from './redoc.tsx'
import type { PluginRedoc } from './types.ts'

function trimExtName(text: string): string {
  return text.replace(/\.[^/.]+$/, '')
}

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
    async install() {
      const [swaggerPlugin]: [Plugin<PluginOas>] = this.pluginManager.getDependedPlugins<PluginOas>([pluginOasName])
      const oas = await swaggerPlugin.context.getOas()

      await oas.dereference()

      const root = path.resolve(this.config.root, this.config.output.path)
      const pageHTML = await getPageHTML(oas.api)

      await this.addFile({
        baseName: 'docs.html',
        path: path.resolve(root, output.path || './docs.html'),
        sources: [
          {
            name: 'docs.html',
            value: pageHTML,
          },
        ],
      })
    },
  }
})
