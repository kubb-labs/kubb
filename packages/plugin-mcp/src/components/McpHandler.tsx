import { isValidVarName, URLPath } from '@internals/utils'
import type { Ast } from '@kubb/core'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginMcp } from '../types.ts'
import { getComments, getParamsMapping } from '../utils.ts'

type Props = {
  /**
   * Name of the handler function.
   */
  name: string
  /**
   * AST operation node.
   */
  node: Ast.OperationNode
  /**
   * TypeScript resolver for resolving param/data/response type names.
   */
  resolver: ResolverTs
  /**
   * Base URL prepended to every generated request URL.
   */
  baseURL: string | undefined
  /**
   * Return type when calling fetch.
   * - 'data' returns response data only.
   * - 'full' returns the full response object.
   * @default 'data'
   */
  dataReturnType: PluginMcp['resolvedOptions']['client']['dataReturnType']
  /**
   * How to style your params.
   */
  paramsCasing?: PluginMcp['resolvedOptions']['paramsCasing']
}

/**
 * Generate a remapping statement: `const mappedX = x ? { "orig": x.camel, ... } : undefined`
 */
function buildRemappingCode(mapping: Record<string, string>, varName: string, sourceName: string): string {
  const pairs = Object.entries(mapping)
    .map(([orig, camel]) => `"${orig}": ${sourceName}.${camel}`)
    .join(', ')
  return `const ${varName} = ${sourceName} ? { ${pairs} } : undefined`
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export function McpHandler({ name, node, resolver, baseURL, dataReturnType, paramsCasing }: Props): KubbReactNode {
  const urlPath = new URLPath(node.path)
  const contentType = node.requestBody?.contentType
  const isFormData = contentType === 'multipart/form-data'

  const casedParams = ast.caseParams(node.parameters, paramsCasing)
  const queryParams = casedParams.filter((p) => p.in === 'query')
  const headerParams = casedParams.filter((p) => p.in === 'header')

  // Use original (uncased) parameters for mapping so original→camelCase difference is detected
  const originalPathParams = node.parameters.filter((p) => p.in === 'path')
  const originalQueryParams = node.parameters.filter((p) => p.in === 'query')
  const originalHeaderParams = node.parameters.filter((p) => p.in === 'header')

  const requestName = node.requestBody?.schema ? resolver.resolveDataName(node) : undefined
  const responseName = resolver.resolveResponseName(node)

  const errorResponses = node.responses.filter((r) => Number(r.statusCode) >= 400).map((r) => resolver.resolveResponseStatusName(node, r.statusCode))
  const errorType = errorResponses.length > 0 ? errorResponses.join(' | ') : 'Error'

  const TError = `ResponseErrorConfig<${errorType}>`
  const generics = [responseName, TError, requestName || 'unknown'].filter(Boolean)

  const paramsNode = ast.createOperationParams(node, {
    paramsType: 'object',
    pathParamsType: 'inline',
    resolver,
    paramsCasing,
  })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  const pathParamsMapping = paramsCasing ? getParamsMapping(originalPathParams) : undefined
  const queryParamsMapping = paramsCasing ? getParamsMapping(originalQueryParams) : undefined
  const headerParamsMapping = paramsCasing ? getParamsMapping(originalHeaderParams) : undefined

  const contentTypeHeader =
    contentType && contentType !== 'application/json' && contentType !== 'multipart/form-data' ? `'Content-Type': '${contentType}'` : undefined
  const headers = [headerParams.length ? (headerParamsMapping ? '...mappedHeaders' : '...headers') : undefined, contentTypeHeader].filter(Boolean)

  const fetchConfig: string[] = []
  fetchConfig.push(`method: ${JSON.stringify(node.method.toUpperCase())}`)
  fetchConfig.push(`url: ${urlPath.template}`)
  if (baseURL) fetchConfig.push(`baseURL: \`${baseURL}\``)
  if (queryParams.length) fetchConfig.push(queryParamsMapping ? 'params: mappedParams' : 'params')
  if (requestName) fetchConfig.push(`data: ${isFormData ? 'formData as FormData' : 'requestData'}`)
  if (headers.length) fetchConfig.push(`headers: { ${headers.join(', ')} }`)

  const callToolResult =
    dataReturnType === 'data'
      ? `return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(res.data)
              }
            ],
            structuredContent: { data: res.data }
           }`
      : `return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(res)
              }
            ],
            structuredContent: { data: res.data }
           }`

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        name={name}
        async
        export
        params={paramsSignature}
        JSDoc={{
          comments: getComments(node),
        }}
        returnType={'Promise<CallToolResult>'}
      >
        {''}
        <br />
        <br />
        {pathParamsMapping &&
          Object.entries(pathParamsMapping)
            .filter(([originalName, camelCaseName]) => originalName !== camelCaseName && isValidVarName(originalName))
            .map(([originalName, camelCaseName]) => `const ${originalName} = ${camelCaseName}`)
            .join('\n')}
        {pathParamsMapping && (
          <>
            <br />
            <br />
          </>
        )}
        {queryParamsMapping && queryParams.length > 0 && (
          <>
            {buildRemappingCode(queryParamsMapping, 'mappedParams', 'params')}
            <br />
            <br />
          </>
        )}
        {headerParamsMapping && headerParams.length > 0 && (
          <>
            {buildRemappingCode(headerParamsMapping, 'mappedHeaders', 'headers')}
            <br />
            <br />
          </>
        )}
        {requestName && 'const requestData = data'}
        <br />
        {isFormData && requestName && 'const formData = buildFormData(requestData)'}
        <br />
        {`const res = await fetch<${generics.join(', ')}>({ ${fetchConfig.join(', ')} })`}
        <br />
        {callToolResult}
      </Function>
    </File.Source>
  )
}
