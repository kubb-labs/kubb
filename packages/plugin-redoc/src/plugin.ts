import path from 'node:path'
import { type Adapter, createPlugin } from '@kubb/core'
import type { AdapterOas } from '@kubb/adapter-oas'
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
    async install() {
      const adapter = this.adapter as Adapter<AdapterOas> | undefined
      const document = adapter?.options.document

      if (!document) {
        throw new Error(`[${pluginRedocName}] No OpenAPI document found. Make sure you are using adapterOas (e.g. \`adapter: adapterOas()\`) in your Kubb config.`)
      }

      const root = path.resolve(this.config.root, this.config.output.path)
      const pageHTML = await getPageHTML(document)

      await this.addFile({
        baseName: 'docs.html',
        path: path.resolve(root, output.path || './docs.html'),
        sources: [
          {
            name: 'docs.html',
            value: pageHTML,
          },
        ],
        imports: [],
        exports: [],
      })
    },
  }
})
