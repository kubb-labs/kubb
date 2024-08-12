import { Type } from '@kubb/react'

import type { ReactNode } from 'react'
import type { PluginSwr } from '../types.ts'
import type { OperationSchemas } from '@kubb/plugin-oas'

type Props = {
  name: string
  schemas: OperationSchemas
  dataReturnType: PluginSwr['options']['dataReturnType']
}

export function SchemaType({ name, schemas, dataReturnType }: Props): ReactNode {
  const [TData, TError, TRequest, TPathParams, TQueryParams, THeaderParams, TResponse] = [
    schemas.response.name,
    schemas.errors?.map((item) => item.name).join(' | ') || 'never',
    schemas.request?.name || 'never',
    schemas.pathParams?.name || 'never',
    schemas.queryParams?.name || 'never',
    schemas.headerParams?.name || 'never',
    schemas.response.name,
  ]

  const clientType = `${name}Client`

  return (
    <>
      <Type name={clientType}>{`typeof client<${TResponse}, ${TError}, ${TRequest}>`}</Type>
      <Type name={name}>
        {`
        {
          data: ${TData}
          error: ${TError}
          request: ${TRequest}
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
    </>
  )
}
