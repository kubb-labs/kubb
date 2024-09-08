import { URLPath } from '@kubb/core/utils'
import { File, Function, FunctionParams } from '@kubb/react'

import { type Operation, isOptional } from '@kubb/oas'
import { Client } from '@kubb/plugin-client/components'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import type { ReactNode } from 'react'
import type { PluginSwr } from '../types.ts'

type Props = {
  /**
   * Name of the function
   */
  name: string
  typeName: string
  clientName: string
  typeSchemas: OperationSchemas
  operation: Operation
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
}

type GetParamsProps = {
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
  typeSchemas: OperationSchemas
}

function getParams({ pathParamsType, dataReturnType, typeSchemas }: GetParamsProps) {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`

  return FunctionParams.factory({
    pathParams: {
      mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
      children: getPathParams(typeSchemas.pathParams, { typed: true }),
    },
    params: typeSchemas.queryParams?.name
      ? {
          type: typeSchemas.queryParams?.name,
          optional: isOptional(typeSchemas.queryParams?.schema),
        }
      : undefined,
    headers: typeSchemas.headerParams?.name
      ? {
          type: typeSchemas.headerParams?.name,
          optional: isOptional(typeSchemas.headerParams?.schema),
        }
      : undefined,
    options: {
      type: `
{
  mutation?: SWRMutationConfiguration<${[TData, typeSchemas.errors?.map((item) => item.name).join(' | ') || 'unknown'].join(', ')}>,
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>>` : 'Partial<RequestConfig>'},
  shouldFetch?: boolean,
}
`,
      default: '{}',
    },
  })
}

export function Mutation({ name, clientName, pathParamsType, dataReturnType, typeSchemas, operation }: Props): ReactNode {
  const path = new URLPath(operation.path)
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const hookGenerics = [TData, typeSchemas.errors?.map((item) => item.name).join(' | ') || 'unknown', 'Key']

  const params = getParams({
    pathParamsType,
    dataReturnType,
    typeSchemas,
  })

  const clientParams = Client.getParams({
    typeSchemas,
    pathParamsType,
  })

  //fixed name, see Query.getParams and params
  const swrKey = [path.template, typeSchemas.queryParams?.name ? 'params' : undefined].filter(Boolean)

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        name={name}
        export
        params={params.toConstructor()}
        JSDoc={{
          comments: getComments(operation),
        }}
      >
        {`
      const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}

      const swrKey = [${swrKey.join(', ')}] as const
      return useSWRMutation<${hookGenerics}>(
        shouldFetch ? swrKey : null,
        async (_url${typeSchemas.request?.name ? ', { arg: data }' : ''}) => {
          return ${clientName}(${clientParams.toCall()})
        },
        mutationOptions
      )
    `}
      </Function>
    </File.Source>
  )
}
