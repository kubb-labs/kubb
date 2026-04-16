import path from 'node:path'
import { trimExtName } from '@internals/utils'
import type { AdapterOas } from '@kubb/adapter-oas'
import { adapterOasName } from '@kubb/adapter-oas'

import { type Adapter, ast, createPlugin } from '@kubb/core'
import { version } from '../package.json'
import { getPageHTML } from './redoc.tsx'
import type { PluginRedoc } from './types.ts'

export const pluginRedocName = 'plugin-redoc' satisfies PluginRedoc['name']

export const pluginRedoc = createPlugin<PluginRedoc>((options) => {
  const { output = { path: 'docs.html' } } = options

  return {
    name: pluginRedocName,
    version,
    options: {
      output,
      name: trimExtName(output.path),
      exclude: [],
      override: [],
    },
    async buildStart() {
      const adapter = this.adapter

      if (adapter?.name !== adapterOasName) {
        throw new Error(
          `[${pluginRedocName}] plugin-redoc requires the OpenAPI adapter. Make sure you are using adapterOas (e.g. \`adapter: adapterOas()\`) in your Kubb config.`,
        )
      }

      const document = (adapter as Adapter<AdapterOas>).document

      if (!document) {
        throw new Error(
          `[${pluginRedocName}] No OpenAPI document found. The adapterOas did not produce a document — ensure the adapter has run before this plugin.`,
        )
      }

      const root = this.root
      const pageHTML = await getPageHTML(document)

      await this.addFile(
        ast.createFile({
          baseName: 'docs.html',
          path: path.resolve(root, output.path || './docs.html'),
          sources: [
            ast.createSource({
              name: 'docs.html',
              nodes: [ast.createText(pageHTML)],
            }),
          ],
        }),
      )
    },
  }
})
