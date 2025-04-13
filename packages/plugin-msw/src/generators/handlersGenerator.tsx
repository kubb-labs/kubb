import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { File, useApp } from '@kubb/react'
import { Handlers } from '../components/Handlers.tsx'
import type { PluginMsw } from '../types'

export const handlersGenerator = createReactGenerator<PluginMsw>({
  name: 'plugin-msw',
  Operations({ operations }) {
    const { pluginManager, plugin } = useApp<PluginMsw>()
    const oas = useOas()
    const { getName, getFile } = useOperationManager()

    const file = pluginManager.getFile({ name: 'handlers', extname: '.ts', pluginKey: plugin.key })

    const imports = operations.map((operation) => {
      const operationFile = getFile(operation, { pluginKey: plugin.key })
      const operationName = getName(operation, { pluginKey: plugin.key, type: 'function' })

      return <File.Import key={operationFile.path} name={[operationName]} root={file.path} path={operationFile.path} />
    })

    const handlers = operations.map((operation) => `${getName(operation, { type: 'function', pluginKey: plugin.key })}()`)

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={getBanner({ oas, output: plugin.options.output, config: pluginManager.config })}
        footer={getFooter({ oas, output: plugin.options.output })}
      >
        {imports}
        <Handlers name={'handlers'} handlers={handlers} />
      </File>
    )
  },
})
