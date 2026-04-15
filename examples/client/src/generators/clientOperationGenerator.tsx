import { createFile, createSource, createText } from '@kubb/ast'
import { defineGenerator } from '@kubb/core'
import type { PluginClient } from '@kubb/plugin-client'

const toURL = (path: string) => path.replaceAll('{', ':').replaceAll('}', '')

export const clientOperationGenerator = defineGenerator<PluginClient>({
  name: 'client-operation',
  async operation(node, ctx) {
    const { resolver, root } = ctx
    const { output } = ctx.options
    const file = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output })

    return [
      createFile({
        baseName: file.baseName,
        path: file.path,
        meta: file.meta,
        sources: [
          createSource({
            nodes: [
              createText(`export const ${node.operationId} = {
  method: '${node.method}',
  url: '${toURL(node.path)}'
}`),
            ],
          }),
        ],
      }),
    ]
  },
})
