import { Editor, Type, File, usePlugin } from '@kubb/react'
import { useOperationHelpers, useOperations } from '@kubb/swagger/hooks'
import { Operations } from '@kubb/swagger-tanstack-query/components'
import React from 'react'
import { FileMeta, PluginOptions } from '@kubb/swagger-tanstack-query'
import path from 'node:path'
import { usePluginManager } from '@kubb/react'

export const templates = {
  ...Operations.templates,
  root: function ({}: React.ComponentProps<typeof Operations.templates.root>) {
    const pluginManager = usePluginManager()
    const { key: pluginKey } = usePlugin<PluginOptions>()
    const operations = useOperations()
    const { getName, getSchemas } = useOperationHelpers()

    const root = path.resolve(pluginManager.config.root, pluginManager.config.output.path)

    const imports = operations
      .map((operation) => {
        const schemas = getSchemas(operation)

        return [schemas.response?.name, schemas.request?.name]
      })
      .flat()
      .filter(Boolean)

    const invalidations = operations.reduce(
      (acc, operation) => {
        const name = getName(operation, { pluginKey, type: 'function' })
        const schemas = getSchemas(operation)

        acc[name] = `UseMutationOptions<${schemas.response.name}, unknown, ${schemas.request?.name || 'void'}>['onSuccess']`

        return acc
      },
      {} as Record<string, string>,
    )

    return (
      <Editor language="typescript">
        <File<FileMeta> baseName={'invalidations.ts'} path={path.join(root, './invalidations.ts')}>
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
      </Editor>
    )
  },
} as const
