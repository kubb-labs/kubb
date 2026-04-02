import { buildJSDoc, URLPath } from '@internals/utils'
import type { OperationNode } from '@kubb/ast/types'
import type { PluginTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import type { PluginZod } from '@kubb/plugin-zod'
import { File } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { PluginClient } from '../types.ts'
import { buildClassClientParams, buildFormDataLine, buildGenerics, buildHeaders, buildRequestDataLine, buildReturnStatement, getComments } from '../utils.ts'
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
  const paramsNode = Client.getParams({ paramsType, paramsCasing, pathParamsType, node, tsResolver, isConfigurable: true })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const clientParams = buildClassClientParams({ node, path, baseURL, tsResolver, isFormData, headers })
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

  return `${jsdoc}  static async ${name}(${paramsSignature}) {\n${methodBody}\n  }`
}

export function StaticClassClient({
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

  const classCode = `export class ${name} {\n  static #config: Partial<RequestConfig> & { client?: Client } = {}\n\n${methods.join('\n\n')}\n}`

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      {classCode}
      {children}
    </File.Source>
  )
}
StaticClassClient.getParams = Client.getParams
