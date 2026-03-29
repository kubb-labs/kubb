import { camelCase, URLPath } from '@internals/utils'
import { caseParams, createFunctionParameter, createOperationParams, createTypeNode } from '@kubb/ast'
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
    extraParams: [
      createFunctionParameter({ name: 'options', type: createTypeNode({ variant: 'reference', name: 'Partial<Cypress.RequestOptions>' }), default: '{}' }),
    ],
  })

  return declarationPrinter.print(paramsNode) ?? ''
}

export function Request({ baseURL = '', name, dataReturnType, resolver, node, paramsType, pathParamsType, paramsCasing }: Props): FabricReactNode {
  const paramsSignature = getParams({ paramsType, pathParamsType, paramsCasing, resolver, node })

  const responseType = resolver.resolveResponseName(node)
  const returnType = dataReturnType === 'data' ? `Cypress.Chainable<${responseType}>` : `Cypress.Chainable<Cypress.Response<${responseType}>>`

  const casedPathParams = caseParams(
    node.parameters.filter((p) => p.in === 'path'),
    paramsCasing,
  )
  // Build a lookup keyed by camelCase-normalized name so that path-template names
  // (e.g. `{pet_id}`) correctly resolve to the function-parameter name (`petId`)
  // even when the OpenAPI spec has inconsistent casing between the two.
  const pathParamNameMap = new Map(casedPathParams.map((p) => [camelCase(p.name), p.name]))

  const urlPath = new URLPath(node.path, { casing: paramsCasing })
  const urlTemplate = urlPath.toTemplateString({
    prefix: baseURL,
    replacer: (param) => pathParamNameMap.get(camelCase(param)) ?? param,
  })

  const requestOptions: string[] = [`method: '${node.method}'`, `url: ${urlTemplate}`]

  const queryParams = node.parameters.filter((p) => p.in === 'query')
  if (queryParams.length > 0) {
    const casedQueryParams = caseParams(queryParams, paramsCasing)
    // When paramsCasing renames query params (e.g. page_size → pageSize), we must remap
    // the camelCase keys back to the original API names before passing them to `qs`.
    const needsQsTransform = casedQueryParams.some((p, i) => p.name !== queryParams[i]!.name)
    if (needsQsTransform) {
      const pairs = queryParams.map((orig, i) => `${orig.name}: params.${casedQueryParams[i]!.name}`).join(', ')
      requestOptions.push(`qs: params ? { ${pairs} } : undefined`)
    } else {
      requestOptions.push('qs: params')
    }
  }

  const headerParams = node.parameters.filter((p) => p.in === 'header')
  if (headerParams.length > 0) {
    const casedHeaderParams = caseParams(headerParams, paramsCasing)
    // When paramsCasing renames header params (e.g. x-api-key → xApiKey), we must remap
    // the camelCase keys back to the original API names before passing them to `headers`.
    const needsHeaderTransform = casedHeaderParams.some((p, i) => p.name !== headerParams[i]!.name)
    if (needsHeaderTransform) {
      const pairs = headerParams.map((orig, i) => `'${orig.name}': headers.${casedHeaderParams[i]!.name}`).join(', ')
      requestOptions.push(`headers: headers ? { ${pairs} } : undefined`)
    } else {
      requestOptions.push('headers')
    }
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
