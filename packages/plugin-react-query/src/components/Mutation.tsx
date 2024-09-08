import { File, Function, FunctionParams } from '@kubb/react'

import { type Operation, isOptional } from '@kubb/oas'
import { Client } from '@kubb/plugin-client/components'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import type { ReactNode } from 'react'
import type { PluginReactQuery } from '../types.ts'

type Props = {
  /**
   * Name of the function
   */
  name: string
  typeName: string
  clientName: string
  typeSchemas: OperationSchemas
  operation: Operation
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
}

type GetParamsProps = {
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
  typeSchemas: OperationSchemas
}

function getParams({ pathParamsType, dataReturnType, typeSchemas }: GetParamsProps) {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`

  return FunctionParams.factory({
    pathParams: {
      mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
      children: getPathParams(typeSchemas.pathParams, { typed: true }),
    },
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
    options: {
      type: `
{
  mutation?: UseMutationOptions<${[TData, typeSchemas.errors?.map((item) => item.name).join(' | ') || 'unknown', typeSchemas.request?.name || 'unknown'].join(', ')}>,
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>>` : 'Partial<RequestConfig>'},
}
`,
      default: '{}',
    },
  })
}

export function Mutation({ name, clientName, pathParamsType, dataReturnType, typeSchemas, operation }: Props): ReactNode {
  const params = getParams({
    pathParamsType,
    dataReturnType,
    typeSchemas,
  })

  const clientParams = Client.getParams({
    typeSchemas,
    pathParamsType,
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
        const { mutation: mutationOptions, client: config = {} } = options ?? {}

        return useMutation({
          mutationFn: async(data) => {
            return ${clientName}(${clientParams.toCall()})
          },
          ...mutationOptions
        })
    `}
      </Function>
    </File.Source>
  )
}
