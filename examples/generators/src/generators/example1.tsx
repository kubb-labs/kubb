import { createFile, createSource } from '@kubb/ast'
import type { PluginOas } from '@kubb/plugin-oas'
import { createGenerator } from '@kubb/plugin-oas/generators'

const toURL = (path: string) => path.replaceAll('{', ':').replaceAll('}', '')

export const example1 = createGenerator<PluginOas>({
  name: 'client-operation',
  async operation({ operation, generator }) {
    const pluginName = generator.context.plugin.name
    const name = generator.context.driver.resolveName({
      name: operation.getOperationId(),
      pluginName,
      type: 'function',
    })

    const client = {
      name,
      file: generator.context.driver.getFile({
        name,
        extname: '.ts',
        pluginName,
        options: { type: 'file', pluginName },
      }),
    }

    return [
      createFile({
        baseName: client.file.baseName,
        path: client.file.path,
        meta: client.file.meta,
        sources: [
          createSource({
            value: `
          export const ${operation.getOperationId()} = {
            method: '${operation.method}',
            url: '${toURL(operation.path)}'
          }
        `,
          }),
        ],
      }),
    ]
  },
})
