import { isOptional, type Operation } from '@kubb/oas'
import { Client } from '@kubb/plugin-client/components'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode, Params } from '@kubb/react-fabric/types'
import type { PluginPiniaColada } from '../types.ts'
import { MutationKey } from './MutationKey.tsx'

type Props = {
  /**
   * Name of the function
   */
  name: string
  typeName: string
  clientName: string
  mutationKeyName: string
  typeSchemas: OperationSchemas
  operation: Operation
  paramsCasing: PluginPiniaColada['resolvedOptions']['paramsCasing']
  paramsType: PluginPiniaColada['resolvedOptions']['paramsType']
  dataReturnType: PluginPiniaColada['resolvedOptions']['client']['dataReturnType']
  pathParamsType: PluginPiniaColada['resolvedOptions']['pathParamsType']
}

type GetParamsProps = {
  paramsCasing: PluginPiniaColada['resolvedOptions']['paramsCasing']
  pathParamsType: PluginPiniaColada['resolvedOptions']['pathParamsType']
  dataReturnType: PluginPiniaColada['resolvedOptions']['client']['dataReturnType']
  typeSchemas: OperationSchemas
}

function getParams({ paramsCasing, dataReturnType, typeSchemas }: GetParamsProps) {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`

  const mutationParams = FunctionParams.factory({
    ...getPathParams(typeSchemas.pathParams, {
      typed: true,
      casing: paramsCasing,
      override(item) {
        return {
          ...item,
          type: `MaybeRefOrGetter<${item.type}>`,
        }
      },
    }),
    data: typeSchemas.request?.name
      ? {
          type: `MaybeRefOrGetter<${typeSchemas.request?.name}>`,
          optional: isOptional(typeSchemas.request?.schema),
        }
      : undefined,
    params: typeSchemas.queryParams?.name
      ? {
          type: `MaybeRefOrGetter<${typeSchemas.queryParams?.name}>`,
          optional: isOptional(typeSchemas.queryParams?.schema),
        }
      : undefined,
    headers: typeSchemas.headerParams?.name
      ? {
          type: `MaybeRefOrGetter<${typeSchemas.headerParams?.name}>`,
          optional: isOptional(typeSchemas.headerParams?.schema),
        }
      : undefined,
  })
  const TRequest = mutationParams.toConstructor()

  return FunctionParams.factory({
    options: {
      type: `
{
  mutation?: UseMutationOptions<${[TData, TError, TRequest ? `{${TRequest}}` : 'void'].join(', ')}>,
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }` : 'Partial<RequestConfig> & { client?: typeof fetch }'},
}
`,
      default: '{}',
    },
  })
}

export function Mutation({
  name,
  clientName,
  paramsCasing,
  paramsType,
  pathParamsType,
  dataReturnType,
  typeSchemas,
  operation,
  mutationKeyName,
}: Props): KubbNode {
  const mutationKeyParams = MutationKey.getParams({
    pathParamsType,
    typeSchemas,
  })

  const params = getParams({
    paramsCasing,
    pathParamsType,
    dataReturnType,
    typeSchemas,
  })

  const clientParams = Client.getParams({
    paramsCasing,
    paramsType,
    typeSchemas,
    pathParamsType,
    isConfigurable: true,
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
      // No use of pathParams because useMutation can only take one argument in object form
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
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`

  const generics = [TData, TError, TRequest ? `{${TRequest}}` : 'void'].join(', ')

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
        const mutationKey = mutationOptions?.key ?? ${mutationKeyName}(${mutationKeyParams.toCall()})

        return useMutation<${generics}>({
          mutationFn: async(${dataParams.toConstructor()}) => {
            return ${clientName}(${clientParams.toCall()})
          },
          mutationKey,
          ...mutationOptions
        })
    `}
      </Function>
    </File.Source>
  )
}
