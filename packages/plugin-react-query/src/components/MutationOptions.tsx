import { isOptional } from '@kubb/oas'
import { Client } from '@kubb/plugin-client/components'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode, Params } from '@kubb/react-fabric/types'
import type { PluginReactQuery } from '../types.ts'
import { MutationKey } from './MutationKey.tsx'

type Props = {
  name: string
  clientName: string
  mutationKeyName: string
  typeSchemas: OperationSchemas
  paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginReactQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
}

type GetParamsProps = {
  typeSchemas: OperationSchemas
}

function getParams({ typeSchemas }: GetParamsProps) {
  return FunctionParams.factory({
    config: {
      type: typeSchemas.request?.name
        ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }`
        : 'Partial<RequestConfig> & { client?: typeof fetch }',
      default: '{}',
    },
  })
}

export function MutationOptions({ name, clientName, dataReturnType, typeSchemas, paramsCasing, paramsType, pathParamsType, mutationKeyName }: Props): KubbNode {
  const params = getParams({ typeSchemas })
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'

  const clientParams = Client.getParams({
    typeSchemas,
    paramsCasing,
    paramsType,
    pathParamsType,
    isConfigurable: true,
  })

  const mutationKeyParams = MutationKey.getParams({
    pathParamsType,
    typeSchemas,
  })

  const mutationParams = FunctionParams.factory({
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
  })

  const dataParams = FunctionParams.factory({
    data: {
      // No use of pathParams because useMutation can only take one argument in object form,
      // see https://tanstack.com/query/latest/docs/framework/react/reference/useMutation#usemutation
      mode: 'object',
      children: Object.entries(mutationParams.params).reduce((acc, [key, value]) => {
        if (value) {
          acc[key] = {
            ...value,
            type: undefined,
          }
        }

        return acc
      }, {} as Params),
    },
  })

  const TRequest = mutationParams.toConstructor()

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={params.toConstructor()}>
        {`
      const mutationKey = ${mutationKeyName}(${mutationKeyParams.toCall()})
      return mutationOptions<${TData}, ResponseErrorConfig<${TError}>, ${TRequest ? `{${TRequest}}` : 'void'}, typeof mutationKey>({
        mutationKey,
        mutationFn: async(${dataParams.toConstructor()}) => {
          return ${clientName}(${clientParams.toCall()})
        },
      })
`}
      </Function>
    </File.Source>
  )
}

MutationOptions.getParams = getParams
