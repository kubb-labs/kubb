import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react'

import type { ReactNode } from 'react'
import type { PluginSwr } from '../types.ts'

import { isOptional } from '@kubb/oas'
import { Client } from '@kubb/plugin-client/components'
import type { OperationSchemas } from '@kubb/plugin-oas'

type Props = {
  name: string
  clientName: string
  typeSchemas: OperationSchemas
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
}

type GetParamsProps = {
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({ pathParamsType, typeSchemas }: GetParamsProps) {
  return FunctionParams.factory({
    pathParams: {
      mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
      children: getPathParams(typeSchemas.pathParams, { typed: true }),
    },
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
      type: typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>>` : 'Partial<RequestConfig>',
      default: '{}',
    },
  })
}

export function QueryOptions({ name, clientName, typeSchemas, pathParamsType }: Props): ReactNode {
  const params = getParams({ pathParamsType, typeSchemas })
  const clientParams = Client.getParams({
    typeSchemas,
    pathParamsType,
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
