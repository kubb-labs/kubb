import { type URLObject, URLPath } from '@kubb/core/utils'
import { Parser, Function, Type } from '@kubb/react'
import { QueryKey } from '@kubb/swagger-tanstack-query/components'
import { useOperation, useOperationManager } from '@kubb/swagger/hooks'
import type React from 'react'

export const templates = {
  ...QueryKey.templates,
  react: function ({ name, typeName, params, generics, returnType, JSDoc }: React.ComponentProps<typeof QueryKey.templates.react>) {
    const operation = useOperation()
    const { getSchemas } = useOperationManager()

    const schemas = getSchemas(operation)
    const path = new URLPath(operation.path)
    const withQueryParams = !!schemas.queryParams?.name

    const pathObject = path.toObject({
      type: 'path',
    }) as URLObject

    const keys = [JSON.stringify(pathObject.url), withQueryParams ? '...(params ? [params] : [])' : undefined].filter(Boolean)

    return (
      <>
        <Function.Arrow name={name} export generics={generics} params={params} returnType={returnType} singleLine JSDoc={JSDoc}>
          {`[${keys}] as const`}
        </Function.Arrow>

        <Type name={typeName} export>
          {`ReturnType<typeof ${name}>`}
        </Type>
      </>
    )
  },
} as const
