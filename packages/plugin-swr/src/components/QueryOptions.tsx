import { createFunctionParameter, createOperationParams, createParamsType } from '@kubb/ast'
import type { FunctionParametersNode, OperationNode } from '@kubb/ast/types'
import type { PluginTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginSwr } from '../types.ts'

type Props = {
  name: string
  clientName: string
  node: OperationNode
  tsResolver: PluginTs['resolver']
  paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
  paramsType: PluginSwr['resolvedOptions']['paramsType']
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function getQueryOptionsParams(
  node: OperationNode,
  options: {
    paramsType: PluginSwr['resolvedOptions']['paramsType']
    paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
    pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
    resolver: PluginTs['resolver']
  },
): FunctionParametersNode {
  const { paramsType, paramsCasing, pathParamsType, resolver } = options
  const requestName = node.requestBody?.schema ? resolver.resolveDataName(node) : undefined

  return createOperationParams(node, {
    paramsType,
    pathParamsType: paramsType === 'object' ? 'object' : pathParamsType === 'object' ? 'object' : 'inline',
    paramsCasing,
    resolver,
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
}

export function QueryOptions({ name, clientName, node, tsResolver, paramsCasing, paramsType, pathParamsType }: Props): KubbReactNode {
  const paramsNode = getQueryOptionsParams(node, { paramsType, paramsCasing, pathParamsType, resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const paramsCall = callPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature}>
        {`
      return {
        fetcher: async () => {
          return ${clientName}(${paramsCall})
        },
      }
      `}
      </Function>
    </File.Source>
  )
}
