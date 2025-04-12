import { File, Function, FunctionParams } from '@kubb/react'

import { isOptional } from '@kubb/oas'
import type { ReactNode } from 'react'

import type { OperationSchemas } from '@kubb/plugin-oas'
import type { PluginMcp } from '../types.ts'
import { Client } from '@kubb/plugin-client/components'
import { getPathParams } from '@kubb/plugin-oas/utils'

type Props = {
  /**
   * Name of the function
   */
  name: string
  clientName: string
  typeSchemas: OperationSchemas
  dataReturnType: PluginMcp['resolvedOptions']['dataReturnType']
  paramsCasing: PluginMcp['resolvedOptions']['paramsCasing']
  paramsType: PluginMcp['resolvedOptions']['paramsType']
  pathParamsType: PluginMcp['resolvedOptions']['pathParamsType']
}

type GetParamsProps = {
  paramsCasing: PluginMcp['resolvedOptions']['paramsCasing']
  paramsType: PluginMcp['resolvedOptions']['paramsType']
  pathParamsType: PluginMcp['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas }: GetParamsProps) {
  if (paramsType === 'object') {
    return FunctionParams.factory({
      data: {
        mode: 'object',
        children: {
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
        },
      },
      config: {
        type: typeSchemas.request?.name
          ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof client }`
          : 'Partial<RequestConfig> & { client?: typeof client }',
        default: '{}',
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
        ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof client }`
        : 'Partial<RequestConfig> & { client?: typeof client }',
      default: '{}',
    },
  })
}

export function Tool({ name, clientName, dataReturnType, typeSchemas, pathParamsType, paramsCasing, paramsType }: Props): ReactNode {
  const params = getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas })

  const clientParams = Client.getParams({
    typeSchemas,
    paramsCasing,
    paramsType,
    pathParamsType,
  })

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} async export params={params.toConstructor()} returnType={'Promise<CallToolResult>'}>
        {dataReturnType === 'data' &&
          `
          const res = await ${clientName}(${clientParams.toCall({})})

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(res)
              }
            ]
           }`}
        {/*{dataReturnType === 'full' && `return cy.request('${method}', '${new URLPath(`${baseURL ?? ''}${url}`).toURLPath()}', ${body})`}*/}
      </Function>
    </File.Source>
  )
}

Tool.getParams = getParams
