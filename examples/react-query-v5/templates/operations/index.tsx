import { Editor, Type, Function, File, usePlugin } from '@kubb/react'
import { useGetSchemas, useOperations } from '@kubb/swagger/hooks'
import { Operations } from '@kubb/swagger-tanstack-query/components'
import React from 'react'
import { FileMeta, PluginOptions } from '@kubb/swagger-tanstack-query'
import path from 'node:path'
import { usePluginManager } from '@kubb/react'

export const templates = {
  ...Operations.templates,
  editor: function({ children }: React.ComponentProps<typeof Operations.templates.editor>) {
    const { key: pluginKey } = usePlugin<PluginOptions>()
    const operations = useOperations()
    const getSchemas = useGetSchemas()
    const pluginManager = usePluginManager()

    const root = path.resolve(pluginManager.config.root, pluginManager.config.output.path)

    const imports = operations.map(operation => {
      return [getSchemas(operation).response?.name, getSchemas(operation).request?.name]
    }).flat().filter(Boolean)

    const invalidations = operations.reduce((acc, operation) => {
      const name = pluginManager.resolveName({ name: operation.getOperationId(), pluginKey, type: 'function' })
      const responseName = getSchemas(operation).response?.name
      const variableName = getSchemas(operation).request?.name
      acc[name] = `UseMutationOptions<${responseName}, unknown, ${variableName || 'void'}>['onSuccess']`

      return acc
    }, {} as Record<string, string>)

    return (
      <Editor language="typescript">
        <File<FileMeta>
          baseName={'invalidations'}
          path={path.join(root, './invalidations.ts')}
        >
          <File.Import
            name={imports}
            path={path.join(root, './index.ts')}
            root={path.join(root, './invalidations.ts')}
            isTypeOnly
          />

          <File.Import isTypeOnly name={['UseMutationOptions']} path="@tanstack/react-query" />
          <File.Source>
            <Type export name="Invalidations">
              {`{ ${
                Object.keys(invalidations).map(key => {
                  return `${JSON.stringify(key)}: ${invalidations[key]}`
                })
              } }`}
            </Type>
          </File.Source>
        </File>
      </Editor>
    )
  },
} as const
