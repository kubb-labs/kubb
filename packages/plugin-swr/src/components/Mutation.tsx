import { isOptional, type Operation } from '@kubb/oas'
import { Client } from '@kubb/plugin-client/components'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams, Type } from '@kubb/react-fabric'
import type { KubbNode, Params } from '@kubb/react-fabric/types'
import type { PluginSwr } from '../types.ts'
import { MutationKey } from './MutationKey.tsx'

type Props = {
  /**
   * Name of the function
   */
  name: string
  typeName: string
  clientName: string
  mutationKeyName: string
  mutationKeyTypeName: string
  typeSchemas: OperationSchemas
  operation: Operation
  paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
  paramsType: PluginSwr['resolvedOptions']['paramsType']
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
}

type GetParamsProps = {
  paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
  typeSchemas: OperationSchemas
  mutationKeyTypeName: string
  mutationArgTypeName: string
}

function getParams({ dataReturnType, typeSchemas, mutationKeyTypeName, mutationArgTypeName }: GetParamsProps) {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`

  return FunctionParams.factory({
    options: {
      type: `
{
  mutation?: SWRMutationConfiguration<${TData}, ${TError}, ${mutationKeyTypeName} | null, ${mutationArgTypeName}> & { throwOnError?: boolean },
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }` : 'Partial<RequestConfig> & { client?: typeof fetch }'},
  shouldFetch?: boolean,
}
`,
      default: '{}',
    },
  })
}

type GetMutationParamsProps = {
  paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
  typeSchemas: OperationSchemas
}

function getMutationParams({ paramsCasing, typeSchemas }: GetMutationParamsProps) {
  return FunctionParams.factory({
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
}

export function Mutation({
  name,
  clientName,
  mutationKeyName,
  mutationKeyTypeName,
  paramsType,
  paramsCasing,
  pathParamsType,
  dataReturnType,
  typeSchemas,
  operation,
}: Props): KubbNode {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`

  const mutationKeyParams = MutationKey.getParams({
    pathParamsType,
    typeSchemas,
  })

  // Build the mutation params type (for arg destructuring)
  const mutationParams = getMutationParams({
    paramsCasing,
    typeSchemas,
  })

  // Get the arg type name
  const mutationArgTypeName = `${mutationKeyTypeName.replace('MutationKey', '')}MutationArg`

  // Check if there are any mutation params (path, data, params, headers)
  const hasMutationParams = Object.keys(mutationParams.params).length > 0

  // Build the arg type for useSWRMutation
  const argParams = FunctionParams.factory({
    data: {
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

  const params = getParams({
    paramsCasing,
    pathParamsType,
    dataReturnType,
    typeSchemas,
    mutationKeyTypeName,
    mutationArgTypeName,
  })

  const clientParams = Client.getParams({
    paramsCasing,
    paramsType,
    typeSchemas,
    pathParamsType,
    isConfigurable: true,
  })

  const generics = [TData, TError, `${mutationKeyTypeName} | null`, mutationArgTypeName].filter(Boolean)

  const mutationArg = mutationParams.toConstructor()

  return (
    <>
      <File.Source name={mutationArgTypeName} isExportable isIndexable isTypeOnly>
        <Type name={mutationArgTypeName} export>
          {hasMutationParams ? `{${mutationArg}}` : 'never'}
        </Type>
      </File.Source>
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
        const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
        const mutationKey = ${mutationKeyName}(${mutationKeyParams.toCall()})

        return useSWRMutation<${generics.join(', ')}>(
          shouldFetch ? mutationKey : null,
          async (_url${hasMutationParams ? `, { arg: ${argParams.toCall()} }` : ''}) => {
            return ${clientName}(${clientParams.toCall()})
          },
          mutationOptions
        )
    `}
        </Function>
      </File.Source>
    </>
  )
}
