import { File, Function, FunctionParams } from '@kubb/react'

import { type Operation, isOptional } from '@kubb/oas'
import { Client } from '@kubb/plugin-client/components'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import type { ReactNode } from 'react'
import type { PluginSvelteQuery } from '../types.ts'

type Props = {
  /**
   * Name of the function
   */
  name: string
  typeName: string
  clientName: string
  typeSchemas: OperationSchemas
  operation: Operation
  dataReturnType: PluginSvelteQuery['resolvedOptions']['client']['dataReturnType']
  pathParamsType: PluginSvelteQuery['resolvedOptions']['pathParamsType']
}

type GetParamsProps = {
  pathParamsType: PluginSvelteQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginSvelteQuery['resolvedOptions']['client']['dataReturnType']
  typeSchemas: OperationSchemas
}

function getParams({ dataReturnType, typeSchemas }: GetParamsProps) {
  const mutateParams = FunctionParams.factory({
    ...getPathParams(typeSchemas.pathParams, { typed: true }),
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
  })

  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TRequest = mutateParams.toConstructor({ valueAsType: true })

  return FunctionParams.factory({
    options: {
      type: `
{
  mutation?: CreateMutationOptions<${[TData, typeSchemas.errors?.map((item) => item.name).join(' | ') || 'unknown', `{${TRequest}`].join(', ')}>,
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

  const mutationParams = FunctionParams.factory({
    data: {
      // No use of pathParams because useMutation can only take one argument in object form,
      // see https://tanstack.com/query/latest/docs/framework/react/reference/useMutation#usemutation
      mode: 'object',
      //TODO rename with value
      children: {
        ...getPathParams(typeSchemas.pathParams, { typed: true }),
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

        return createMutation({
          mutationFn: async(${mutationParams.toConstructor()}) => {
            return ${clientName}(${clientParams.toCall()})
          },
          ...mutationOptions
        })
    `}
      </Function>
    </File.Source>
  )
}
