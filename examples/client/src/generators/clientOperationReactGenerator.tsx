import { defineGenerator } from '@kubb/core'
import type { PluginClient } from '@kubb/plugin-client'
import { File, jsxRenderer } from '@kubb/renderer-jsx'

const toURL = (path: string) => path.replaceAll('{', ':').replaceAll('}', '')

export const clientOperationReactGenerator = defineGenerator<PluginClient>({
  name: 'client-operation',
  renderer: jsxRenderer,
  operation(node, ctx) {
    const { resolver, root } = ctx
    const { output } = ctx.options
    const file = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output })

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Source>
          {`export const ${node.operationId} = {
  method: '${node.method}',
  url: '${toURL(node.path)}'
}`}
        </File.Source>
      </File>
    )
  },
})
