import { isValidVarName, URLPath } from '@internals/utils'
import type { Ast } from '@kubb/core'
import { ast } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { Const, File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginClient } from '../types.ts'
import { buildParamsMapping } from '../utils.ts'

type Props = {
  name: string
  isExportable?: boolean
  isIndexable?: boolean

  baseURL: string | undefined
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['pathParamsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  node: Ast.OperationNode
  tsResolver: PluginTs['resolver']
}

type GetParamsProps = {
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['paramsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  node: Ast.OperationNode
  tsResolver: PluginTs['resolver']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

function getParams({ paramsType, paramsCasing, pathParamsType, node, tsResolver }: GetParamsProps): Ast.FunctionParametersNode {
  // Build a URL-only node with only path params (no body, query, header)
  const urlNode: Ast.OperationNode = {
    ...node,
    parameters: node.parameters.filter((p) => p.in === 'path'),
    requestBody: undefined,
  }

  return ast.createOperationParams(urlNode, {
    paramsType: paramsType === 'object' ? 'object' : 'inline',
    pathParamsType: paramsType === 'object' ? 'object' : pathParamsType === 'object' ? 'object' : 'inline',
    paramsCasing,
    resolver: tsResolver,
  })
}

export function Url({
  name,
  isExportable = true,
  isIndexable = true,
  baseURL,
  paramsType,
  paramsCasing,
  pathParamsType,
  node,
  tsResolver,
}: Props): KubbReactNode {
  const path = new URLPath(node.path)

  const paramsNode = getParams({
    paramsType,
    paramsCasing,
    pathParamsType,
    node,
    tsResolver,
  })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  const originalPathParams = node.parameters.filter((p) => p.in === 'path')
  const casedPathParams = ast.caseParams(originalPathParams, paramsCasing)
  const pathParamsMapping = paramsCasing ? buildParamsMapping(originalPathParams, casedPathParams) : undefined

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      <Function name={name} export={isExportable} params={paramsSignature}>
        {pathParamsMapping &&
          Object.entries(pathParamsMapping)
            .filter(([originalName, camelCaseName]) => isValidVarName(originalName) && originalName !== camelCaseName)
            .map(([originalName, camelCaseName]) => `const ${originalName} = ${camelCaseName}`)
            .join('\n')}
        {pathParamsMapping && Object.keys(pathParamsMapping).length > 0 && <br />}
        <Const name={'res'}>{`{ method: '${node.method.toUpperCase()}', url: ${path.toTemplateString({ prefix: baseURL })} as const }`}</Const>
        <br />
        return res
      </Function>
    </File.Source>
  )
}

Url.getParams = getParams
