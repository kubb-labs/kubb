import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { File, useApp } from '@kubb/react'
import { Operations } from '../components/Operations'
import type { PluginClient } from '../types'

export const operationsGenerator = createReactGenerator<PluginClient>({
  name: 'client',
  Operations({ operations }) {
    const {
      pluginManager,
      plugin: {
        key: pluginKey,
        options: { output },
      },
    } = useApp<PluginClient>()
    const oas = useOas()

    const name = 'operations'
    const file = pluginManager.getFile({ name, extname: '.ts', pluginKey })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
      >
        <Operations name={name} operations={operations} />
      </File>
    )
  },
})
