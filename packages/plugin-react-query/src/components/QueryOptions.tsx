import { isOptional } from '@kubb/oas'
import { Client } from '@kubb/plugin-client/components'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
import type { PluginReactQuery } from '../types.ts'
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
}

type GetParamsProps = {
  paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginReactQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas }: GetParamsProps) {
  if (paramsType === 'object') {
    const children = {
      ...getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
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

    const allChildrenOptional = Object.values(children).every((child) => !child || child.optional)

    return FunctionParams.factory({
      data: {
        mode: 'object',
        children,
        default: allChildrenOptional ? '{}' : undefined,
      },
      config: {
        type: typeSchemas.request?.name
          ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }`
          : 'Partial<RequestConfig> & { client?: typeof fetch }',
        default: '{}',
      },
    })
  }

  const pathParamsChildren = getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing })

  const pathParamsParam = typeSchemas.pathParams?.name
    ? {
        mode: pathParamsType === 'object' ? ('object' as const) : ('inlineSpread' as const),
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
  const dataOptional = typeSchemas.request?.name ? isOptional(typeSchemas.request?.schema) : false
  const paramsOptional = typeSchemas.queryParams?.name ? isOptional(typeSchemas.queryParams?.schema) : false
  const headersOptional = typeSchemas.headerParams?.name ? isOptional(typeSchemas.headerParams?.schema) : false

  const paramsParam = typeSchemas.queryParams?.name
    ? {
        type: typeSchemas.queryParams?.name,
        optional: paramsOptional,
        default: paramsOptional ? '{}' : undefined,
      }
    : undefined

  const headersParam = typeSchemas.headerParams?.name
    ? {
        type: typeSchemas.headerParams?.name,
        optional: headersOptional,
        default: headersOptional ? '{}' : undefined,
      }
    : undefined

  return FunctionParams.factory({
    pathParams: pathParamsParam,
    data: dataParam ? { ...dataParam, default: dataOptional ? '{}' : undefined } : undefined,
    params: paramsParam,
    headers: headersParam,
    config: {
      type: typeSchemas.request?.name
        ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }`
        : 'Partial<RequestConfig> & { client?: typeof fetch }',
      optional: true,
      default: '{}',
    },
  })
}

export function QueryOptions({ name, clientName, dataReturnType, typeSchemas, paramsCasing, paramsType, pathParamsType, queryKeyName }: Props): KubbNode {
  const params = getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas })
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'

  const clientParams = Client.getParams({
    typeSchemas,
    paramsCasing,
    paramsType,
    pathParamsType,
    isConfigurable: true,
  })
  const queryKeyParams = QueryKey.getParams({
    pathParamsType,
    typeSchemas,
    paramsCasing,
  })

  const enabled = Object.entries(queryKeyParams.flatParams)
    .map(([key, item]) => (item && !item.optional ? key : undefined))
    .filter(Boolean)
    .join('&& ')

  const enabledText = enabled ? `enabled: !!(${enabled}),` : ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={params.toConstructor()}>
        {`
      const queryKey = ${queryKeyName}(${queryKeyParams.toCall()})
      return queryOptions<${TData}, ResponseErrorConfig<${TError}>, ${TData}, typeof queryKey>({
       ${enabledText}
       queryKey,
       queryFn: async ({ signal }) => {
          config.signal = signal
          return ${clientName}(${clientParams.toCall({})})
       },
      })
`}
      </Function>
    </File.Source>
  )
}

QueryOptions.getParams = getParams
