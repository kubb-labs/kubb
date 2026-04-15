import type { OperationNode, ParameterNode } from '@kubb/ast/types'
import type { Operation } from '@kubb/oas'
import type { OperationSchema, OperationSchemas } from '@kubb/plugin-oas'
import type { ResolveNameParams } from '@kubb/core'
import type { PluginReactQuery } from './types.ts'

/**
 * Apply the user-provided `transformers.name` function (if any) to a resolved name.
 * Mirrors the old `createPlugin` `resolveName` lifecycle that applied transformers
 * after resolving the full name (base + suffix).
 */
export function transformName(
  name: string,
  type: ResolveNameParams['type'],
  transformers?: PluginReactQuery['resolvedOptions']['transformers'],
): string {
  return transformers?.name?.(name, type) || name
}

/**
 * Builds a legacy `Operation`-compatible duck-type wrapper from an `OperationNode`.
 * Used by the existing react-query React components that still accept `Operation`.
 */
export function buildLegacyOperation(node: OperationNode): Operation {
  return {
    path: node.path,
    method: node.method.toLowerCase(),
    getDescription: () => node.description,
    getSummary: () => node.summary,
    isDeprecated: () => node.deprecated ?? false,
    getOperationId: () => node.operationId,
    getContentType: () => node.requestBody?.contentType ?? 'application/json',
  } as unknown as Operation
}

function buildSchemaProps(params: ParameterNode[]): { properties: Record<string, { type: string }>; required: string[] } {
  const properties: Record<string, { type: string }> = {}
  const required: string[] = []
  for (const p of params) {
    properties[p.name] = { type: p.schema?.primitive ?? 'unknown' }
    if (p.required) required.push(p.name)
  }
  return { properties, required }
}

/**
 * Builds a legacy-compatible `OperationSchemas` object from an `OperationNode` + resolver.
 * Used by the existing react-query React components that still accept `OperationSchemas`.
 */
// biome-ignore lint/suspicious/noExplicitAny: bridge between v5 resolver types and legacy OperationSchemas format
export function buildLegacyTypeSchemas(node: OperationNode, resolver: any): OperationSchemas {
  const pathParams = node.parameters.filter((p) => p.in === 'path')
  const queryParams = node.parameters.filter((p) => p.in === 'query')
  const headerParams = node.parameters.filter((p) => p.in === 'header')

  return {
    response: { name: resolver.resolveResponseName(node) } as OperationSchema,
    request: node.requestBody?.schema
      ? ({
          name: resolver.resolveDataName(node),
          schema: { required: node.requestBody.required ? ['body'] : [] },
        } as OperationSchema)
      : undefined,
    pathParams:
      pathParams.length > 0 && resolver.resolvePathParamsName
        ? ({
            name: resolver.resolvePathParamsName(node, pathParams[0]!),
            schema: buildSchemaProps(pathParams),
            keys: pathParams.map((p) => (p.required ? p.name : `${p.name}?`)),
            keysToOmit: undefined,
          } as OperationSchema & { keysToOmit?: undefined })
        : undefined,
    queryParams:
      queryParams.length > 0 && resolver.resolveQueryParamsName
        ? ({
            name: resolver.resolveQueryParamsName(node, queryParams[0]!),
            schema: buildSchemaProps(queryParams),
            keys: queryParams.map((p) => (p.required ? p.name : `${p.name}?`)),
            keysToOmit: undefined,
          } as OperationSchema & { keysToOmit?: undefined })
        : undefined,
    headerParams:
      headerParams.length > 0 && resolver.resolveHeaderParamsName
        ? ({
            name: resolver.resolveHeaderParamsName(node, headerParams[0]!),
            schema: buildSchemaProps(headerParams),
            keys: headerParams.map((p) => (p.required ? p.name : `${p.name}?`)),
            keysToOmit: undefined,
          } as OperationSchema & { keysToOmit?: undefined })
        : undefined,
    errors: node.responses
      .filter((r) => {
        const code = Number.parseInt(r.statusCode, 10)
        return code >= 400 || r.statusCode === 'default'
      })
      .map((r) => ({ name: resolver.resolveResponseStatusName(node, r.statusCode) }) as OperationSchema),
    statusCodes: node.responses.map((r) => ({ name: resolver.resolveResponseStatusName(node, r.statusCode) }) as OperationSchema),
    responses: node.responses.map(
      (r) =>
        ({
          name: resolver.resolveResponseStatusName(node, r.statusCode),
          keys: ('properties' in r.schema && Array.isArray(r.schema.properties))
            ? r.schema.properties.map((p: { name: string; required?: boolean }) => (p.required ? p.name : `${p.name}?`))
            : [],
        }) as OperationSchema,
    ),
  }
}

/**
 * Collect type import names from OperationNode + tsResolver.
 */
// biome-ignore lint/suspicious/noExplicitAny: bridge between v5 resolver types from different plugins
export function resolveImportedTypeNames(node: OperationNode, tsResolver: any): string[] {
  const pathParams = node.parameters.filter((p) => p.in === 'path')
  const queryParams = node.parameters.filter((p) => p.in === 'query')
  const headerParams = node.parameters.filter((p) => p.in === 'header')

  return [
    ...pathParams.map((p) => tsResolver.resolvePathParamsName(node, p)),
    ...queryParams.map((p) => tsResolver.resolveQueryParamsName(node, p)),
    ...headerParams.map((p) => tsResolver.resolveHeaderParamsName(node, p)),
    node.requestBody?.schema ? tsResolver.resolveDataName(node) : undefined,
    tsResolver.resolveResponseName(node),
    ...node.responses.map((res) => tsResolver.resolveResponseStatusName(node, res.statusCode)),
  ].filter(Boolean) as string[]
}

