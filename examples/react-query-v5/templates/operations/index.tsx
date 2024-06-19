import path from 'node:path'
import { Parser, File, Type, useApp } from '@kubb/react'
import type { PluginTanstackQuery } from '@kubb/swagger-tanstack-query'
import { Operations } from '@kubb/swagger-tanstack-query/components'
import { useOperationManager, useOperations } from '@kubb/plugin-oas/hooks'
import type React from 'react'
import { pluginTsName } from '@kubb/swagger-ts'

export const templates = {
  ...Operations.templates,
  root: function ({}: React.ComponentProps<typeof Operations.templates.root>) {
    const {
      plugin: { key: pluginKey },
      pluginManager,
    } = useApp<PluginTanstackQuery>()
    const operations = useOperations()
    const { getName, getSchemas } = useOperationManager()

    const root = path.resolve(pluginManager.config.root, pluginManager.config.output.path)

    const imports = operations
      .flatMap((operation) => {
        const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })

        return [schemas.response?.name, schemas.request?.name]
      })
      .filter(Boolean) as string[]

    const invalidations = operations.reduce(
      (acc, operation) => {
        const name = getName(operation, { pluginKey, type: 'function' })
        const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })

        acc[name] = `UseMutationOptions<${schemas.response.name}, unknown, ${schemas.request?.name || 'void'}>['onSuccess']`

        return acc
      },
      {} as Record<string, string>,
    )

    return (
      <Parser language="typescript">
        <File baseName={'invalidations.ts'} path={path.join(root, './invalidations.ts')}>
          <File.Import name={imports} path={path.join(root, './index.ts')} root={path.join(root, './invalidations.ts')} isTypeOnly />

          <File.Import isTypeOnly name={['UseMutationOptions']} path="@tanstack/react-query" />
          <File.Source>
            <Type export name="Invalidations">
              {`{ ${Object.keys(invalidations).map((key) => {
                return `${JSON.stringify(key)}: ${invalidations[key]}`
              })} }`}
            </Type>
          </File.Source>
        </File>
      </Parser>
    )
  },
} as const
