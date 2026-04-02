import { buildJSDoc, URLPath } from '@internals/utils'
import type { OperationNode } from '@kubb/ast/types'
import type { PluginTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import type { PluginZod } from '@kubb/plugin-zod'
import { File, FunctionParams } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { PluginClient } from '../types.ts'

import { Client } from './Client.tsx'

type OperationData = {
  node: OperationNode
  name: string
  tsResolver: PluginTs['resolver']
  zodResolver?: PluginZod['resolver']
}

type Props = {
  name: string
  isExportable?: boolean
  isIndexable?: boolean
  operations: Array<OperationData>
  baseURL: string | undefined
  dataReturnType: PluginClient['resolvedOptions']['dataReturnType']
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['pathParamsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  children?: FabricReactNode
}

type GenerateMethodProps = {
  node: OperationNode
  name: string
  tsResolver: PluginTs['resolver']
  zodResolver?: PluginZod['resolver']
  baseURL: string | undefined
  dataReturnType: PluginClient['resolvedOptions']['dataReturnType']
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  paramsType: PluginClient['resolvedOptions']['paramsType']
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
}

function getComments(node: OperationNode): Array<string> {
  return [
    node.description && `@description ${node.description}`,
    node.summary && `@summary ${node.summary}`,
    node.path && `{@link ${new URLPath(node.path).URL}}`,
    node.deprecated && '@deprecated',
  ]
    .filter((x): x is string => Boolean(x))
    .flatMap((text) => text.split(/\r?\n/).map((line) => line.trim()))
    .filter((x): x is string => Boolean(x))
}

function buildHeaders(contentType: string, hasHeaderParams: boolean): Array<string> {
  return [
    contentType !== 'application/json' && contentType !== 'multipart/form-data' ? `'Content-Type': '${contentType}'` : undefined,
    hasHeaderParams ? '...headers' : undefined,
  ].filter(Boolean) as Array<string>
}

function buildGenerics(node: OperationNode, tsResolver: PluginTs['resolver']): Array<string> {
  const responseName = tsResolver.resolveResponseName(node)
  const requestName = node.requestBody?.schema ? tsResolver.resolveDataName(node) : undefined
  const errorNames = node.responses.filter((r) => Number.parseInt(r.statusCode, 10) >= 400).map((r) => tsResolver.resolveResponseStatusName(node, r.statusCode))
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`
  return [responseName, TError, requestName || 'unknown'].filter(Boolean)
}

function buildClientParams({
  node,
  path,
  baseURL,
  tsResolver,
  isFormData,
  headers,
}: {
  node: OperationNode
  path: URLPath
  baseURL: string | undefined
  tsResolver: PluginTs['resolver']
  isFormData: boolean
  headers: Array<string>
}) {
  const queryParamsName =
    node.parameters.filter((p) => p.in === 'query').length > 0
      ? tsResolver.resolveQueryParamsName(node, node.parameters.filter((p) => p.in === 'query')[0]!)
      : undefined
  const requestName = node.requestBody?.schema ? tsResolver.resolveDataName(node) : undefined

  return FunctionParams.factory({
    config: {
      mode: 'object',
      children: {
        requestConfig: {
          mode: 'inlineSpread',
        },
        method: {
          value: JSON.stringify(node.method.toUpperCase()),
        },
        url: {
          value: path.template,
        },
        baseURL: baseURL
          ? {
              value: JSON.stringify(baseURL),
            }
          : undefined,
        params: queryParamsName ? {} : undefined,
        data: requestName
          ? {
              value: isFormData ? 'formData as FormData' : 'requestData',
            }
          : undefined,
        headers: headers.length
          ? {
              value: `{ ${headers.join(', ')}, ...requestConfig.headers }`,
            }
          : undefined,
      },
    },
  })
}

function buildRequestDataLine({
  parser,
  node,
  zodResolver,
}: {
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  node: OperationNode
  zodResolver?: PluginZod['resolver']
}): string {
  const zodRequestName = zodResolver && parser === 'zod' && node.requestBody?.schema ? zodResolver.resolveDataName?.(node) : undefined
  if (parser === 'zod' && zodRequestName) {
    return `const requestData = ${zodRequestName}.parse(data)`
  }
  if (node.requestBody?.schema) {
    return 'const requestData = data'
  }
  return ''
}

function buildFormDataLine(isFormData: boolean, hasRequest: boolean): string {
  return isFormData && hasRequest ? 'const formData = buildFormData(requestData)' : ''
}

function buildReturnStatement({
  dataReturnType,
  parser,
  node,
  zodResolver,
}: {
  dataReturnType: PluginClient['resolvedOptions']['dataReturnType']
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  node: OperationNode
  zodResolver?: PluginZod['resolver']
}): string {
  const zodResponseName = zodResolver && parser === 'zod' ? zodResolver.resolveResponseName?.(node) : undefined
  if (dataReturnType === 'full' && parser === 'zod' && zodResponseName) {
    return `return {...res, data: ${zodResponseName}.parse(res.data)}`
  }
  if (dataReturnType === 'data' && parser === 'zod' && zodResponseName) {
    return `return ${zodResponseName}.parse(res.data)`
  }
  if (dataReturnType === 'full' && parser === 'client') {
    return 'return res'
  }
  return 'return res.data'
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

function generateMethod({
  node,
  name,
  tsResolver,
  zodResolver,
  baseURL,
  dataReturnType,
  parser,
  paramsType,
  paramsCasing,
  pathParamsType,
}: GenerateMethodProps): string {
  const path = new URLPath(node.path, { casing: paramsCasing })
  const contentType = node.requestBody?.contentType ?? 'application/json'
  const isFormData = contentType === 'multipart/form-data'
  const headerParamsName =
    node.parameters.filter((p) => p.in === 'header').length > 0
      ? tsResolver.resolveHeaderParamsName(node, node.parameters.filter((p) => p.in === 'header')[0]!)
      : undefined
  const headers = buildHeaders(contentType, !!headerParamsName)
  const generics = buildGenerics(node, tsResolver)
  const paramsNode = ClassClient.getParams({ paramsType, paramsCasing, pathParamsType, node, tsResolver, isConfigurable: true })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const clientParams = buildClientParams({ node, path, baseURL, tsResolver, isFormData, headers })
  const jsdoc = buildJSDoc(getComments(node))

  const requestDataLine = buildRequestDataLine({ parser, node, zodResolver })
  const formDataLine = buildFormDataLine(isFormData, !!node.requestBody?.schema)
  const returnStatement = buildReturnStatement({ dataReturnType, parser, node, zodResolver })

  const methodBody = [
    'const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)',
    '',
    requestDataLine,
    formDataLine,
    `const res = await request<${generics.join(', ')}>(${clientParams.toCall()})`,
    returnStatement,
  ]
    .filter(Boolean)
    .map((line) => `    ${line}`)
    .join('\n')

  return `${jsdoc}async ${name}(${paramsSignature}) {\n${methodBody}\n  }`
}

export function ClassClient({
  name,
  isExportable = true,
  isIndexable = true,
  operations,
  baseURL,
  dataReturnType,
  parser,
  paramsType,
  paramsCasing,
  pathParamsType,
  children,
}: Props): FabricReactNode {
  const methods = operations.map(({ node, name: methodName, tsResolver, zodResolver }) =>
    generateMethod({
      node,
      name: methodName,
      tsResolver,
      zodResolver,
      baseURL,
      dataReturnType,
      parser,
      paramsType,
      paramsCasing,
      pathParamsType,
    }),
  )

  const classCode = `export class ${name} {
  #config: Partial<RequestConfig> & { client?: Client }

  constructor(config: Partial<RequestConfig> & { client?: Client } = {}) {
    this.#config = config
  }

${methods.join('\n\n')}
}`

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      {classCode}
      {children}
    </File.Source>
  )
}
ClassClient.getParams = Client.getParams
