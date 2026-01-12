import { isOptional, type Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
import type { PluginReactQuery } from '../types.ts'
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
  paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginReactQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
  customOptions: PluginReactQuery['resolvedOptions']['customOptions']
}

type GetParamsProps = {
  paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginReactQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
  typeSchemas: OperationSchemas
}

function getParams({ paramsType, paramsCasing, pathParamsType, dataReturnType, typeSchemas }: GetParamsProps) {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`

  if (paramsType === 'object') {
    const pathParams = getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing })
    const children = {
      ...pathParams,
      data: typeSchemas.request?.name
        ? {
            type: typeSchemas.request?.name,
            default: isOptional(typeSchemas.request?.schema) ? '{}' : undefined,
          }
        : undefined,
      params: typeSchemas.queryParams?.name
        ? {
            type: typeSchemas.queryParams?.name,
            default: isOptional(typeSchemas.queryParams?.schema) ? '{}' : undefined,
          }
        : undefined,
      headers: typeSchemas.headerParams?.name
        ? {
            type: typeSchemas.headerParams?.name,
            default: isOptional(typeSchemas.headerParams?.schema) ? '{}' : undefined,
          }
        : undefined,
    }

    // Check if all children have defaults or are undefined
    const allChildrenHaveDefaults = Object.values(children).every((child) => !child || child.default !== undefined)

    return FunctionParams.factory({
      data: {
        mode: 'object',
        children,
        default: allChildrenHaveDefaults ? '{}' : undefined,
      },
      options: {
        type: `
{
  query?: Partial<QueryObserverOptions<${[TData, TError, 'TData', 'TQueryData', 'TQueryKey'].join(', ')}>> & { client?: QueryClient },
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }` : 'Partial<RequestConfig> & { client?: typeof fetch }'}
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
          children: getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
          default: isOptional(typeSchemas.pathParams?.schema) ? '{}' : undefined,
        }
      : undefined,
    data: typeSchemas.request?.name
      ? {
          type: typeSchemas.request?.name,
          default: isOptional(typeSchemas.request?.schema) ? '{}' : undefined,
        }
      : undefined,
    params: typeSchemas.queryParams?.name
      ? {
          type: typeSchemas.queryParams?.name,
          default: isOptional(typeSchemas.queryParams?.schema) ? '{}' : undefined,
        }
      : undefined,
    headers: typeSchemas.headerParams?.name
      ? {
          type: typeSchemas.headerParams?.name,
          default: isOptional(typeSchemas.headerParams?.schema) ? '{}' : undefined,
        }
      : undefined,
    options: {
      type: `
{
  query?: Partial<QueryObserverOptions<${[TData, TError, 'TData', 'TQueryData', 'TQueryKey'].join(', ')}>> & { client?: QueryClient },
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }` : 'Partial<RequestConfig> & { client?: typeof fetch }'}
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
  paramsCasing,
  pathParamsType,
  dataReturnType,
  typeSchemas,
  operation,
  customOptions,
}: Props): KubbNode {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`
  const returnType = `UseQueryResult<${['TData', TError].join(', ')}> & { queryKey: TQueryKey }`
  const generics = [`TData = ${TData}`, `TQueryData = ${TData}`, `TQueryKey extends QueryKey = ${queryKeyTypeName}`]

  const queryKeyParams = QueryKey.getParams({
    pathParamsType,
    typeSchemas,
    paramsCasing,
  })
  const queryOptionsParams = QueryOptions.getParams({
    paramsType,
    pathParamsType,
    typeSchemas,
    paramsCasing,
  })
  const params = getParams({
    paramsCasing,
    paramsType,
    pathParamsType,
    dataReturnType,
    typeSchemas,
  })

  const queryOptions = `${queryOptionsName}(${queryOptionsParams.toCall()})`

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
       const { query: queryConfig = {}, client: config = {} } = options ?? {}
       const { client: queryClient, ...queryOptions } = queryConfig
       const queryKey = queryOptions?.queryKey ?? ${queryKeyName}(${queryKeyParams.toCall()})
       ${customOptions ? `const customOptions = ${customOptions.name}({ hookName: '${name}', operationId: '${operation.getOperationId()}' })` : ''}

       const query = useQuery({
        ...${queryOptions},${customOptions ? '\n...customOptions,' : ''}
        queryKey,
        ...queryOptions
       } as unknown as QueryObserverOptions, queryClient) as ${returnType}

       query.queryKey = queryKey as TQueryKey

       return query
       `}
      </Function>
    </File.Source>
  )
}

Query.getParams = getParams
