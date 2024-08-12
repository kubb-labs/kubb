import { File, useApp } from '@kubb/react'

import type { PluginMsw } from '../types.ts'
import { createParser } from '@kubb/plugin-oas'
import { Operations } from '../components/Operations.tsx'
import { useOperationManager } from '@kubb/plugin-oas/hooks'

export const operationsParser = createParser<PluginMsw>({
  name: 'operations',
  pluginName: 'plugin-msw',
  templates: {
    Operations({ operations, options }) {
      const { pluginManager } = useApp<PluginMsw>()
      const { getName, getFile } = useOperationManager()

      const file = pluginManager.getFile({ name: 'handlers', extName: '.ts', pluginKey: ['plugin-msw'] })

      const imports = operations
        .map((operation) => {
          const operationFile = getFile(operation, { pluginKey: ['plugin-msw'] })
          const operationName = getName(operation, { pluginKey: ['plugin-msw'], type: 'function' })

          return <File.Import key={operationFile.path} name={[operationName]} root={file.path} path={operationFile.path} />
        })
        .filter(Boolean)

      const handlers = operations.map((operation) => getName(operation, { type: 'function', pluginKey: ['plugin-msw'] }))

      return (
        <File baseName={file.baseName} path={file.path} meta={file.meta}>
          {imports}
          <File.Source>
            <Operations name={'handlers'} handlers={handlers} />
          </File.Source>
        </File>
      )
    },
  },
})
