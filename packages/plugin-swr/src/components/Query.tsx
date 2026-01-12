import { isOptional, type Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
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
  paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
  paramsType: PluginSwr['resolvedOptions']['paramsType']
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
  operation: Operation
}

type GetParamsProps = {
  paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
  paramsType: PluginSwr['resolvedOptions']['paramsType']
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
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
  query?: Parameters<typeof useSWR<${[TData, TError].join(', ')}>>[2],
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }` : 'Partial<RequestConfig> & { client?: typeof fetch }'},
  shouldFetch?: boolean,
  immutable?: boolean
}
`,
        default: '{}',
      },
    })
  }

  const pathParamsChildren = getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing })
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
          type: typeSchemas.request?.name,
          default: dataOptional ? '{}' : undefined,
        }
      : undefined,
    params: typeSchemas.queryParams?.name
      ? {
          type: typeSchemas.queryParams?.name,
          default: paramsOptional ? '{}' : undefined,
        }
      : undefined,
    headers: typeSchemas.headerParams?.name
      ? {
          type: typeSchemas.headerParams?.name,
          default: headersOptional ? '{}' : undefined,
        }
      : undefined,
    options: {
      type: `
{
  query?: Parameters<typeof useSWR<${[TData, TError].join(', ')}>>[2],
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }` : 'Partial<RequestConfig> & { client?: typeof fetch }'},
  shouldFetch?: boolean,
  immutable?: boolean
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
  paramsCasing,
  pathParamsType,
}: Props): KubbNode {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`
  const generics = [TData, TError, `${queryKeyTypeName} | null`]

  const queryKeyParams = QueryKey.getParams({
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

  const queryOptionsParams = QueryOptions.getParams({
    paramsCasing,
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
       const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

       const queryKey = ${queryKeyName}(${queryKeyParams.toCall()})

       return useSWR<${generics.join(', ')}>(
        shouldFetch ? queryKey : null,
        {
          ...${queryOptionsName}(${queryOptionsParams.toCall()}),
          ...(immutable ? {
              revalidateIfStale: false,
              revalidateOnFocus: false,
              revalidateOnReconnect: false
            } : { }),
          ...queryOptions
        }
       )
       `}
      </Function>
    </File.Source>
  )
}
