import { usePluginManager } from '@kubb/core/hooks'
import { camelCase } from '@kubb/core/transformers'
import type { KubbFile } from '@kubb/fabric-core/types'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { File, Function } from '@kubb/react-fabric'
import type { PluginClient } from '../types'

export const groupedClientGenerator = createReactGenerator<PluginClient>({
  name: 'groupedClient',
  Operations({ operations, generator, plugin }) {
    const { options, key: pluginKey } = plugin
    const pluginManager = usePluginManager()

    const oas = useOas()
    const { getName, getFile, getGroup } = useOperationManager(generator)

    const controllers = operations.reduce(
      (acc, operation) => {
        if (options.group?.type === 'tag') {
          const group = getGroup(operation)
          const name = group?.tag ? options.group?.name?.({ group: camelCase(group.tag) }) : undefined

          if (!group?.tag || !name) {
            return acc
          }

          const file = pluginManager.getFile({
            name,
            extname: '.ts',
            pluginKey,
            options: { group },
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
        <File
          key={file.path}
          baseName={file.baseName}
          path={file.path}
          meta={file.meta}
          banner={getBanner({ oas, output: options.output, config: pluginManager.config })}
          footer={getFooter({ oas, output: options.output })}
        >
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
