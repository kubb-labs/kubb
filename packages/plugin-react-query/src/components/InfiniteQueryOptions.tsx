import { getNestedAccessor } from '@kubb/core/utils'
import { isOptional } from '@kubb/oas'
import { Client } from '@kubb/plugin-client/components'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
import type { Infinite, PluginReactQuery } from '../types.ts'
import { QueryKey } from './QueryKey.tsx'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  typeSchemas: OperationSchemas
  paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginReactQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
  initialPageParam: Infinite['initialPageParam']
  cursorParam: Infinite['cursorParam']
  nextParam: Infinite['nextParam']
  previousParam: Infinite['previousParam']
  queryParam: Infinite['queryParam']
}

type GetParamsProps = {
  paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginReactQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas }: GetParamsProps) {
  if (paramsType === 'object') {
    return FunctionParams.factory({
      data: {
        mode: 'object',
        children: {
          ...getPathParams(typeSchemas.pathParams, {
            typed: true,
            casing: paramsCasing,
          }),
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
        },
      },
      config: {
        type: typeSchemas.request?.name
          ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }`
          : 'Partial<RequestConfig> & { client?: typeof fetch }',
        default: '{}',
      },
    })
  }

  return FunctionParams.factory({
    pathParams: typeSchemas.pathParams?.name
      ? {
          mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
          children: getPathParams(typeSchemas.pathParams, {
            typed: true,
            casing: paramsCasing,
          }),
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
    config: {
      type: typeSchemas.request?.name
        ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }`
        : 'Partial<RequestConfig> & { client?: typeof fetch }',
      default: '{}',
    },
  })
}

export function InfiniteQueryOptions({
  name,
  clientName,
  initialPageParam,
  cursorParam,
  nextParam,
  previousParam,
  typeSchemas,
  paramsCasing,
  paramsType,
  dataReturnType,
  pathParamsType,
  queryParam,
  queryKeyName,
}: Props): KubbNode {
  const queryFnDataType = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const errorType = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`
  const isInitialPageParamDefined = initialPageParam !== undefined && initialPageParam !== null
  const fallbackPageParamType =
    typeof initialPageParam === 'number'
      ? 'number'
      : typeof initialPageParam === 'string'
        ? initialPageParam.includes(' as ')
          ? (() => {
              const parts = initialPageParam.split(' as ')
              return parts[parts.length - 1] ?? 'unknown'
            })()
          : 'string'
        : typeof initialPageParam === 'boolean'
          ? 'boolean'
          : 'unknown'
  const queryParamType = queryParam && typeSchemas.queryParams?.name ? `${typeSchemas.queryParams?.name}['${queryParam}']` : undefined
  const pageParamType = queryParamType ? (isInitialPageParamDefined ? `NonNullable<${queryParamType}>` : queryParamType) : fallbackPageParamType

  const params = getParams({
    paramsType,
    paramsCasing,
    pathParamsType,
    typeSchemas,
  })
  const clientParams = Client.getParams({
    paramsCasing,
    typeSchemas,
    paramsType,
    pathParamsType,
    isConfigurable: true,
  })
  const queryKeyParams = QueryKey.getParams({
    pathParamsType,
    typeSchemas,
    paramsCasing,
  })

  // Determine if we should use the new nextParam/previousParam or fall back to legacy cursorParam behavior
  const hasNewParams = nextParam !== undefined || previousParam !== undefined

  let getNextPageParamExpr: string | undefined
  let getPreviousPageParamExpr: string | undefined

  if (hasNewParams) {
    // Use the new nextParam and previousParam
    if (nextParam) {
      const accessor = getNestedAccessor(nextParam, 'lastPage')
      if (accessor) {
        getNextPageParamExpr = `getNextPageParam: (lastPage) => ${accessor}`
      }
    }
    if (previousParam) {
      const accessor = getNestedAccessor(previousParam, 'firstPage')
      if (accessor) {
        getPreviousPageParamExpr = `getPreviousPageParam: (firstPage) => ${accessor}`
      }
    }
  } else if (cursorParam) {
    // Legacy behavior: use cursorParam for both next and previous
    getNextPageParamExpr = `getNextPageParam: (lastPage) => lastPage['${cursorParam}']`
    getPreviousPageParamExpr = `getPreviousPageParam: (firstPage) => firstPage['${cursorParam}']`
  } else {
    // Fallback behavior: page-based pagination
    if (dataReturnType === 'full') {
      getNextPageParamExpr =
        'getNextPageParam: (lastPage, _allPages, lastPageParam) => Array.isArray(lastPage.data) && lastPage.data.length === 0 ? undefined : lastPageParam + 1'
    } else {
      getNextPageParamExpr =
        'getNextPageParam: (lastPage, _allPages, lastPageParam) => Array.isArray(lastPage) && lastPage.length === 0 ? undefined : lastPageParam + 1'
    }
    getPreviousPageParamExpr = 'getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => firstPageParam <= 1 ? undefined : firstPageParam - 1'
  }

  const queryOptions = [
    `initialPageParam: ${typeof initialPageParam === 'string' ? JSON.stringify(initialPageParam) : initialPageParam}`,
    getNextPageParamExpr,
    getPreviousPageParamExpr,
  ].filter(Boolean)

  const infiniteOverrideParams =
    queryParam && typeSchemas.queryParams?.name
      ? `
          params = {
            ...(params ?? {}),
            ['${queryParam}']: pageParam as unknown as ${typeSchemas.queryParams?.name}['${queryParam}'],
          } as ${typeSchemas.queryParams?.name}`
      : ''

  const enabled = Object.entries(queryKeyParams.flatParams)
    .map(([key, item]) => (item && !item.optional ? key : undefined))
    .filter(Boolean)
    .join('&& ')

  const enabledText = enabled ? `enabled: !!(${enabled}),` : ''

  if (infiniteOverrideParams) {
    return (
      <File.Source name={name} isExportable isIndexable>
        <Function name={name} export params={params.toConstructor()}>
          {`
      const queryKey = ${queryKeyName}(${queryKeyParams.toCall()})
      return infiniteQueryOptions<${queryFnDataType}, ${errorType}, InfiniteData<${queryFnDataType}>, typeof queryKey, ${pageParamType}>({
       ${enabledText}
       queryKey,
       queryFn: async ({ signal, pageParam }) => {
          config.signal = signal
          ${infiniteOverrideParams}
          return ${clientName}(${clientParams.toCall()})
       },
       ${queryOptions.join(',\n')}
      })
`}
        </Function>
      </File.Source>
    )
  }

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={params.toConstructor()}>
        {`
      const queryKey = ${queryKeyName}(${queryKeyParams.toCall()})
      return infiniteQueryOptions<${queryFnDataType}, ${errorType}, InfiniteData<${queryFnDataType}>, typeof queryKey, ${pageParamType}>({
       ${enabledText}
       queryKey,
       queryFn: async ({ signal }) => {
          config.signal = signal
          return ${clientName}(${clientParams.toCall()})
       },
       ${queryOptions.join(',\n')}
      })
`}
      </Function>
    </File.Source>
  )
}

InfiniteQueryOptions.getParams = getParams
