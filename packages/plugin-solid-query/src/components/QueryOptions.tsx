import { isOptional } from '@kubb/oas'
import { Client } from '@kubb/plugin-client/components'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
import type { PluginSolidQuery } from '../types.ts'
import { QueryKey } from './QueryKey.tsx'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  typeSchemas: OperationSchemas
  paramsCasing: PluginSolidQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginSolidQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginSolidQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginSolidQuery['resolvedOptions']['client']['dataReturnType']
}

type GetParamsProps = {
  paramsCasing: PluginSolidQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginSolidQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginSolidQuery['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas }: GetParamsProps) {
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
      config: {
        type: typeSchemas.request?.name
          ? `() => Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }`
          : '() => Partial<RequestConfig> & { client?: typeof fetch }',
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
    config: {
      type: typeSchemas.request?.name
        ? `() => Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }`
        : '() => Partial<RequestConfig> & { client?: typeof fetch }',
      default: '() => ({})',
    },
  })
}

export function QueryOptions({ name, clientName, typeSchemas, paramsCasing, paramsType, dataReturnType, pathParamsType, queryKeyName }: Props): KubbNode {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`

  const params = getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas })
  const clientParams = Client.getParams({
    paramsCasing,
    typeSchemas,
    paramsType,
    pathParamsType,
    isConfigurable: true,
  })
  const queryKeyParams = QueryKey.getParams({
    pathParamsType,
    paramsCasing,
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
  
  const unwrappedClientCall = clientParams.toCall({
    transformName(name) {
      const param = params.flatParams[name]
      if (param && param.type?.startsWith('() =>')) {
        return `${name}?.()`
      }
      return name
    },
  })

  const enabled = Object.entries(queryKeyParams.flatParams)
    .map(([key, item]) => (item && !item.optional ? `${key}?.()` : undefined))
    .filter(Boolean)
    .join('&& ')

  const enabledText = enabled ? `enabled: !!(${enabled}),` : ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={params.toConstructor()}>
        {`
      const queryKey = ${queryKeyName}(${unwrappedQueryKeyCall})
      return queryOptions<${TData}, ${TError}, ${TData}, typeof queryKey>({
      ${enabledText}
       queryKey,
       queryFn: async ({ signal }) => {
          const unwrappedConfig = config?.() ?? {}
          unwrappedConfig.signal = signal
          return ${clientName}(${unwrappedClientCall})
       },
      })
`}
      </Function>
    </File.Source>
  )
}

QueryOptions.getParams = getParams
