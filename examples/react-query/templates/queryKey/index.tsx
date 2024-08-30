import { type URLObject, URLPath } from '@kubb/core/utils'
import { useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { QueryKey } from '@kubb/plugin-react-query/components'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, Function, Type } from '@kubb/react'
import type React from 'react'

export const templates = {
  ...QueryKey.templates,
  react: function ({ name, typeName, params, generics, returnType, JSDoc }: React.ComponentProps<typeof QueryKey.templates.react>) {
    const operation = useOperation()
    const { getSchemas } = useOperationManager()

    const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
    const path = new URLPath(operation.path)
    const withQueryParams = !!schemas.queryParams?.name

    const pathObject = path.toObject({
      type: 'path',
    }) as URLObject

    const keys = [JSON.stringify(pathObject.url), withQueryParams ? '...(params ? [params] : [])' : undefined].filter(Boolean)

    return (
      <>
        <File.Source name={name} isExportable isIndexable>
          <Function.Arrow name={name} export generics={generics} params={params} returnType={returnType} singleLine JSDoc={JSDoc}>
            {`[${keys}] as const`}
          </Function.Arrow>
        </File.Source>

        <File.Source name={typeName} isExportable isIndexable isTypeOnly>
          <Type name={typeName} export>
            {`ReturnType<typeof ${name}>`}
          </Type>
        </File.Source>
      </>
    )
  },
} as const
