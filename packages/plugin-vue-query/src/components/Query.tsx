import { isOptional, type Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
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
  paramsCasing: PluginVueQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginVueQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginVueQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
}

type GetParamsProps = {
  paramsCasing: PluginVueQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginVueQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginVueQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
  typeSchemas: OperationSchemas
}

function getParams({ paramsCasing, paramsType, pathParamsType, dataReturnType, typeSchemas }: GetParamsProps) {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`

  if (paramsType === 'object') {
    const pathParams = getPathParams(typeSchemas.pathParams, {
      typed: true,
      casing: paramsCasing,
      override(item) {
        return {
          ...item,
          type: `MaybeRefOrGetter<${item.type}>`,
        }
      },
    })
    const children = {
      ...pathParams,
      data: typeSchemas.request?.name
        ? {
            type: `MaybeRefOrGetter<${typeSchemas.request?.name}>`,
            default: isOptional(typeSchemas.request?.schema) ? '{}' : undefined,
          }
        : undefined,
      params: typeSchemas.queryParams?.name
        ? {
            type: `MaybeRefOrGetter<${typeSchemas.queryParams?.name}>`,
            default: isOptional(typeSchemas.queryParams?.schema) ? '{}' : undefined,
          }
        : undefined,
      headers: typeSchemas.headerParams?.name
        ? {
            type: `MaybeRefOrGetter<${typeSchemas.headerParams?.name}>`,
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
  query?: Partial<UseQueryOptions<${[TData, TError, 'TData', 'TQueryData', 'TQueryKey'].join(', ')}>> & { client?: QueryClient },
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }` : 'Partial<RequestConfig> & { client?: typeof fetch }'}
}
`,
        default: '{}',
      },
    })
  }

  const pathParamsChildren = getPathParams(typeSchemas.pathParams, {
    typed: true,
    casing: paramsCasing,
    override(item) {
      return {
        ...item,
        type: `MaybeRefOrGetter<${item.type}>`,
      }
    },
  })
  const pathParamsOptional = typeSchemas.pathParams?.name ? isOptional(typeSchemas.pathParams?.schema) : false
  const dataOptional = typeSchemas.request?.name ? isOptional(typeSchemas.request?.schema) : false
  const paramsOptional = typeSchemas.queryParams?.name ? isOptional(typeSchemas.queryParams?.schema) : false
  const headersOptional = typeSchemas.headerParams?.name ? isOptional(typeSchemas.headerParams?.schema) : false

  return FunctionParams.factory({
    pathParams: typeSchemas.pathParams?.name
      ? {
          mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
          children: pathParamsChildren,
          default: pathParamsOptional ? '{}' : undefined,
        }
      : undefined,
    data: typeSchemas.request?.name
      ? {
          type: `MaybeRefOrGetter<${typeSchemas.request?.name}>`,
          default: dataOptional ? '{}' : undefined,
        }
      : undefined,
    params: typeSchemas.queryParams?.name
      ? {
          type: `MaybeRefOrGetter<${typeSchemas.queryParams?.name}>`,
          default: paramsOptional ? '{}' : undefined,
        }
      : undefined,
    headers: typeSchemas.headerParams?.name
      ? {
          type: `MaybeRefOrGetter<${typeSchemas.headerParams?.name}>`,
          default: headersOptional ? '{}' : undefined,
        }
      : undefined,
    options: {
      type: `
{
  query?: Partial<UseQueryOptions<${[TData, TError, 'TData', 'TQueryData', 'TQueryKey'].join(', ')}>> & { client?: QueryClient },
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
}: Props): KubbNode {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`
  const returnType = `UseQueryReturnType<${['TData', TError].join(', ')}> & { queryKey: TQueryKey }`
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
       const queryKey = (queryOptions && 'queryKey' in queryOptions ? toValue(queryOptions.queryKey) : undefined) ?? ${queryKeyName}(${queryKeyParams.toCall()})

       const query = useQuery({
        ...${queryOptions},
        ...queryOptions,
        queryKey
       } as unknown as UseQueryOptions<${TData}, ${TError}, TData, ${TData}, TQueryKey>, toValue(queryClient)) as ${returnType}

       query.queryKey = queryKey as TQueryKey

       return query
       `}
      </Function>
    </File.Source>
  )
}

Query.getParams = getParams
