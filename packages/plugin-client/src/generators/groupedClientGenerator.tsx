import path from 'node:path'
import { camelCase } from '@internals/utils'
import { transform } from '@kubb/ast'
import { defineGenerator } from '@kubb/core'
import type { FabricFile } from '@kubb/fabric-core/types'
import { File, Function } from '@kubb/react-fabric'
import type { PluginClient } from '../types'

export const groupedClientGenerator = defineGenerator<PluginClient>({
  name: 'groupedClient',
  operations(nodes, options) {
    const { config, resolver, adapter, plugin } = this
    const { output, group } = options
    const root = path.resolve(config.root, config.output.path)

    const controllers = nodes.reduce(
      (acc, operationNode) => {
        if (group?.type === 'tag') {
          const tag = operationNode.tags[0]
          const name = tag ? group?.name?.({ group: camelCase(tag) }) : undefined

          if (!tag || !name) {
            return acc
          }

          const transformedNode = plugin.transformer ? transform(operationNode, plugin.transformer) : operationNode

          const file = resolver.resolveFile({ name, extname: '.ts', tag }, { root, output, group })
          const clientFile = resolver.resolveFile(
            { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
            { root, output, group },
          )

          const client = {
            name: resolver.resolveName(transformedNode.operationId),
            file: clientFile,
          }

          const previous = acc.find((item) => item.file.path === file.path)

          if (previous) {
            previous.clients.push(client)
          } else {
            acc.push({ name, file, clients: [client] })
          }
        }

        return acc
      },
      [] as Array<{ name: string; file: FabricFile.File; clients: Array<{ name: string; file: FabricFile.File }> }>,
    )

    return controllers.map(({ name, file, clients }) => {
      return (
        <File
          key={file.path}
          baseName={file.baseName}
          path={file.path}
          meta={file.meta}
          banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
          footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
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
