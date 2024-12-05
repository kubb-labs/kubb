import { camelCase } from '@kubb/core/transformers'
import type * as KubbFile from '@kubb/fs/types'
import { pluginClientName } from '@kubb/plugin-client'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { File, Function, useApp } from '@kubb/react'
import type { PluginClient } from '../types'

export const groupedClientGenerator = createReactGenerator<PluginClient>({
  name: 'groupedClient',
  Operations({ operations }) {
    const {
      pluginManager,
      plugin: { options, key: pluginKey },
    } = useApp<PluginClient>()
    const { getName, getFile } = useOperationManager()

    const controllers = operations.reduce(
      (acc, operation) => {
        if (options.group?.type === 'tag') {
          const tag = operation.getTags().at(0)?.name
          const name = tag ? options.group?.name?.({ group: camelCase(tag) }) : undefined

          if (!tag || !name) {
            return acc
          }

          const file = pluginManager.getFile({
            name,
            extname: '.ts',
            pluginKey,
            options: { group: tag },
          })

          const client = {
            name: getName(operation, { type: 'function' }),
            file: getFile(operation),
          }

          const previousFile = acc.find((item) => item.file.path === file.path)

          if (previousFile) {
            previousFile.clients.push(client)
          } else {
            acc.push({ name, file, clients: [client] })
          }
        }

        return acc
      },
      [] as Array<{ name: string; file: KubbFile.File; clients: Array<{ name: string; file: KubbFile.File }> }>,
    )

    return controllers.map(({ name, file, clients }) => {
      return (
        <File key={file.path} baseName={file.baseName} path={file.path} meta={file.meta} banner={options.output?.banner} footer={options.output?.footer}>
          {clients.map((client) => (
            <File.Import key={client.name} name={[client.name]} root={file.path} path={client.file.path} />
          ))}

          <File.Source name={name} isExportable isIndexable>
            <Function export name={name}>
              {`return { ${clients.map((client) => client.name).join(', ')} }`}
            </Function>
          </File.Source>
        </File>
      )
    })
  },
})
