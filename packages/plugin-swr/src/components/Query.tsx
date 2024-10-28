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
  queryKeyTypeName: string
  typeSchemas: OperationSchemas
  paramsType: PluginSwr['resolvedOptions']['paramsType']
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
  operation: Operation
}

type GetParamsProps = {
  paramsType: PluginSwr['resolvedOptions']['paramsType']
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
  queryKeyTypeName: string
  typeSchemas: OperationSchemas
}

function getParams({ paramsType, pathParamsType, dataReturnType, typeSchemas, queryKeyTypeName }: GetParamsProps) {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`

  if (paramsType === 'object') {
    return FunctionParams.factory({
      data: {
        mode: 'object',
        children: {
          ...getPathParams(typeSchemas.pathParams, { typed: true }),
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
        },
      },
      options: {
        type: `
{
  query?: Parameters<typeof useSWR<${[TData, typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error', `${queryKeyTypeName} | null`].join(', ')}, any>>[2],
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>>` : 'Partial<RequestConfig>'},
  shouldFetch?: boolean,
}
`,
        default: '{}',
      },
    })
  }

  return FunctionParams.factory({
    pathParams: typeSchemas.pathParams?.name
      ? {
          mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
          children: getPathParams(typeSchemas.pathParams, { typed: true }),
          type: typeSchemas.pathParams?.name,
          optional: isOptional(typeSchemas.pathParams?.schema),
        }
      : undefined,
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
  query?: Parameters<typeof useSWR<${[TData, typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error', `${queryKeyTypeName} | null`].join(', ')}, any>>[2],
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>>` : 'Partial<RequestConfig>'},
  shouldFetch?: boolean,
}
`,
      default: '{}',
    },
  })
}

export function Query({
  name,
  typeSchemas,
  queryKeyName,
  queryKeyTypeName,
  queryOptionsName,
  operation,
  dataReturnType,
  paramsType,
  pathParamsType,
}: Props): ReactNode {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const generics = [TData, typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error', `${queryKeyTypeName} | null`]

  const queryKeyParams = QueryKey.getParams({
    pathParamsType,
    typeSchemas,
  })
  const params = getParams({
    paramsType,
    pathParamsType,
    dataReturnType,
    typeSchemas,
    queryKeyTypeName,
  })

  const queryOptionsParams = QueryOptions.getParams({
    paramsType,
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

       return useSWR<${generics.join(', ')}>(
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
