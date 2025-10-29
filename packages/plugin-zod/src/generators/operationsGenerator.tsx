import { usePluginManager } from '@kubb/core/hooks'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { File } from '@kubb/react-fabric'
import { Operations } from '../components/Operations.tsx'
import type { PluginZod } from '../types'

export const operationsGenerator = createReactGenerator<PluginZod>({
  name: 'operations',
  Operations({ operations, generator, plugin }) {
    const {
      key: pluginKey,
      options: { output, importPath },
    } = plugin
    const pluginManager = usePluginManager()

    const oas = useOas()
    const { getFile, groupSchemasByName } = useOperationManager(generator)

    const name = 'operations'
    const file = pluginManager.getFile({ name, extname: '.ts', pluginKey })

    const transformedOperations = operations.map((operation) => ({ operation, data: groupSchemasByName(operation, { type: 'function' }) }))

    const imports = Object.entries(transformedOperations)
      .map(([key, { data, operation }]) => {
        const names = [data.request, ...Object.values(data.responses), ...Object.values(data.parameters)].filter(Boolean)

        return <File.Import key={key} name={names} root={file.path} path={getFile(operation).path} />
      })
      .filter(Boolean)

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
      >
        <File.Import isTypeOnly name={['z']} path={importPath} />
        {imports}
        <Operations name={name} operations={transformedOperations} />
      </File>
    )
  },
})
