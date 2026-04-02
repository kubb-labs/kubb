import { camelCase, isValidVarName, URLPath } from '@internals/utils'
import { caseParams, createOperationParams } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'

type Props = {
  /**
   * Name of the handler function.
   */
  name: string
  /**
   * AST operation node.
   */
  node: OperationNode
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
  dataReturnType: 'data' | 'full'
  /**
   * How to style your params.
   */
  paramsCasing?: 'camelcase'
}

function getComments(node: OperationNode): Array<string> {
  const comments: Array<string | undefined> = []

  if (node.description) {
    comments.push(`@description ${node.description}`)
  }
  if (node.summary) {
    comments.push(`@summary ${node.summary}`)
  }
  if (node.deprecated) {
    comments.push('@deprecated')
  }

  comments.push(`{@link ${node.path.replaceAll('{', ':').replaceAll('}', '')}}`)

  return comments.filter(Boolean) as Array<string>
}

function getParamsMapping(params: Array<{ name: string }>, _options: { casing: 'camelcase' }): Record<string, string> | undefined {
  if (!params.length) {
    return undefined
  }

  const mapping: Record<string, string> = {}
  let hasDifference = false

  for (const p of params) {
    const camelName = camelCase(p.name)
    mapping[p.name] = camelName
    if (p.name !== camelName) {
      hasDifference = true
    }
  }

  return hasDifference ? mapping : undefined
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

function getParams({ node, resolver, paramsCasing }: { node: OperationNode; resolver: ResolverTs; paramsCasing?: 'camelcase' }): string {
  const paramsNode = createOperationParams(node, {
    paramsType: 'object',
    pathParamsType: 'inline',
    resolver,
    paramsCasing,
  })

  return declarationPrinter.print(paramsNode) ?? ''
}

export function McpHandler({ name, node, resolver, baseURL, dataReturnType, paramsCasing }: Props): FabricReactNode {
  const urlPath = new URLPath(node.path)
  const contentType = node.requestBody?.contentType
  const isFormData = contentType === 'multipart/form-data'

  const casedParams = caseParams(node.parameters, paramsCasing)
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

  const paramsSignature = getParams({ node, resolver, paramsCasing })

  const pathParamsMapping = paramsCasing ? getParamsMapping(originalPathParams, { casing: paramsCasing }) : undefined
  const queryParamsMapping = paramsCasing ? getParamsMapping(originalQueryParams, { casing: paramsCasing }) : undefined
  const headerParamsMapping = paramsCasing ? getParamsMapping(originalHeaderParams, { casing: paramsCasing }) : undefined

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
    <>
      <br />

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
              {`const mappedParams = params ? { ${Object.entries(queryParamsMapping)
                .map(([originalName, camelCaseName]) => `"${originalName}": params.${camelCaseName}`)
                .join(', ')} } : undefined`}
              <br />
              <br />
            </>
          )}
          {headerParamsMapping && headerParams.length > 0 && (
            <>
              {`const mappedHeaders = headers ? { ${Object.entries(headerParamsMapping)
                .map(([originalName, camelCaseName]) => `"${originalName}": headers.${camelCaseName}`)
                .join(', ')} } : undefined`}
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
    </>
  )
}

McpHandler.getParams = getParams
