import { File, Function, FunctionParams } from '@kubb/react'

import { type Operation, isOptional } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import type { PluginReactQuery } from '@kubb/plugin-react-query'
import type { ReactNode } from 'react'
import type { PluginVueQuery } from '../types.ts'
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
  operation: Operation
  paramsType: PluginVueQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginVueQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
}

type GetParamsProps = {
  paramsType: PluginVueQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginVueQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
  typeSchemas: OperationSchemas
}

function getParams({ paramsType, pathParamsType, dataReturnType, typeSchemas }: GetParamsProps) {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`

  if (paramsType === 'object') {
    return FunctionParams.factory({
      data: {
        mode: 'object',
        children: {
          ...getPathParams(typeSchemas.pathParams, {
            typed: true,
            override(item) {
              return {
                ...item,
                type: `MaybeRef<${item.type}>`,
              }
            },
          }),
          data: typeSchemas.request?.name
            ? {
                type: `MaybeRef<${typeSchemas.request?.name}>`,
                optional: isOptional(typeSchemas.request?.schema),
              }
            : undefined,
          params: typeSchemas.queryParams?.name
            ? {
                type: `MaybeRef<${typeSchemas.queryParams?.name}>`,
                optional: isOptional(typeSchemas.queryParams?.schema),
              }
            : undefined,
          headers: typeSchemas.headerParams?.name
            ? {
                type: `MaybeRef<${typeSchemas.headerParams?.name}>`,
                optional: isOptional(typeSchemas.headerParams?.schema),
              }
            : undefined,
        },
      },
      options: {
        type: `
{
  query?: Partial<QueryObserverOptions<${[TData, typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error', 'TData', 'TQueryData', 'TQueryKey'].join(', ')}>>,
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>>` : 'Partial<RequestConfig>'}
}
`,
        default: '{}',
      },
    })
  }

  return FunctionParams.factory({
    pathParams: {
      mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
      optional: isOptional(typeSchemas.pathParams?.schema),
      children: getPathParams(typeSchemas.pathParams, {
        typed: true,
        override(item) {
          return {
            ...item,
            type: `MaybeRef<${item.type}>`,
          }
        },
      }),
    },
    data: typeSchemas.request?.name
      ? {
          type: `MaybeRef<${typeSchemas.request?.name}>`,
          optional: isOptional(typeSchemas.request?.schema),
        }
      : undefined,
    params: typeSchemas.queryParams?.name
      ? {
          type: `MaybeRef<${typeSchemas.queryParams?.name}>`,
          optional: isOptional(typeSchemas.queryParams?.schema),
        }
      : undefined,
    headers: typeSchemas.headerParams?.name
      ? {
          type: `MaybeRef<${typeSchemas.headerParams?.name}>`,
          optional: isOptional(typeSchemas.headerParams?.schema),
        }
      : undefined,
    options: {
      type: `
{
  query?: Partial<QueryObserverOptions<${[TData, typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error', 'TData', 'TQueryData', 'TQueryKey'].join(', ')}>>,
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>>` : 'Partial<RequestConfig>'}
}
`,
      default: '{}',
    },
  })
}

export function Query({
  name,
  queryKeyTypeName,
  queryOptionsName,
  queryKeyName,
  paramsType,
  pathParamsType,
  dataReturnType,
  typeSchemas,
  operation,
}: Props): ReactNode {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const returnType = `UseQueryReturnType<${['TData', typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'].join(', ')}> & { queryKey: TQueryKey }`
  const generics = [`TData = ${TData}`, `TQueryData = ${TData}`, `TQueryKey extends QueryKey = ${queryKeyTypeName}`]

  const queryKeyParams = QueryKey.getParams({
    pathParamsType,
    typeSchemas,
  })
  const queryOptionsParams = QueryOptions.getParams({
    paramsType,
    pathParamsType,
    typeSchemas,
  })
  const params = getParams({
    paramsType,
    pathParamsType,
    dataReturnType,
    typeSchemas,
  })

  const queryOptions = `${queryOptionsName}(${queryOptionsParams.toCall()}) as unknown as QueryObserverOptions`

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        name={name}
        export
        generics={generics.join(', ')}
        params={params.toConstructor()}
        JSDoc={{
          comments: getComments(operation),
        }}
      >
        {`
       const { query: queryOptions, client: config = {} } = options ?? {}
       const queryKey = queryOptions?.queryKey ?? ${queryKeyName}(${queryKeyParams.toCall()})

       const query = useQuery({
        ...${queryOptions},
        queryKey: queryKey as QueryKey,
        ...queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">
       }) as ${returnType}

       query.queryKey = queryKey as TQueryKey

       return query
       `}
      </Function>
    </File.Source>
  )
}

Query.getParams = getParams
