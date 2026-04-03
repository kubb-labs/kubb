import path from 'node:path'
import { defineGenerator } from '@kubb/core'
import { File } from '@kubb/react-fabric'
import { Operations } from '../components/Operations'
import type { PluginClient } from '../types'

export const operationsGenerator = defineGenerator<PluginClient>({
  name: 'client',
  operations(nodes, options) {
    const { config, resolver, adapter } = this
    const { output, group } = options
    const root = path.resolve(config.root, config.output.path)

    const name = 'operations'
    const file = resolver.resolveFile({ name, extname: '.ts' }, { root, output, group })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        <Operations name={name} nodes={nodes} />
      </File>
    )
  },
})
