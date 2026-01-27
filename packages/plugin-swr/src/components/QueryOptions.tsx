import { getDefaultValue, isOptional } from '@kubb/oas'
import { Client } from '@kubb/plugin-client/components'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { PluginSwr } from '../types.ts'

type Props = {
  name: string
  clientName: string
  typeSchemas: OperationSchemas
  paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
  paramsType: PluginSwr['resolvedOptions']['paramsType']
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
}

type GetParamsProps = {
  paramsType: PluginSwr['resolvedOptions']['paramsType']
  paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas }: GetParamsProps) {
  if (paramsType === 'object') {
    const pathParams = getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing })

    return FunctionParams.factory({
      data: {
        mode: 'object',
        children: {
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
          children: getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
          default: getDefaultValue(typeSchemas.pathParams?.schema),
        }
      : undefined,
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
    config: {
      type: typeSchemas.request?.name
        ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }`
        : 'Partial<RequestConfig> & { client?: typeof fetch }',
      default: '{}',
    },
  })
}

export function QueryOptions({ name, clientName, typeSchemas, paramsCasing, paramsType, pathParamsType }: Props): FabricReactNode {
  const params = getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas })
  const clientParams = Client.getParams({
    paramsCasing,
    paramsType,
    typeSchemas,
    pathParamsType,
    isConfigurable: true,
  })

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={params.toConstructor()}>
        {`
      return {
        fetcher: async () => {
          return ${clientName}(${clientParams.toCall()})
        },
      }
      `}
      </Function>
    </File.Source>
  )
}

QueryOptions.getParams = getParams
