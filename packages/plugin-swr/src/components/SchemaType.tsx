import { File, Type } from '@kubb/react'

import type { OperationSchemas } from '@kubb/plugin-oas'
import type { ReactNode } from 'react'

type Props = {
  typeName: string
  typedSchemas: OperationSchemas
  dataReturnType: 'data' | 'full'
}

export function SchemaType({ typeName, typedSchemas, dataReturnType }: Props): ReactNode {
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

  return (
    <>
      <File.Source name={clientType} isTypeOnly>
        <Type name={clientType}>{`typeof client<${TResponse}, ${TError}, ${TRequest}>`}</Type>
      </File.Source>
      <File.Source name={typeName} isTypeOnly>
        <Type name={typeName}>
          {`
        {
          data: ${TData}
          error: ${TError}
          request: ${TRequest}
          pathParams: ${TPathParams}
          queryParams: ${TQueryParams}
          headerParams: ${THeaderParams}
          response: ${dataReturnType === 'data' ? typedSchemas.response.name : `Awaited<ReturnType<${clientType}>>`}
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
