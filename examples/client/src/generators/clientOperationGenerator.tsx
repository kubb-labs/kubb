import type { PluginClient } from '@kubb/plugin-client'
import { createGenerator } from '@kubb/plugin-oas/generators'

const toURL = (path: string) => path.replaceAll('{', ':').replaceAll('}', '')

export const clientOperationGenerator = createGenerator<PluginClient>({
  name: 'client-operation',
  async operation({ operation, generator }) {
    const pluginName = generator.context.plugin.name
    const name = generator.context.pluginDriver.resolveName({
      name: operation.getOperationId(),
      pluginName,
      type: 'function',
    })

    const client = {
      name,
      file: generator.context.pluginDriver.getFile({
        name,
        extname: '.ts',
        pluginName,
        options: { type: 'file', pluginName },
      }),
    }

    return [
      {
        baseName: client.file.baseName,
        path: client.file.path,
        meta: client.file.meta,
        sources: [
          {
            value: `
          export const ${operation.getOperationId()} = {
            method: '${operation.method}',
            url: '${toURL(operation.path)}'
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
