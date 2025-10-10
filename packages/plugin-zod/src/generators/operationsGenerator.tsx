import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { File, useApp } from '@kubb/react'
import { Operations } from '../components/Operations'
import type { PluginZod } from '../types'

export const operationsGenerator = createReactGenerator<PluginZod>({
  name: 'operations',
  Operations({ operations }) {
    const {
      pluginManager,
      plugin: {
        key: pluginKey,
        options: { output, importPath },
      },
    } = useApp<PluginZod>()
    const oas = useOas()
    const { getFile, groupSchemasByName } = useOperationManager()

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
