import { isValidVarName, URLPath } from '@internals/utils'
import type { Ast } from '@kubb/core'
import { ast, FunctionParams } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import type { PluginZod } from '@kubb/plugin-zod'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginClient } from '../types.ts'
import { buildParamsMapping, getComments } from '../utils.ts'
import { Url } from './Url.tsx'

type Props = {
  name: string
  urlName?: string
  isExportable?: boolean
  isIndexable?: boolean
  isConfigurable?: boolean
  returnType?: string

  baseURL: string | undefined
  dataReturnType: PluginClient['resolvedOptions']['dataReturnType']
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['pathParamsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  node: Ast.OperationNode
  tsResolver: PluginTs['resolver']
  zodResolver?: PluginZod['resolver']
  children?: KubbReactNode
}

type GetParamsProps = {
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['paramsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  node: Ast.OperationNode
  tsResolver: PluginTs['resolver']
  isConfigurable: boolean
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

function getParams({ paramsType, paramsCasing, pathParamsType, node, tsResolver, isConfigurable }: GetParamsProps): Ast.FunctionParametersNode {
  const requestName = node.requestBody?.schema ? tsResolver.resolveDataName(node) : undefined

  return ast.createOperationParams(node, {
    paramsType,
    pathParamsType: paramsType === 'object' ? 'object' : pathParamsType === 'object' ? 'object' : 'inline',
    paramsCasing,
    resolver: tsResolver,
    extraParams: isConfigurable
      ? [
          ast.createFunctionParameter({
            name: 'config',
            type: ast.createParamsType({
              variant: 'reference',
              name: requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }',
            }),
            default: '{}',
          }),
        ]
      : [],
  })
}

export function Client({
  name,
  isExportable = true,
  isIndexable = true,
  returnType,
  baseURL,
  dataReturnType,
  parser,
  paramsType,
  paramsCasing,
  pathParamsType,
  node,
  tsResolver,
  zodResolver,
  urlName,
  children,
  isConfigurable = true,
}: Props): KubbReactNode {
  const path = new URLPath(node.path)
  const contentType = node.requestBody?.contentType ?? 'application/json'
  const isFormData = contentType === 'multipart/form-data'

  const originalPathParams = node.parameters.filter((p) => p.in === 'path')
  const casedPathParams = ast.caseParams(originalPathParams, paramsCasing)
  const originalQueryParams = node.parameters.filter((p) => p.in === 'query')
  const casedQueryParams = ast.caseParams(originalQueryParams, paramsCasing)
  const originalHeaderParams = node.parameters.filter((p) => p.in === 'header')
  const casedHeaderParams = ast.caseParams(originalHeaderParams, paramsCasing)

  const pathParamsMapping = paramsCasing && !urlName ? buildParamsMapping(originalPathParams, casedPathParams) : undefined
  const queryParamsMapping = paramsCasing ? buildParamsMapping(originalQueryParams, casedQueryParams) : undefined
  const headerParamsMapping = paramsCasing ? buildParamsMapping(originalHeaderParams, casedHeaderParams) : undefined

  const requestName = node.requestBody?.schema ? tsResolver.resolveDataName(node) : undefined
  const responseName = tsResolver.resolveResponseName(node)
  const queryParamsName = originalQueryParams.length > 0 ? tsResolver.resolveQueryParamsName(node, originalQueryParams[0]!) : undefined
  const headerParamsName = originalHeaderParams.length > 0 ? tsResolver.resolveHeaderParamsName(node, originalHeaderParams[0]!) : undefined

  const zodResponseName = zodResolver && parser === 'zod' ? zodResolver.resolveResponseName?.(node) : undefined
  const zodRequestName = zodResolver && parser === 'zod' && node.requestBody?.schema ? zodResolver.resolveDataName?.(node) : undefined

  const errorNames = node.responses
    .filter((r) => {
      const code = Number.parseInt(r.statusCode, 10)
      return code >= 400
    })
    .map((r) => tsResolver.resolveResponseStatusName(node, r.statusCode))

  const headers = [
    contentType !== 'application/json' && contentType !== 'multipart/form-data' ? `'Content-Type': '${contentType}'` : undefined,
    headerParamsName ? (headerParamsMapping ? '...mappedHeaders' : '...headers') : undefined,
  ].filter(Boolean)

  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const generics = [responseName, TError, requestName || 'unknown'].filter(Boolean)
  const paramsNode = getParams({
    paramsType,
    paramsCasing,
    pathParamsType,
    node,
    tsResolver,
    isConfigurable,
  })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  const urlParamsNode = Url.getParams({
    paramsType,
    paramsCasing,
    pathParamsType,
    node,
    tsResolver,
  })
  const callPrinter = functionPrinter({ mode: 'call' })
  const urlParamsCall = callPrinter.print(urlParamsNode) ?? ''

  const clientParams = FunctionParams.factory({
    config: {
      mode: 'object',
      children: {
        method: {
          value: JSON.stringify(node.method.toUpperCase()),
        },
        url: {
          value: urlName ? `${urlName}(${urlParamsCall}).url.toString()` : path.template,
        },
        baseURL:
          baseURL && !urlName
            ? {
                value: `\`${baseURL}\``,
              }
            : undefined,
        params: queryParamsName ? (queryParamsMapping ? { value: 'mappedParams' } : {}) : undefined,
        data: requestName
          ? {
              value: isFormData ? 'formData as FormData' : 'requestData',
            }
          : undefined,
        requestConfig: isConfigurable
          ? {
              mode: 'inlineSpread',
            }
          : undefined,
        headers: headers.length
          ? {
              value: isConfigurable ? `{ ${headers.join(', ')}, ...requestConfig.headers }` : `{ ${headers.join(', ')} }`,
            }
          : undefined,
      },
    },
  })

  const childrenElement = children ? (
    children
  ) : (
    <>
      {dataReturnType === 'full' && parser === 'zod' && zodResponseName && `return {...res, data: ${zodResponseName}.parse(res.data)}`}
      {dataReturnType === 'data' && parser === 'zod' && zodResponseName && `return ${zodResponseName}.parse(res.data)`}
      {dataReturnType === 'full' && parser === 'client' && 'return res'}
      {dataReturnType === 'data' && parser === 'client' && 'return res.data'}
    </>
  )

  return (
    <>
      <br />

      <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
        <Function
          name={name}
          async
          export={isExportable}
          params={paramsSignature}
          JSDoc={{
            comments: getComments(node),
          }}
          returnType={returnType}
        >
          {isConfigurable ? 'const { client: request = fetch, ...requestConfig } = config' : ''}
          <br />
          <br />
          {pathParamsMapping &&
            Object.entries(pathParamsMapping)
              .filter(([originalName, camelCaseName]) => isValidVarName(originalName) && originalName !== camelCaseName)
              .map(([originalName, camelCaseName]) => `const ${originalName} = ${camelCaseName}`)
              .join('\n')}
          {pathParamsMapping && (
            <>
              <br />
              <br />
            </>
          )}
          {queryParamsMapping && queryParamsName && (
            <>
              {`const mappedParams = params ? { ${Object.entries(queryParamsMapping)
                .map(([originalName, camelCaseName]) => `"${originalName}": params.${camelCaseName}`)
                .join(', ')} } : undefined`}
              <br />
              <br />
            </>
          )}
          {headerParamsMapping && headerParamsName && (
            <>
              {`const mappedHeaders = headers ? { ${Object.entries(headerParamsMapping)
                .map(([originalName, camelCaseName]) => `"${originalName}": headers.${camelCaseName}`)
                .join(', ')} } : undefined`}
              <br />
              <br />
            </>
          )}
          {parser === 'zod' && zodRequestName ? `const requestData = ${zodRequestName}.parse(data)` : requestName && 'const requestData = data'}
          <br />
          {isFormData && requestName && 'const formData = buildFormData(requestData)'}
          <br />
          {isConfigurable
            ? `const res = await request<${generics.join(', ')}>(${clientParams.toCall()})`
            : `const res = await fetch<${generics.join(', ')}>(${clientParams.toCall()})`}
          <br />
          {childrenElement}
        </Function>
      </File.Source>
    </>
  )
}

Client.getParams = getParams
