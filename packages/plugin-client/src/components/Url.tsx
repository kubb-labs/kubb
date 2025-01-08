import { URLPath } from '@kubb/core/utils'

import { type Operation, isOptional } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react'
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
    return FunctionParams.factory({
      data: {
        mode: 'object',
        children: {
          ...getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
        },
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
  })
}

export function Url({ name, isExportable = true, isIndexable = true, typeSchemas, baseURL, paramsType, paramsCasing, pathParamsType, operation }: Props) {
  const path = new URLPath(operation.path, { casing: paramsCasing })
  const params = getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas })

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      <Function name={name} export={isExportable} params={params.toConstructor()}>
        {`return ${path.toTemplateString({ prefix: baseURL })} as const`}
      </Function>
    </File.Source>
  )
}

Url.getParams = getParams
