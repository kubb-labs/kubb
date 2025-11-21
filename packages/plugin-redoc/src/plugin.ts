import path from 'node:path'
import { definePlugin } from '@kubb/core'
import { pluginOasName } from '@kubb/plugin-oas'
import { getPageHTML } from './redoc.tsx'
import type { PluginRedoc } from './types.ts'

function trimExtName(text: string): string {
  return text.replace(/\.[^/.]+$/, '')
}

export const pluginRedocName = 'plugin-redoc' satisfies PluginRedoc['name']

export const pluginRedoc = definePlugin<PluginRedoc>((options) => {
  const { output = { path: 'docs.html' } } = options

  return {
    name: pluginRedocName,
    options: {
      output,
      name: trimExtName(output.path),
    },
    pre: [pluginOasName],
    async install() {
      const oas = await this.getOas()
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
