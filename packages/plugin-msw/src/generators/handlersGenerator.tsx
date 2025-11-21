import { usePluginManager } from '@kubb/core/hooks'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { File } from '@kubb/react-fabric'
import { Handlers } from '../components/Handlers.tsx'
import type { PluginMsw } from '../types'

export const handlersGenerator = createReactGenerator<PluginMsw>({
  name: 'plugin-msw',
  Operations({ operations, generator, plugin }) {
    const pluginManager = usePluginManager()

    const oas = useOas()
    const { getName, getFile } = useOperationManager(generator)

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
