import { createFunctionParameter, createOperationParams } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { PluginCypress } from '../types.ts'

type Props = {
  /**
   * Name of the function
   */
  name: string
  /**
   * AST operation node
   */
  node: OperationNode
  /**
   * TypeScript resolver for resolving param/data/response type names
   */
  resolver: ResolverTs
  baseURL: string | undefined
  dataReturnType: PluginCypress['resolvedOptions']['dataReturnType']
  paramsCasing: PluginCypress['resolvedOptions']['paramsCasing']
  paramsType: PluginCypress['resolvedOptions']['paramsType']
  pathParamsType: PluginCypress['resolvedOptions']['pathParamsType']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

function getParams({
  paramsType,
  pathParamsType,
  paramsCasing,
  resolver,
  node,
}: {
  paramsType: PluginCypress['resolvedOptions']['paramsType']
  pathParamsType: PluginCypress['resolvedOptions']['pathParamsType']
  paramsCasing: PluginCypress['resolvedOptions']['paramsCasing']
  resolver: ResolverTs
  node: OperationNode
}): string {
  const paramsNode = createOperationParams(node, {
    paramsType,
    pathParamsType,
    paramsCasing,
    resolver,
    extraParams: [createFunctionParameter({ name: 'options', type: 'Partial<Cypress.RequestOptions>', default: '{}' })],
  })

  return declarationPrinter.print(paramsNode) ?? ''
}

/**
 * Builds the URL template string from the operation path (OpenAPI `{param}` style).
 * Replaces `{paramName}` with `${paramName}`.
 */
function buildUrlTemplate(operationPath: string, baseURL: string): string {
  const template = operationPath.replace(/\{([^}]+)\}/g, (_, name: string) => `\${${name}}`)
  if (baseURL) {
    return `\`${baseURL}${template}\``
  }
  return `\`${template}\``
}

export function Request({ baseURL = '', name, dataReturnType, resolver, node, paramsType, pathParamsType, paramsCasing }: Props): FabricReactNode {
  const paramsSignature = getParams({ paramsType, pathParamsType, paramsCasing, resolver, node })

  const responseType = resolver.resolveResponseName(node)
  const returnType = dataReturnType === 'data' ? `Cypress.Chainable<${responseType}>` : `Cypress.Chainable<Cypress.Response<${responseType}>>`

  const urlTemplate = buildUrlTemplate(node.path, baseURL)

  const requestOptions: string[] = [`method: '${node.method}'`, `url: ${urlTemplate}`]

  if (node.parameters.some((p) => p.in === 'query')) {
    requestOptions.push('qs: params')
  }

  if (node.parameters.some((p) => p.in === 'header')) {
    requestOptions.push('headers')
  }

  if (node.requestBody?.schema) {
    requestOptions.push('body: data')
  }

  requestOptions.push('...options')

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={paramsSignature} returnType={returnType}>
        {dataReturnType === 'data'
          ? `return cy.request<${responseType}>({
  ${requestOptions.join(',\n  ')}
}).then((res) => res.body)`
          : `return cy.request<${responseType}>({
  ${requestOptions.join(',\n  ')}
})`}
      </Function>
    </File.Source>
  )
}

Request.getParams = getParams
