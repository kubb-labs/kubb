import { useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { Type, useApp } from '@kubb/react'

import type { ReactNode } from 'react'
import type { PluginReactQuery } from '../types.ts'
import { pluginTsName } from '@kubb/plugin-ts'


export function SchemaType(): ReactNode {
  const {
    plugin: {
      options: { dataReturnType },
    },
  } = useApp<PluginReactQuery>()
  const { getSchemas, getName } = useOperationManager()
  const operation = useOperation()

  const schemas = getSchemas(operation, { pluginKey: [ pluginTsName ], type: 'type' })

  const [ TData, TError, TRequest, TPathParams, TQueryParams, THeaderParams, TResponse ] = [
    schemas.response.name,
    schemas.errors?.map((item) => item.name).join(' | ') || 'never',
    schemas.request?.name || 'never',
    schemas.pathParams?.name || 'never',
    schemas.queryParams?.name || 'never',
    schemas.headerParams?.name || 'never',
    schemas.response.name,
  ]
  const factoryName = getName(operation, { type: 'type' })

  const clientType = `${ factoryName }Client`
  const isFormData = operation.getContentType() === 'multipart/form-data'

  return (
    <>
      <Type
        name={ clientType }>{ `typeof client<${ TResponse }, ${ TError }, ${ isFormData ? 'FormData' : TRequest }>` }</Type>
      <Type name={ factoryName }>
        { `
        {
          data: ${ TData }
          error: ${ TError }
          request: ${ isFormData ? 'FormData' : TRequest }
          pathParams: ${ TPathParams }
          queryParams: ${ TQueryParams }
          headerParams: ${ THeaderParams }
          response: ${ dataReturnType === 'data' ? TData : `Awaited<ReturnType<${ clientType }>>` }
          client: {
            parameters: Partial<Parameters<${ clientType }>[0]>
            return: Awaited<ReturnType<${ clientType }>>
          }
        }
        ` }
      </Type>
    </>
  )
}
