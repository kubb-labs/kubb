import { File, useApp } from '@kubb/react'

import type { PluginClient } from '../types.ts'
import { createParser } from '@kubb/plugin-oas'
import { Operations } from '../components/Operations.tsx'

export const operationsParser = createParser<PluginClient>({
  name: 'operations',
  pluginName: 'plugin-client',
  templates: {
    Operations({ operations }) {
      const { pluginManager } = useApp<PluginClient>()

      const file = pluginManager.getFile({ name: 'operations', extName: '.ts', pluginKey: ['plugin-client'] })

      return (
        <File baseName={file.baseName} path={file.path} meta={file.meta} exportable={false}>
          <File.Source>
            <Operations operations={operations} />
          </File.Source>
        </File>
      )
    },
  },
})
