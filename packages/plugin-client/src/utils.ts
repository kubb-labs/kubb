import { URLPath } from '@internals/utils'
import type { OperationNode, ParameterNode } from '@kubb/ast/types'
import { FunctionParams } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import type { PluginZod } from '@kubb/plugin-zod'
import type { PluginClient } from './types.ts'

export function getComments(node: OperationNode): Array<string> {
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

export function buildParamsMapping(originalParams: Array<ParameterNode>, casedParams: Array<ParameterNode>): Record<string, string> | undefined {
  const mapping: Record<string, string> = {}
  let hasChanged = false
  originalParams.forEach((param, i) => {
    const casedName = casedParams[i]?.name ?? param.name
    mapping[param.name] = casedName
    if (param.name !== casedName) {
      hasChanged = true
    }
  })
  return hasChanged ? mapping : undefined
}

export function buildHeaders(contentType: string, hasHeaderParams: boolean): Array<string> {
  return [
    contentType !== 'application/json' && contentType !== 'multipart/form-data' ? `'Content-Type': '${contentType}'` : undefined,
    hasHeaderParams ? '...headers' : undefined,
  ].filter(Boolean) as Array<string>
}

export function buildGenerics(node: OperationNode, tsResolver: PluginTs['resolver']): Array<string> {
  const responseName = tsResolver.resolveResponseName(node)
  const requestName = node.requestBody?.schema ? tsResolver.resolveDataName(node) : undefined
  const errorNames = node.responses.filter((r) => Number.parseInt(r.statusCode, 10) >= 400).map((r) => tsResolver.resolveResponseStatusName(node, r.statusCode))
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`
  return [responseName, TError, requestName || 'unknown'].filter(Boolean)
}

export function buildClassClientParams({
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

export function buildRequestDataLine({
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

export function buildFormDataLine(isFormData: boolean, hasRequest: boolean): string {
  return isFormData && hasRequest ? 'const formData = buildFormData(requestData)' : ''
}

export function buildReturnStatement({
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
