import { URLPath } from '@kubb/core/utils'
import { isOptional, type Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import { File, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
import type { PluginClient } from '../types.ts'

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
  children?: KubbNode
}

type GetParamsProps = {
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['paramsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
  isConfigurable: boolean
}

function getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas, isConfigurable }: GetParamsProps) {
  if (paramsType === 'object') {
    return FunctionParams.factory({
      data: {
        mode: 'object',
        children: {
          ...getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
          data: typeSchemas.request?.name
            ? {
                type: typeSchemas.request?.name,
                optional: isOptional(typeSchemas.request?.schema),
              }
            : undefined,
          params: typeSchemas.queryParams?.name
            ? {
                type: typeSchemas.queryParams?.name,
                optional: isOptional(typeSchemas.queryParams?.schema),
              }
            : undefined,
          headers: typeSchemas.headerParams?.name
            ? {
                type: typeSchemas.headerParams?.name,
                optional: isOptional(typeSchemas.headerParams?.schema),
              }
            : undefined,
        },
      },
      config: isConfigurable
        ? {
            type: typeSchemas.request?.name
              ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }`
              : 'Partial<RequestConfig> & { client?: typeof fetch }',
            default: '{}',
          }
        : undefined,
    })
  }

  return FunctionParams.factory({
    pathParams: typeSchemas.pathParams?.name
      ? {
          mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
          children: getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
          optional: isOptional(typeSchemas.pathParams?.schema),
        }
      : undefined,
    data: typeSchemas.request?.name
      ? {
          type: typeSchemas.request?.name,
          optional: isOptional(typeSchemas.request?.schema),
        }
      : undefined,
    params: typeSchemas.queryParams?.name
      ? {
          type: typeSchemas.queryParams?.name,
          optional: isOptional(typeSchemas.queryParams?.schema),
        }
      : undefined,
    headers: typeSchemas.headerParams?.name
      ? {
          type: typeSchemas.headerParams?.name,
          optional: isOptional(typeSchemas.headerParams?.schema),
        }
      : undefined,
    config: isConfigurable
      ? {
          type: typeSchemas.request?.name
            ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }`
            : 'Partial<RequestConfig> & { client?: typeof fetch }',
          default: '{}',
        }
      : undefined,
  })
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
}: {
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
}): string {
  const path = new URLPath(operation.path, { casing: paramsCasing })
  const contentType = operation.getContentType()
  const isFormData = contentType === 'multipart/form-data'
  const headers = [
    contentType !== 'application/json' && contentType !== 'multipart/form-data' ? `'Content-Type': '${contentType}'` : undefined,
    typeSchemas.headerParams?.name ? '...headers' : undefined,
  ].filter(Boolean)

  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`
  const generics = [typeSchemas.response.name, TError, typeSchemas.request?.name || 'unknown'].filter(Boolean)
  const params = getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas, isConfigurable: true })

  const clientParams = FunctionParams.factory({
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

  const comments = getComments(operation)
  const jsdoc = comments.length > 0 ? `/**\n${comments.map((c) => `   * ${c}`).join('\n')}\n   */\n  ` : '  '

  const requestDataLine =
    parser === 'zod' && zodSchemas?.request?.name
      ? `const requestData = ${zodSchemas.request.name}.parse(data)`
      : typeSchemas?.request?.name
        ? 'const requestData = data'
        : ''

  const formDataLine = isFormData && typeSchemas?.request?.name ? 'const formData = buildFormData(requestData)' : ''

  const returnStatement =
    dataReturnType === 'full' && parser === 'zod' && zodSchemas
      ? `return {...res, data: ${zodSchemas.response.name}.parse(res.data)}`
      : dataReturnType === 'data' && parser === 'zod' && zodSchemas
        ? `return ${zodSchemas.response.name}.parse(res.data)`
        : dataReturnType === 'full' && parser === 'client'
          ? 'return res'
          : 'return res.data'

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
}: Props): KubbNode {
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
