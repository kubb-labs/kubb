import { isOptional, type Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
import type { PluginSvelteQuery } from '../types.ts'
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
  paramsCasing: PluginSvelteQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginSvelteQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginSvelteQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginSvelteQuery['resolvedOptions']['client']['dataReturnType']
}

type GetParamsProps = {
  paramsCasing: PluginSvelteQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginSvelteQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginSvelteQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginSvelteQuery['resolvedOptions']['client']['dataReturnType']
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
    }

    // Check if all children are optional or undefined
    const allChildrenOptional = Object.values(children).every((child) => !child || child.optional)

    return FunctionParams.factory({
      data: {
        mode: 'object',
        children,
        default: allChildrenOptional ? '{}' : undefined,
      },
      options: {
        type: `
{
  query?: Partial<CreateBaseQueryOptions<${[TData, TError, 'TData', 'TQueryData', 'TQueryKey'].join(', ')}>> & { client?: QueryClient },
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }` : 'Partial<RequestConfig> & { client?: typeof fetch }'}
}
`,
        default: '{}',
      },
    })
  }

  const pathParamsChildren = getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing })

  const pathParamsParam = typeSchemas.pathParams?.name
    ? {
        mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
        children: pathParamsChildren,
        optional: isOptional(typeSchemas.pathParams?.schema),
      }
    : undefined

  const dataParam = typeSchemas.request?.name
    ? {
        type: typeSchemas.request?.name,
        optional: isOptional(typeSchemas.request?.schema),
      }
    : undefined

  const paramsParam = typeSchemas.queryParams?.name
    ? {
        type: typeSchemas.queryParams?.name,
        optional: isOptional(typeSchemas.queryParams?.schema),
      }
    : undefined

  const headersParam = typeSchemas.headerParams?.name
    ? {
        type: typeSchemas.headerParams?.name,
        optional: isOptional(typeSchemas.headerParams?.schema),
      }
    : undefined

  // Check if all params are optional
  const allParamsOptional =
    (!dataParam || dataParam.optional) &&
    (!paramsParam || paramsParam.optional) &&
    (!headersParam || headersParam.optional) &&
    (!pathParamsParam || (pathParamsParam.optional && Object.values(pathParamsChildren).every((child) => !child || child.optional)))

  return FunctionParams.factory({
    pathParams: pathParamsParam,
    data: dataParam ? { ...dataParam, default: allParamsOptional ? '{}' : undefined } : undefined,
    params: paramsParam ? { ...paramsParam, default: allParamsOptional ? '{}' : undefined } : undefined,
    headers: headersParam ? { ...headersParam, default: allParamsOptional ? '{}' : undefined } : undefined,
    options: {
      type: `
{
  query?: Partial<CreateBaseQueryOptions<${[TData, TError, 'TData', 'TQueryData', 'TQueryKey'].join(', ')}>> & { client?: QueryClient },
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
  const returnType = `CreateQueryResult<${['TData', TError].join(', ')}> & { queryKey: TQueryKey }`
  const generics = [`TData = ${TData}`, `TQueryData = ${TData}`, `TQueryKey extends QueryKey = ${queryKeyTypeName}`]

  const queryKeyParams = QueryKey.getParams({
    pathParamsType,
    paramsCasing,
    typeSchemas,
  })
  const queryOptionsParams = QueryOptions.getParams({
    paramsType,
    paramsCasing,
    pathParamsType,
    typeSchemas,
  })
  const params = getParams({
    paramsType,
    paramsCasing,
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

       const query = createQuery({
        ...${queryOptions},
        queryKey,
        ...queryOptions
       } as unknown as CreateBaseQueryOptions, queryClient) as ${returnType}

       query.queryKey = queryKey as TQueryKey

       return query
       `}
      </Function>
    </File.Source>
  )
}

Query.getParams = getParams
