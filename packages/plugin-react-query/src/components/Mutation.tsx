import { isOptional, type Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react'
import type { PluginReactQuery } from '../types.ts'
import { MutationKey } from './MutationKey.tsx'
import { MutationOptions } from './MutationOptions.tsx'

type Props = {
  /**
   * Name of the function
   */
  name: string
  typeName: string
  mutationOptionsName: string
  mutationKeyName: string
  typeSchemas: OperationSchemas
  operation: Operation
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
  paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
}

type GetParamsProps = {
  paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
  typeSchemas: OperationSchemas
}

function getParams({ paramsCasing, dataReturnType, typeSchemas }: GetParamsProps) {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
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
  const TRequest = mutationParams.toConstructor()
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`
  const generics = [TData, TError, TRequest ? `{${TRequest}}` : 'void', 'TContext'].join(', ')

  return FunctionParams.factory({
    options: {
      type: `
{
  mutation?: UseMutationOptions<${generics}> & { client?: QueryClient },
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }` : 'Partial<RequestConfig> & { client?: typeof fetch }'},
}
`,
      default: '{}',
    },
  })
}

export function Mutation({ name, mutationOptionsName, paramsCasing, pathParamsType, dataReturnType, typeSchemas, operation, mutationKeyName }: Props) {
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

  const mutationOptionsParams = MutationOptions.getParams({ typeSchemas })

  const TRequest = mutationParams.toConstructor()
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`
  const generics = [TData, TError, TRequest ? `{${TRequest}}` : 'void', 'TContext'].join(', ')
  const returnType = `UseMutationResult<${generics}>`

  const mutationOptions = `${mutationOptionsName}(${mutationOptionsParams.toCall()})`

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        name={name}
        export
        params={params.toConstructor()}
        JSDoc={{
          comments: getComments(operation),
        }}
        generics={['TContext']}
      >
        {`
        const { mutation = {}, client: config = {} } = options ?? {}
        const { client: queryClient, ...mutationOptions } = mutation;
        const mutationKey = mutationOptions.mutationKey ?? ${mutationKeyName}(${mutationKeyParams.toCall()})

        const baseOptions = ${mutationOptions} as UseMutationOptions<${generics}>

        return useMutation<${generics}>({
          ...baseOptions,
          mutationKey,
          ...mutationOptions,
        }, queryClient) as ${returnType}
    `}
      </Function>
    </File.Source>
  )
}
