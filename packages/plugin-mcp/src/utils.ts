import { camelCase } from '@internals/utils'
import type { ast } from '@kubb/core'

/**
 * Find the first 2xx response status code from an operation's responses.
 */
export function findSuccessStatusCode(responses: Array<{ statusCode: number | string }>): ast.StatusCode | undefined {
  for (const res of responses) {
    const code = Number(res.statusCode)
    if (code >= 200 && code < 300) {
      return res.statusCode as ast.StatusCode
    }
  }
  return undefined
}

export type ZodParam = {
  name: string
  schemaName: string
}

/**
 * Render a group param value — either a group schema name directly (kubbV4),
 * or compose individual schemas into `z.object({ ... })` (v5).
 */
export function zodGroupExpr(entry: string | Array<ZodParam>): string {
  if (typeof entry === 'string') {
    return entry
  }
  const entries = entry.map((p) => `${JSON.stringify(p.name)}: ${p.schemaName}`)
  return `z.object({ ${entries.join(', ')} })`
}

/**
 * Build JSDoc comment lines from an OperationNode.
 */
export function getComments(node: ast.OperationNode): Array<string> {
  return [
    node.description && `@description ${node.description}`,
    node.summary && `@summary ${node.summary}`,
    node.deprecated && '@deprecated',
    `{@link ${node.path.replaceAll('{', ':').replaceAll('}', '')}}`,
  ].filter((x): x is string => Boolean(x))
}

/**
 * Build a mapping of original param names → camelCase names.
 * Returns `undefined` when no names actually change (no remapping needed).
 */
export function getParamsMapping(params: Array<{ name: string }>): Record<string, string> | undefined {
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

/**
 * Convert a SchemaNode type to an inline Zod expression string.
 * Used as fallback when no named zod schema is available for a path parameter.
 */
export function zodExprFromSchemaNode(schema: ast.SchemaNode): string {
  let expr: string
  switch (schema.type) {
    case 'enum': {
      // namedEnumValues takes priority over enumValues
      const rawValues: Array<string | number | boolean> = schema.namedEnumValues?.length
        ? schema.namedEnumValues.map((v) => v.value)
        : (schema.enumValues ?? []).filter((v): v is string | number | boolean => v !== null)

      if (rawValues.length > 0 && rawValues.every((v) => typeof v === 'string')) {
        expr = `z.enum([${rawValues.map((v) => JSON.stringify(v)).join(', ')}])`
      } else if (rawValues.length > 0) {
        const literals = rawValues.map((v) => `z.literal(${JSON.stringify(v)})`)
        expr = literals.length === 1 ? literals[0]! : `z.union([${literals.join(', ')}])`
      } else {
        expr = 'z.string()'
      }
      break
    }
    case 'integer':
      expr = 'z.coerce.number()'
      break
    case 'number':
      expr = 'z.number()'
      break
    case 'boolean':
      expr = 'z.boolean()'
      break
    case 'array':
      expr = 'z.array(z.unknown())'
      break
    default:
      expr = 'z.string()'
  }

  if (schema.nullable) {
    expr = `${expr}.nullable()`
  }

  return expr
}
