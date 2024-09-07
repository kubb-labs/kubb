import { File, Type } from '@kubb/react'

import type { Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import type { ReactNode } from 'react'
import type { PluginReactQuery } from '../types.ts'

type Props = {
  typeName: string
  typedSchemas: OperationSchemas
  operation: Operation
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
}

export function SchemaType({ typeName, operation, typedSchemas, dataReturnType }: Props): ReactNode {
  const [TData, TError, TRequest, TPathParams, TQueryParams, THeaderParams, TResponse] = [
    typedSchemas.response.name,
    typedSchemas.errors?.map((item) => item.name).join(' | ') || 'never',
    typedSchemas.request?.name || 'never',
    typedSchemas.pathParams?.name || 'never',
    typedSchemas.queryParams?.name || 'never',
    typedSchemas.headerParams?.name || 'never',
    typedSchemas.response.name,
  ]

  const clientType = `${typeName}Client`
  const isFormData = operation.getContentType() === 'multipart/form-data'

  return (
    <>
      <File.Source name={clientType} isTypeOnly>
        <Type name={clientType}>{`typeof client<${TResponse}, ${TError}, ${isFormData ? 'FormData' : TRequest}>`}</Type>
      </File.Source>
      <File.Source name={typeName} isTypeOnly>
        <Type name={typeName}>
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
