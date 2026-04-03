import { defineGenerator } from '@kubb/core'
import type { PluginClient } from '@kubb/plugin-client'

const toURL = (path: string) => path.replaceAll('{', ':').replaceAll('}', '')

export const clientOperationGenerator = defineGenerator<PluginClient>({
  name: 'client-operation',
  async operation(node) {
    const { resolver, config } = this
    const file = resolver.resolveFile(
      { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
      { root: config.root, output: { path: config.output.path } },
    )

    return [
      {
        baseName: file.baseName,
        path: file.path,
        meta: file.meta,
        sources: [
          {
            value: `
          export const ${node.operationId} = {
            method: '${node.method}',
            url: '${toURL(node.path)}'
          }
        `,
          },
        ],
        imports: [],
        exports: [],
      },
    ]
  },
})
