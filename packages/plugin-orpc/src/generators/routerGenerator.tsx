import { usePluginManager } from '@kubb/core/hooks'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { File } from '@kubb/react-fabric'
import { Router } from '../components/Router.tsx'
import type { PluginOrpc } from '../types.ts'

export const routerGenerator = createReactGenerator<PluginOrpc>({
  name: 'router',
  Operations({ operations, generator, plugin }) {
    const {
      key: pluginKey,
      options: { output, routerName },
    } = plugin

    const pluginManager = usePluginManager()
    const oas = useOas()
    const { getFile } = useOperationManager(generator)

    const name = routerName || 'router'
    const file = pluginManager.getFile({ name, extname: '.ts', pluginKey })

    // Map operations to their contract names
    const transformedOperations = operations.map((operation) => {
      const contractName = pluginManager.resolveName({
        name: operation.getOperationId(),
        pluginKey,
        type: 'function',
      })

      return {
        operation,
        contractName,
      }
    })

    // Collect all contract imports
    const imports = operations.map((operation) => {
      const contractName = pluginManager.resolveName({
        name: operation.getOperationId(),
        pluginKey,
        type: 'function',
      })
      const contractFile = getFile(operation)

      return <File.Import key={operation.getOperationId()} name={[contractName]} root={file.path} path={contractFile.path} />
    })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
      >
        {imports}
        <Router name={name} operations={transformedOperations} />
      </File>
    )
  },
})
