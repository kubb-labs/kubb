import { defineGenerator } from '@kubb/core'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Operations } from '../components/Operations'
import type { PluginClient } from '../types'

export const operationsGenerator = defineGenerator<PluginClient>({
  name: 'client',
  renderer: jsxRenderer,
  operations(nodes, options) {
    const { config, resolver, adapter, root } = this
    const { output, group } = options

    const name = 'operations'
    const file = resolver.resolveFile({ name, extname: '.ts' }, { root, output, group })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        <Operations name={name} nodes={nodes} />
      </File>
    )
  },
})
