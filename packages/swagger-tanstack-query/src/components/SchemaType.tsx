import { Type, usePlugin } from '@kubb/react'
import { useSchemas } from '@kubb/swagger/hooks'

import type { ReactNode } from 'react'
import type { PluginOptions } from '../types.ts'

type Props = {
  factory: {
    name: string
  }
}

export function SchemaType({ factory }: Props): ReactNode {
  const { options: { dataReturnType } } = usePlugin<PluginOptions>()

  const schemas = useSchemas()

  const [TData, TError, TRequest, TPathParams, TQueryParams, THeaderParams, TResponse] = [
    schemas.response.name,
    schemas.errors?.map((error) => error.name).join(' | ') || 'never',
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
          dataReturnType === 'full'
            ? `Awaited<ReturnType<${clientType}>>`
            : TData
        }
          unionResponse: Awaited<ReturnType<${clientType}>> | ${TData}
          client: {
            paramaters: Partial<Parameters<${clientType}>[0]>
            return: Awaited<ReturnType<${clientType}>>
          }
        }
        `}
      </Type>
    </>
  )
}
