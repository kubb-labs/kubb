import { Type, usePlugin } from '@kubb/react'
import { useOperationSchemas } from '@kubb/swagger/hooks'

import type { ReactNode } from 'react'
import type { PluginOptions } from '../types.ts'

type Props = {
  factory: {
    name: string
  }
}

export function SchemaType({ factory }: Props): ReactNode {
  const { options: { dataReturnType } } = usePlugin<PluginOptions>()

  const schemas = useOperationSchemas()

  const [TData, TError, TRequest, TPathParams, TQueryParams, THeaderParams, TResponse] = [
    schemas.response.name,
    schemas.errors?.map((item) => item.name)
      .join(' | ') || 'never',
    schemas.request?.name || 'never',
    schemas.pathParams?.name || 'never',
    schemas.queryParams?.name || 'never',
    schemas.headerParams?.name || 'never',
    schemas.response.name,
  ]

  const clientType = `${factory.name}Client`

  return (
    <>
      <Type name={clientType}>
        {`typeof client<${TResponse}, ${TError}, ${TRequest}>`}
      </Type>
      <Type name={factory.name}>
        {`
        {
          data: ${TData}
          error: ${TError}
          request: ${TRequest}
          pathParams: ${TPathParams}
          queryParams: ${TQueryParams}
          headerParams: ${THeaderParams}
          response: ${
          dataReturnType === 'data'
            ? TData
            : `Awaited<ReturnType<${clientType}>>`
        }
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
