import { URLPath } from '@kubb/core/utils'
import { File, Function, FunctionParams } from '@kubb/react'

import { type Operation, isOptional } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import type { ReactNode } from 'react'
import type { PluginSwr } from '../types.ts'
import { QueryKey } from './QueryKey.tsx'
import { QueryOptions } from './QueryOptions.tsx'

type Props = {
  /**
   * Name of the function
   */
  name: string
  queryOptionsName: string
  queryKeyName: string
  typeSchemas: OperationSchemas
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
  operation: Operation
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
    data: typeSchemas.request?.name
      ? {
          type: typeSchemas.request?.name,
          optional: isOptional(typeSchemas.request?.schema),
        }
      : undefined,
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
  query?: SWRConfiguration<${[TData, typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'].join(', ')}>,
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>>` : 'Partial<RequestConfig>'},
  shouldFetch?: boolean,
}
`,
      default: '{}',
    },
  })
}

export function Query({ name, typeSchemas, queryKeyName, queryOptionsName, operation, dataReturnType, pathParamsType }: Props): ReactNode {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const hookGenerics = [TData, typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error', 'Key']

  const queryKeyParams = QueryKey.getParams({
    pathParamsType,
    typeSchemas,
  })
  const params = getParams({
    pathParamsType,
    dataReturnType,
    typeSchemas,
  })

  const queryOptionsParams = QueryOptions.getParams({
    pathParamsType,
    typeSchemas,
  })

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
       const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}

       const queryKey = ${queryKeyName}(${queryKeyParams.toCall()})

       return useSWR<${hookGenerics.join(', ')}>(
        shouldFetch ? queryKey : null,
        {
          ...${queryOptionsName}(${queryOptionsParams.toCall()})
          ...queryOptions
        }
       )
       `}
      </Function>
    </File.Source>
  )
}
