import { caseParams, createFunctionParameter, createFunctionParameters, createOperationParams, createParamsType } from '@kubb/ast'
import type { FunctionParameterNode, FunctionParametersNode, OperationNode, ParameterGroupNode } from '@kubb/ast/types'
import type { PluginTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginSwr } from '../types.ts'
import {
  buildGroupParam,
  buildMutationArgParams,
  getComments,
  resolveErrorNames,
  resolveHeaderGroupType,
  resolvePathParamType,
  resolveQueryGroupType,
} from '../utils.ts'

type Props = {
  name: string
  typeName: string
  clientName: string
  mutationKeyName: string
  mutationKeyTypeName: string
  node: OperationNode
  tsResolver: PluginTs['resolver']
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

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })
const keysPrinter = functionPrinter({ mode: 'keys' })

/**
 * Default mutation hook params (paramsToTrigger=false):
 * pathParams + queryParams + headers + options (NO data — it comes via useSWRMutation arg)
 */
function getParams(
  node: OperationNode,
  options: {
    paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
    pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
    dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
    resolver: PluginTs['resolver']
    mutationKeyTypeName: string
  },
): FunctionParametersNode {
  const { paramsCasing, pathParamsType, dataReturnType, resolver, mutationKeyTypeName } = options

  const responseName = resolver.resolveResponseName(node)
  const requestName = node.requestBody?.schema ? resolver.resolveDataName(node) : undefined
  const errorNames = resolveErrorNames(node, resolver)

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`
  const TExtraArg = requestName || 'never'

  const casedParams = caseParams(node.parameters, paramsCasing)
  const pathParams = casedParams.filter((p) => p.in === 'path')
  const queryParams = casedParams.filter((p) => p.in === 'query')
  const headerParams = casedParams.filter((p) => p.in === 'header')

  const queryGroupType = resolveQueryGroupType(node, queryParams, resolver)
  const headerGroupType = resolveHeaderGroupType(node, headerParams, resolver)

  const params: Array<FunctionParameterNode | ParameterGroupNode> = []

  // Path params
  if (pathParams.length) {
    const pathChildren = pathParams.map((p) => createFunctionParameter({ name: p.name, type: resolvePathParamType(node, p, resolver), optional: !p.required }))
    params.push({
      kind: 'ParameterGroup',
      properties: pathChildren,
      inline: pathParamsType === 'inline',
      default: pathChildren.every((c) => c.optional) ? '{}' : undefined,
    })
  }

  // Query params
  params.push(...buildGroupParam('params', node, queryParams, queryGroupType, resolver))

  // Header params
  params.push(...buildGroupParam('headers', node, headerParams, headerGroupType, resolver))

  // Options
  params.push(
    createFunctionParameter({
      name: 'options',
      type: createParamsType({
        variant: 'reference',
        name: `{
  mutation?: SWRMutationConfiguration<${TData}, ${TError}, ${mutationKeyTypeName} | null, ${TExtraArg}> & { throwOnError?: boolean },
  client?: ${requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }'},
  shouldFetch?: boolean,
}`,
      }),
      default: '{}',
    }),
  )

  return createFunctionParameters({ params })
}

/**
 * Trigger-mode params (paramsToTrigger=true): just `options`
 */
function getTriggerParams(
  node: OperationNode,
  options: {
    dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
    resolver: PluginTs['resolver']
    mutationKeyTypeName: string
    mutationArgTypeName: string
  },
): FunctionParametersNode {
  const { dataReturnType, resolver, mutationKeyTypeName, mutationArgTypeName } = options

  const responseName = resolver.resolveResponseName(node)
  const requestName = node.requestBody?.schema ? resolver.resolveDataName(node) : undefined
  const errorNames = resolveErrorNames(node, resolver)

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  return createFunctionParameters({
    params: [
      createFunctionParameter({
        name: 'options',
        type: createParamsType({
          variant: 'reference',
          name: `{
  mutation?: SWRMutationConfiguration<${TData}, ${TError}, ${mutationKeyTypeName} | null, ${mutationArgTypeName}> & { throwOnError?: boolean },
  client?: ${requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }'},
  shouldFetch?: boolean,
}`,
        }),
        default: '{}',
      }),
    ],
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
  node,
  tsResolver,
  paramsToTrigger = false,
}: Props): KubbReactNode {
  const responseName = tsResolver.resolveResponseName(node)
  const requestName = node.requestBody?.schema ? tsResolver.resolveDataName(node) : undefined
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  // Client call params (path + body + query + headers + config)
  const clientCallParamsNode = createOperationParams(node, {
    paramsType,
    pathParamsType: paramsType === 'object' ? 'object' : pathParamsType === 'object' ? 'object' : 'inline',
    paramsCasing,
    resolver: tsResolver,
    extraParams: [
      createFunctionParameter({
        name: 'config',
        type: createParamsType({
          variant: 'reference',
          name: requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }',
        }),
        default: '{}',
      }),
    ],
  })
  const clientCallStr = callPrinter.print(clientCallParamsNode) ?? ''

  // paramsToTrigger mode
  if (paramsToTrigger) {
    const mutationArgTypeName = `${mutationKeyTypeName.replace('MutationKey', '')}MutationArg`

    const mutationArgParamsNode = buildMutationArgParams(node, { paramsCasing, resolver: tsResolver })
    const hasMutationParams = mutationArgParamsNode.params.length > 0

    // Declaration for the type alias
    const mutationArgDeclaration = hasMutationParams ? (declarationPrinter.print(mutationArgParamsNode) ?? '') : ''

    // Destructured keys for the arg in the callback
    const argKeysStr = hasMutationParams ? (keysPrinter.print(mutationArgParamsNode) ?? '') : ''

    const paramsNode = getTriggerParams(node, { dataReturnType, resolver: tsResolver, mutationKeyTypeName, mutationArgTypeName })
    const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

    const generics = [TData, TError, `${mutationKeyTypeName} | null`, mutationArgTypeName].filter(Boolean)

    return (
      <>
        <File.Source name={mutationArgTypeName} isExportable isIndexable isTypeOnly>
          <Type name={mutationArgTypeName} export>
            {hasMutationParams ? `{${mutationArgDeclaration}}` : 'never'}
          </Type>
        </File.Source>
        <File.Source name={name} isExportable isIndexable>
          <Function
            name={name}
            export
            params={paramsSignature}
            JSDoc={{
              comments: getComments(node),
            }}
          >
            {`
        const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
        const mutationKey = ${mutationKeyName}()

        return useSWRMutation<${generics.join(', ')}>(
          shouldFetch ? mutationKey : null,
          async (_url${hasMutationParams ? `, { arg: ${argKeysStr} }` : ''}) => {
            return ${clientName}(${clientCallStr})
          },
          mutationOptions
        )
    `}
          </Function>
        </File.Source>
      </>
    )
  }

  // Default behavior (paramsToTrigger=false)
  const generics = [TData, TError, `${mutationKeyTypeName} | null`, requestName].filter(Boolean)

  const paramsNode = getParams(node, { paramsCasing, pathParamsType, dataReturnType, resolver: tsResolver, mutationKeyTypeName })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        name={name}
        export
        params={paramsSignature}
        JSDoc={{
          comments: getComments(node),
        }}
      >
        {`
        const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
        const mutationKey = ${mutationKeyName}()

        return useSWRMutation<${generics.join(', ')}>(
          shouldFetch ? mutationKey : null,
          async (_url${requestName ? ', { arg: data }' : ''}) => {
            return ${clientName}(${clientCallStr})
          },
          mutationOptions
        )
    `}
      </Function>
    </File.Source>
  )
}
