import { defaultResolveBanner, defaultResolveFooter, defineGenerator } from '@kubb/core'
import { File } from '@kubb/react-fabric'
import { Operations } from '../components/Operations'
import type { PluginClient } from '../types'

export const operationsGenerator = defineGenerator<PluginClient>({
  name: 'client',
  type: 'react',
  Operations({ nodes, config, options, plugin, driver, adapter }) {
    const { output } = options
    const name = 'operations'
    const file = driver.getFile({ name, extname: '.ts', pluginName: plugin.name })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={defaultResolveBanner(adapter.rootNode ?? undefined, { output, config })}
        footer={defaultResolveFooter(adapter.rootNode ?? undefined, { output })}
      >
        <Operations name={name} nodes={nodes} />
      </File>
    )
  },
})
