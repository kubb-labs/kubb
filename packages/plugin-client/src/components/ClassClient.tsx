import { buildJSDoc, URLPath } from '@kubb/core/utils'
import type { Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments } from '@kubb/plugin-oas/utils'
import { File, FunctionParams } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { PluginClient } from '../types.ts'

import { Client } from './Client.tsx'

type Props = {
  /**
   * Name of the class
   */
  name: string
  isExportable?: boolean
  isIndexable?: boolean
  operations: Array<{
    operation: Operation
    name: string
    typeSchemas: OperationSchemas
    zodSchemas: OperationSchemas | undefined
  }>
  baseURL: string | undefined
  dataReturnType: PluginClient['resolvedOptions']['dataReturnType']
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['pathParamsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  children?: FabricReactNode
}

type GenerateMethodProps = {
  operation: Operation
  name: string
  typeSchemas: OperationSchemas
  zodSchemas: OperationSchemas | undefined
  baseURL: string | undefined
  dataReturnType: PluginClient['resolvedOptions']['dataReturnType']
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  paramsType: PluginClient['resolvedOptions']['paramsType']
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
}

function buildHeaders(contentType: string, hasHeaderParams: boolean): Array<string> {
  return [
    contentType !== 'application/json' && contentType !== 'multipart/form-data' ? `'Content-Type': '${contentType}'` : undefined,
    hasHeaderParams ? '...headers' : undefined,
  ].filter(Boolean) as Array<string>
}

function buildGenerics(typeSchemas: OperationSchemas): Array<string> {
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`
  return [typeSchemas.response.name, TError, typeSchemas.request?.name || 'unknown'].filter(Boolean)
}

function buildClientParams({
  operation,
  path,
  baseURL,
  typeSchemas,
  isFormData,
  headers,
}: {
  operation: Operation
  path: URLPath
  baseURL: string | undefined
  typeSchemas: OperationSchemas
  isFormData: boolean
  headers: Array<string>
}) {
  return FunctionParams.factory({
    config: {
      mode: 'object',
      children: {
        method: {
          value: JSON.stringify(operation.method.toUpperCase()),
        },
        url: {
          value: path.template,
        },
        baseURL: baseURL
          ? {
              value: JSON.stringify(baseURL),
            }
          : undefined,
        params: typeSchemas.queryParams?.name ? {} : undefined,
        data: typeSchemas.request?.name
          ? {
              value: isFormData ? 'formData as FormData' : 'requestData',
            }
          : undefined,
        requestConfig: {
          mode: 'inlineSpread',
        },
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
  zodSchemas,
  typeSchemas,
}: {
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  zodSchemas: OperationSchemas | undefined
  typeSchemas: OperationSchemas
}): string {
  if (parser === 'zod' && zodSchemas?.request?.name) {
    return `const requestData = ${zodSchemas.request.name}.parse(data)`
  }
  if (typeSchemas?.request?.name) {
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
  zodSchemas,
}: {
  dataReturnType: PluginClient['resolvedOptions']['dataReturnType']
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  zodSchemas: OperationSchemas | undefined
}): string {
  if (dataReturnType === 'full' && parser === 'zod' && zodSchemas) {
    return `return {...res, data: ${zodSchemas.response.name}.parse(res.data)}`
  }
  if (dataReturnType === 'data' && parser === 'zod' && zodSchemas) {
    return `return ${zodSchemas.response.name}.parse(res.data)`
  }
  if (dataReturnType === 'full' && parser === 'client') {
    return 'return res'
  }
  return 'return res.data'
}

function generateMethod({
  operation,
  name,
  typeSchemas,
  zodSchemas,
  baseURL,
  dataReturnType,
  parser,
  paramsType,
  paramsCasing,
  pathParamsType,
}: GenerateMethodProps): string {
  const path = new URLPath(operation.path, { casing: paramsCasing })
  const contentType = operation.getContentType()
  const isFormData = contentType === 'multipart/form-data'
  const headers = buildHeaders(contentType, !!typeSchemas.headerParams?.name)
  const generics = buildGenerics(typeSchemas)
  const params = ClassClient.getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas, isConfigurable: true })
  const clientParams = buildClientParams({ operation, path, baseURL, typeSchemas, isFormData, headers })
  const jsdoc = buildJSDoc(getComments(operation))

  const requestDataLine = buildRequestDataLine({ parser, zodSchemas, typeSchemas })
  const formDataLine = buildFormDataLine(isFormData, !!typeSchemas?.request?.name)
  const returnStatement = buildReturnStatement({ dataReturnType, parser, zodSchemas })

  const methodBody = [
    'const { client: request = this.#client, ...requestConfig } = config',
    '',
    requestDataLine,
    formDataLine,
    `const res = await request<${generics.join(', ')}>(${clientParams.toCall()})`,
    returnStatement,
  ]
    .filter(Boolean)
    .map((line) => `    ${line}`)
    .join('\n')

  return `${jsdoc}async ${name}(${params.toConstructor()}) {\n${methodBody}\n  }`
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
  const methods = operations.map(({ operation, name: methodName, typeSchemas, zodSchemas }) =>
    generateMethod({
      operation,
      name: methodName,
      typeSchemas,
      zodSchemas,
      baseURL,
      dataReturnType,
      parser,
      paramsType,
      paramsCasing,
      pathParamsType,
    }),
  )

  const classCode = `export class ${name} {
  #client: typeof fetch

  constructor(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    this.#client = config.client || fetch
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
