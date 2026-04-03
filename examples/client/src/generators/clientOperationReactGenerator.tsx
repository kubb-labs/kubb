import { defineGenerator } from '@kubb/core'
import type { PluginClient } from '@kubb/plugin-client'
import { File } from '@kubb/react-fabric'

const toURL = (path: string) => path.replaceAll('{', ':').replaceAll('}', '')

export const clientOperationReactGenerator = defineGenerator<PluginClient>({
  name: 'client-operation',
  operation(node) {
    const { resolver, config } = this
    const file = resolver.resolveFile(
      { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
      { root: config.root, output: { path: config.output.path } },
    )

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Source>
          {`
          export const ${node.operationId} = {
            method: '${node.method}',
            url: '${toURL(node.path)}'
          }
        `}
        </File.Source>
      </File>
    )
  },
})
