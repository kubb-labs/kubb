import type { PluginOas } from '@kubb/plugin-oas'
import { createGenerator } from '@kubb/plugin-oas/generators'

const toURL = (path: string) => path.replaceAll('{', ':').replaceAll('}', '')

export const example1 = createGenerator<PluginOas>({
  name: 'client-operation',
  async operation({ operation, generator }) {
    const pluginKey = generator.context.plugin.key
    const name = generator.context.pluginManager.resolveName({
      name: operation.getOperationId(),
      pluginKey,
      type: 'function',
    })

    const client = {
      name,
      file: generator.context.pluginManager.getFile({
        name,
        extname: '.ts',
        pluginKey,
        options: { type: 'file', pluginKey },
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
