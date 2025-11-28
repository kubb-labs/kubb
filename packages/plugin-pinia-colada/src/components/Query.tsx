import { isOptional, type Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
import type { PluginPiniaColada } from '../types.ts'
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
  paramsCasing: PluginPiniaColada['resolvedOptions']['paramsCasing']
  paramsType: PluginPiniaColada['resolvedOptions']['paramsType']
  pathParamsType: PluginPiniaColada['resolvedOptions']['pathParamsType']
  dataReturnType: PluginPiniaColada['resolvedOptions']['client']['dataReturnType']
}

type GetParamsProps = {
  paramsCasing: PluginPiniaColada['resolvedOptions']['paramsCasing']
  paramsType: PluginPiniaColada['resolvedOptions']['paramsType']
  pathParamsType: PluginPiniaColada['resolvedOptions']['pathParamsType']
  dataReturnType: PluginPiniaColada['resolvedOptions']['client']['dataReturnType']
  typeSchemas: OperationSchemas
}

function getParams({ paramsCasing, paramsType, pathParamsType, dataReturnType, typeSchemas }: GetParamsProps) {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`

  if (paramsType === 'object') {
    return FunctionParams.factory({
      data: {
        mode: 'object',
        children: {
          ...getPathParams(typeSchemas.pathParams, {
            typed: true,
            casing: paramsCasing,
            override(item) {
              return {
                ...item,
                type: `MaybeRefOrGetter<${item.type}>`,
              }
            },
          }),
          data: typeSchemas.request?.name
            ? {
                type: `MaybeRefOrGetter<${typeSchemas.request?.name}>`,
                optional: isOptional(typeSchemas.request?.schema),
              }
            : undefined,
          params: typeSchemas.queryParams?.name
            ? {
                type: `MaybeRefOrGetter<${typeSchemas.queryParams?.name}>`,
                optional: isOptional(typeSchemas.queryParams?.schema),
              }
            : undefined,
          headers: typeSchemas.headerParams?.name
            ? {
                type: `MaybeRefOrGetter<${typeSchemas.headerParams?.name}>`,
                optional: isOptional(typeSchemas.headerParams?.schema),
              }
            : undefined,
        },
      },
      options: {
        type: `
{
  query?: Partial<UseQueryOptions<${[TData, TError].join(', ')}>>,
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }` : 'Partial<RequestConfig> & { client?: typeof fetch }'}
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
        casing: paramsCasing,
        override(item) {
          return {
            ...item,
            type: `MaybeRefOrGetter<${item.type}>`,
          }
        },
      }),
    },
    data: typeSchemas.request?.name
      ? {
          type: `MaybeRefOrGetter<${typeSchemas.request?.name}>`,
          optional: isOptional(typeSchemas.request?.schema),
        }
      : undefined,
    params: typeSchemas.queryParams?.name
      ? {
          type: `MaybeRefOrGetter<${typeSchemas.queryParams?.name}>`,
          optional: isOptional(typeSchemas.queryParams?.schema),
        }
      : undefined,
    headers: typeSchemas.headerParams?.name
      ? {
          type: `MaybeRefOrGetter<${typeSchemas.headerParams?.name}>`,
          optional: isOptional(typeSchemas.headerParams?.schema),
        }
      : undefined,
    options: {
      type: `
{
  query?: Partial<UseQueryOptions<${[TData, TError].join(', ')}>>,
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
  const returnType = `UseQueryReturn<${[TData, TError].join(', ')}>`
  const generics = [`TData = ${TData}`]

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
       const { query: queryOptions = {}, client: config = {} } = options ?? {}
       const queryKey = queryOptions?.key ?? ${queryKeyName}(${queryKeyParams.toCall()})

       const query = useQuery({
        ...${queryOptions},
        ...queryOptions,
        key: queryKey,
       }) as ${returnType}

       return query
       `}
      </Function>
    </File.Source>
  )
}

Query.getParams = getParams
