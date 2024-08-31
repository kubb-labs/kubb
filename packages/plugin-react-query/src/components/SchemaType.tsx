import { useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { File, Type, useApp } from '@kubb/react'

import { pluginTsName } from '@kubb/plugin-ts'
import type { ReactNode } from 'react'
import type { PluginReactQuery } from '../types.ts'

export function SchemaType(): ReactNode {
  const {
    plugin: {
      options: { dataReturnType },
    },
  } = useApp<PluginReactQuery>()
  const { getSchemas, getName, getFile } = useOperationManager()
  const operation = useOperation()

  const file = getFile(operation)
  const fileType = getFile(operation, { pluginKey: [pluginTsName] })
  const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })

  const [TData, TError, TRequest, TPathParams, TQueryParams, THeaderParams, TResponse] = [
    schemas.response.name,
    schemas.errors?.map((item) => item.name).join(' | ') || 'never',
    schemas.request?.name || 'never',
    schemas.pathParams?.name || 'never',
    schemas.queryParams?.name || 'never',
    schemas.headerParams?.name || 'never',
    schemas.response.name,
  ]
  const factoryName = getName(operation, { type: 'type' })

  const clientType = `${factoryName}Client`
  const isFormData = operation.getContentType() === 'multipart/form-data'

  return (
    <>
      <File.Import
        name={[
          schemas.request?.name,
          schemas.response.name,
          schemas.pathParams?.name,
          schemas.queryParams?.name,
          schemas.headerParams?.name,
          ...(schemas.errors?.map((error) => error.name) || []),
        ].filter(Boolean)}
        root={file.path}
        path={fileType.path}
        isTypeOnly
      />
      <File.Source name={clientType} isTypeOnly>
        <Type name={clientType}>{`typeof client<${TResponse}, ${TError}, ${isFormData ? 'FormData' : TRequest}>`}</Type>
      </File.Source>
      <File.Source name={factoryName} isTypeOnly>
        <Type name={factoryName}>
          {`
        {
          data: ${TData}
          error: ${TError}
          request: ${isFormData ? 'FormData' : TRequest}
          pathParams: ${TPathParams}
          queryParams: ${TQueryParams}
          headerParams: ${THeaderParams}
          response: ${dataReturnType === 'data' ? TData : `Awaited<ReturnType<${clientType}>>`}
          client: {
            parameters: Partial<Parameters<${clientType}>[0]>
            return: Awaited<ReturnType<${clientType}>>
          }
        }
        `}
        </Type>
      </File.Source>
    </>
  )
}
