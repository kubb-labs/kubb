import { URLPath } from '@kubb/core/utils'

import { getDefaultValue, type Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { Const, File, Function, FunctionParams } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { PluginClient } from '../types.ts'

type Props = {
  /**
   * Name of the function
   */
  name: string
  isExportable?: boolean
  isIndexable?: boolean

  baseURL: string | undefined
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['pathParamsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
  operation: Operation
}

type GetParamsProps = {
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['paramsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
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
        },
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
  })
}

export function Url({
  name,
  isExportable = true,
  isIndexable = true,
  typeSchemas,
  baseURL,
  paramsType,
  paramsCasing,
  pathParamsType,
  operation,
}: Props): FabricReactNode {
  const path = new URLPath(operation.path, { casing: paramsCasing })
  const params = getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas })

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      <Function name={name} export={isExportable} params={params.toConstructor()}>
        <Const name={'res'}>{`{ method: '${operation.method.toUpperCase()}', url: ${path.toTemplateString({ prefix: baseURL })} as const }`}</Const>
        <br />
        return res
      </Function>
    </File.Source>
  )
}

Url.getParams = getParams
