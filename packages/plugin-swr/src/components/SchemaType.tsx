import { File, Type, useApp } from '@kubb/react'

import { useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import type { ReactNode } from 'react'
import type { PluginSwr } from '../types.ts'

type Props = {
  factory: {
    name: string
  }
}

export function SchemaType({ factory }: Props): ReactNode {
  const {
    plugin: {
      options: { dataReturnType },
    },
  } = useApp<PluginSwr>()
  const { getSchemas } = useOperationManager()
  const operation = useOperation()

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

  const clientType = `${factory.name}Client`

  return (
    <>
      <File.Source name={clientType} isTypeOnly>
        <Type name={clientType}>{`typeof client<${TResponse}, ${TError}, ${TRequest}>`}</Type>
      </File.Source>
      <File.Source name={factory.name} isTypeOnly>
        <Type name={factory.name}>
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
      </File.Source>
    </>
  )
}
