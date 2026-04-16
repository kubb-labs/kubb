import { camelCase } from '@internals/utils'
import type { ast } from '@kubb/core'
import { defineGenerator } from '@kubb/core'
import { File, Function, jsxRenderer } from '@kubb/renderer-jsx'
import type { PluginClient } from '../types'

export const groupedClientGenerator = defineGenerator<PluginClient>({
  name: 'groupedClient',
  renderer: jsxRenderer,
  operations(nodes, ctx) {
    const { config, resolver, adapter, root } = ctx
    const { output, group } = ctx.options

    const controllers = nodes.reduce(
      (acc, operationNode) => {
        if (group?.type === 'tag') {
          const tag = operationNode.tags[0]
          const name = tag ? group?.name?.({ group: camelCase(tag) }) : undefined

          if (!tag || !name) {
            return acc
          }

          const file = resolver.resolveFile({ name, extname: '.ts', tag }, { root, output, group })
          const clientFile = resolver.resolveFile(
            { name: operationNode.operationId, extname: '.ts', tag: operationNode.tags[0] ?? 'default', path: operationNode.path },
            { root, output, group },
          )

          const client = {
            name: resolver.resolveName(operationNode.operationId),
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
      [] as Array<{ name: string; file: ast.FileNode; clients: Array<{ name: string; file: ast.FileNode }> }>,
    )

    return (
      <>
        {controllers.map(({ name, file, clients }) => {
          return (
            <File
              key={file.path}
              baseName={file.baseName}
              path={file.path}
              meta={file.meta}
              banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
              footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
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
        })}
      </>
    )
  },
})
