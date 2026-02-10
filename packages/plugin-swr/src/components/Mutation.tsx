import { isOptional, type Operation } from '@kubb/oas'
import { Client } from '@kubb/plugin-client/components'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams, Type } from '@kubb/react-fabric'
import type { FabricReactNode, Params } from '@kubb/react-fabric/types'
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
  /**
   * When true, mutation parameters are passed via trigger() instead of as hook arguments
   * @default false
   */
  paramsToTrigger?: boolean
}

type GetParamsProps = {
  paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
  typeSchemas: OperationSchemas
  mutationKeyTypeName: string
}

// Original getParams - used when paramsToTrigger is false (default)
function getParams({ pathParamsType, paramsCasing, dataReturnType, typeSchemas, mutationKeyTypeName }: GetParamsProps) {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`
  const TExtraArg = typeSchemas.request?.name || 'never'

  return FunctionParams.factory({
    pathParams: {
      mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
      children: getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
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
  mutation?: SWRMutationConfiguration<${TData}, ${TError}, ${mutationKeyTypeName} | null, ${TExtraArg}> & { throwOnError?: boolean },
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }'},
  shouldFetch?: boolean,
}
`,
      default: '{}',
    },
  })
}

type GetTriggerParamsProps = {
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
  typeSchemas: OperationSchemas
  mutationKeyTypeName: string
  mutationArgTypeName: string
}

// New getParams - used when paramsToTrigger is true
function getTriggerParams({ dataReturnType, typeSchemas, mutationKeyTypeName, mutationArgTypeName }: GetTriggerParamsProps) {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`

  return FunctionParams.factory({
    options: {
      type: `
{
  mutation?: SWRMutationConfiguration<${TData}, ${TError}, ${mutationKeyTypeName} | null, ${mutationArgTypeName}> & { throwOnError?: boolean },
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }'},
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
  paramsToTrigger = false,
}: Props): FabricReactNode {
  const TData = dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`

  const mutationKeyParams = MutationKey.getParams({
    pathParamsType,
    typeSchemas,
  })

  const clientParams = Client.getParams({
    paramsCasing,
    paramsType,
    typeSchemas,
    pathParamsType,
    isConfigurable: true,
  })

  // Use the new trigger-based approach when paramsToTrigger is true
  if (paramsToTrigger) {
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

    const params = getTriggerParams({
      dataReturnType,
      typeSchemas,
      mutationKeyTypeName,
      mutationArgTypeName,
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

  // Original behavior (default)
  const generics = [
    TData,
    TError,
    `${mutationKeyTypeName} | null`,
    typeSchemas.request?.name, // TExtraArg - the arg type for useSWRMutation
  ].filter(Boolean)

  const params = getParams({
    paramsCasing,
    pathParamsType,
    dataReturnType,
    typeSchemas,
    mutationKeyTypeName,
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
        const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
        const mutationKey = ${mutationKeyName}(${mutationKeyParams.toCall()})

        return useSWRMutation<${generics.join(', ')}>(
          shouldFetch ? mutationKey : null,
          async (_url${typeSchemas.request?.name ? ', { arg: data }' : ''}) => {
            return ${clientName}(${clientParams.toCall()})
          },
          mutationOptions
        )
    `}
      </Function>
    </File.Source>
  )
}
