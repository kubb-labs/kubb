import { isOptional, type Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
import type { PluginSolidQuery } from '../types.ts'
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
  paramsCasing: PluginSolidQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginSolidQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginSolidQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginSolidQuery['resolvedOptions']['client']['dataReturnType']
}

type GetParamsProps = {
  paramsCasing: PluginSolidQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginSolidQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginSolidQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginSolidQuery['resolvedOptions']['client']['dataReturnType']
  typeSchemas: OperationSchemas
}

function getParams({ paramsType, paramsCasing, pathParamsType, dataReturnType, typeSchemas }: GetParamsProps) {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`

  if (paramsType === 'object') {
    // Wrap pathParams in accessor functions for Solid reactivity
    const pathParamsChildren = typeSchemas.pathParams 
      ? Object.fromEntries(
          Object.entries(getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }))
            .map(([key, value]) => [key, value ? { ...value, type: `() => ${value.type}` } : value])
        )
      : {}
    
    return FunctionParams.factory({
      data: {
        mode: 'object',
        children: {
          ...pathParamsChildren,
          data: typeSchemas.request?.name
            ? {
                type: `() => ${typeSchemas.request?.name}`,
                optional: isOptional(typeSchemas.request?.schema),
              }
            : undefined,
          params: typeSchemas.queryParams?.name
            ? {
                type: `() => ${typeSchemas.queryParams?.name}`,
                optional: isOptional(typeSchemas.queryParams?.schema),
              }
            : undefined,
          headers: typeSchemas.headerParams?.name
            ? {
                type: `() => ${typeSchemas.headerParams?.name}`,
                optional: isOptional(typeSchemas.headerParams?.schema),
              }
            : undefined,
        },
      },
      options: {
        type: `() => 
{
  query?: Partial<UseBaseQueryOptions<${[TData, TError, 'TData', 'TQueryData', 'TQueryKey'].join(', ')}>> & { client?: QueryClient },
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }` : 'Partial<RequestConfig> & { client?: typeof fetch }'}
}
`,
        default: '() => ({})',
      },
    })
  }

  return FunctionParams.factory({
    pathParams: typeSchemas.pathParams?.name
      ? {
          mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
          children: getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
          optional: isOptional(typeSchemas.pathParams?.schema),
        }
      : undefined,
    data: typeSchemas.request?.name
      ? {
          type: `() => ${typeSchemas.request?.name}`,
          optional: isOptional(typeSchemas.request?.schema),
        }
      : undefined,
    params: typeSchemas.queryParams?.name
      ? {
          type: `() => ${typeSchemas.queryParams?.name}`,
          optional: isOptional(typeSchemas.queryParams?.schema),
        }
      : undefined,
    headers: typeSchemas.headerParams?.name
      ? {
          type: `() => ${typeSchemas.headerParams?.name}`,
          optional: isOptional(typeSchemas.headerParams?.schema),
        }
      : undefined,
    options: {
      type: `() => 
{
  query?: Partial<UseBaseQueryOptions<${[TData, TError, 'TData', 'TQueryData', 'TQueryKey'].join(', ')}>> & { client?: QueryClient },
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }` : 'Partial<RequestConfig> & { client?: typeof fetch }'}
}
`,
      default: '() => ({})',
    },
  })
}

export function Query({
  name,
  queryKeyTypeName,
  queryOptionsName,
  queryKeyName,
  paramsCasing,
  paramsType,
  pathParamsType,
  dataReturnType,
  typeSchemas,
  operation,
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
    paramsCasing,
    pathParamsType,
    typeSchemas,
  })
  const params = getParams({
    paramsCasing,
    paramsType,
    pathParamsType,
    dataReturnType,
    typeSchemas,
  })

  // Build the unwrapped parameter calls using transformName to call accessor functions
  const unwrappedQueryKeyCall = queryKeyParams.toCall({
    transformName(name) {
      const param = params.flatParams[name]
      if (param && param.type?.startsWith('() =>')) {
        return `${name}?.()`
      }
      return name
    },
  })
  
  const unwrappedQueryOptionsCall = queryOptionsParams.toCall({
    transformName(name) {
      const param = params.flatParams[name]
      if (param && param.type?.startsWith('() =>')) {
        return `${name}?.()`
      }
      return name
    },
  })

  const queryOptions = `${queryOptionsName}(${unwrappedQueryOptionsCall}) as unknown as UseBaseQueryOptions`

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
       const { query: queryConfig = {}, client: config = {} } = options?.() ?? {}
       const { client: queryClient, ...queryOptions } = queryConfig
       const queryKey = queryOptions?.queryKey ?? ${queryKeyName}(${unwrappedQueryKeyCall})

       const query = useQuery(() => ({
        ...${queryOptions},
        queryKey,
        initialData: null,
        ...queryOptions as unknown as Omit<UseBaseQueryOptions, "queryKey">
       }), queryClient? () => queryClient: undefined) as ${returnType}

       return query
       `}
      </Function>
    </File.Source>
  )
}

Query.getParams = getParams
