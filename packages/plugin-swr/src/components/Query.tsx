import type { Ast } from '@kubb/core'
import { ast } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginSwr } from '../types.ts'
import { buildGroupParam, getComments, resolveErrorNames, resolvePathParamType, resolveQueryGroupType } from '../utils.ts'
import { QueryKey } from './QueryKey.tsx'
import { getQueryOptionsParams } from './QueryOptions.tsx'

type Props = {
  name: string
  queryOptionsName: string
  queryKeyName: string
  queryKeyTypeName: string
  node: Ast.OperationNode
  tsResolver: PluginTs['resolver']
  paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
  paramsType: PluginSwr['resolvedOptions']['paramsType']
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function getParams(
  node: Ast.OperationNode,
  options: {
    paramsType: PluginSwr['resolvedOptions']['paramsType']
    paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
    pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
    dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
    resolver: PluginTs['resolver']
  },
): Ast.FunctionParametersNode {
  const { paramsType, paramsCasing, pathParamsType, dataReturnType, resolver } = options

  const responseName = resolver.resolveResponseName(node)
  const requestName = node.requestBody?.schema ? resolver.resolveDataName(node) : undefined
  const errorNames = resolveErrorNames(node, resolver)

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const optionsParam = ast.createFunctionParameter({
    name: 'options',
    type: ast.createParamsType({
      variant: 'reference',
      name: `{
  query?: Parameters<typeof useSWR<${TData}, ${TError}>>[2],
  client?: ${requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }'},
  shouldFetch?: boolean,
  immutable?: boolean
}`,
    }),
    default: '{}',
  })

  if (paramsType === 'object') {
    // Use createOperationParams for the grouped params (path + body + query + headers),
    // but replace the config param with SWR's options param
    const baseParams = ast.createOperationParams(node, {
      paramsType: 'object',
      pathParamsType: 'object',
      paramsCasing,
      resolver,
      extraParams: [],
    })

    return ast.createFunctionParameters({
      params: [...baseParams.params, optionsParam],
    })
  }

  // Inline params: build path + body + query (NO headers for query hooks) + options
  const casedParams = ast.caseParams(node.parameters, paramsCasing)
  const pathParams = casedParams.filter((p) => p.in === 'path')
  const queryParams = casedParams.filter((p) => p.in === 'query')
  const headerParams = casedParams.filter((p) => p.in === 'header')

  const queryGroupType = resolveQueryGroupType(node, queryParams, resolver)

  const bodyType = node.requestBody?.schema ? ast.createParamsType({ variant: 'reference', name: resolver.resolveDataName(node) }) : undefined
  const bodyRequired = node.requestBody?.required ?? false

  const params: Array<Ast.FunctionParameterNode | Ast.ParameterGroupNode> = []

  // Path params
  if (pathParams.length) {
    const pathChildren = pathParams.map((p) =>
      ast.createFunctionParameter({ name: p.name, type: resolvePathParamType(node, p, resolver), optional: !p.required }),
    )
    params.push({
      kind: 'ParameterGroup',
      properties: pathChildren,
      inline: pathParamsType === 'inline',
      default: pathChildren.every((c) => c.optional) ? '{}' : undefined,
    })
  }

  // Body
  if (bodyType) {
    params.push(ast.createFunctionParameter({ name: 'data', type: bodyType, optional: !bodyRequired }))
  }

  // Query params
  params.push(...buildGroupParam('params', node, queryParams, queryGroupType, resolver))

  // Header params (included for the query hook params, consistent with old behavior)
  const headerGroupType = node.parameters.some((p) => p.in === 'header')
    ? (() => {
        const hParams = casedParams.filter((p) => p.in === 'header')
        const firstParam = hParams[0]!
        const groupName = resolver.resolveHeaderParamsName(node, firstParam)
        const individualName = resolver.resolveParamName(node, firstParam)
        if (groupName !== individualName) {
          return { type: ast.createParamsType({ variant: 'reference', name: groupName }), optional: hParams.every((p) => !p.required) }
        }
        return undefined
      })()
    : undefined
  params.push(...buildGroupParam('headers', node, headerParams, headerGroupType, resolver))

  // SWR options
  params.push(optionsParam)

  return ast.createFunctionParameters({ params })
}

export function Query({
  name,
  node,
  tsResolver,
  queryKeyName,
  queryKeyTypeName,
  queryOptionsName,
  dataReturnType,
  paramsType,
  paramsCasing,
  pathParamsType,
}: Props): KubbReactNode {
  const responseName = tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`
  const generics = [TData, TError, `${queryKeyTypeName} | null`]

  const queryKeyParamsNode = QueryKey.getParams(node, { pathParamsType, paramsCasing, resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const paramsNode = getParams(node, { paramsType, paramsCasing, pathParamsType, dataReturnType, resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  const queryOptionsParamsNode = getQueryOptionsParams(node, { paramsType, paramsCasing, pathParamsType, resolver: tsResolver })
  const queryOptionsParamsCall = callPrinter.print(queryOptionsParamsNode) ?? ''

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
       const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

       const queryKey = ${queryKeyName}(${queryKeyParamsCall})

       return useSWR<${generics.join(', ')}>(
        shouldFetch ? queryKey : null,
        {
          ...${queryOptionsName}(${queryOptionsParamsCall}),
          ...(immutable ? {
              revalidateIfStale: false,
              revalidateOnFocus: false,
              revalidateOnReconnect: false
            } : { }),
          ...queryOptions
        }
       )
       `}
      </Function>
    </File.Source>
  )
}
