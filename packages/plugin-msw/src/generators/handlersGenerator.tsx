import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { File, useApp } from '@kubb/react'
import { Handlers } from '../components/Handlers.tsx'
import { pluginMswName } from '../plugin.ts'
import type { PluginMsw } from '../types'

export const handlersGenerator = createReactGenerator<PluginMsw>({
  name: 'plugin-msw',
  Operations({ operations }) {
    const { pluginManager } = useApp<PluginMsw>()
    const { getName, getFile } = useOperationManager()

    const file = pluginManager.getFile({ name: 'handlers', extName: '.ts', pluginKey: [pluginMswName] })

    const imports = operations.map((operation) => {
      const operationFile = getFile(operation, { pluginKey: [pluginMswName] })
      const operationName = getName(operation, { pluginKey: [pluginMswName], type: 'function' })

      return <File.Import key={operationFile.path} name={[operationName]} root={file.path} path={operationFile.path} />
    })

    const handlers = operations.map((operation) => getName(operation, { type: 'function', pluginKey: [pluginMswName] }))

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta}>
        {imports}
        <Handlers name={'handlers'} handlers={handlers} />
      </File>
    )
  },
})
