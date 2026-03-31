import { stringify, toRegExpString } from '@internals/utils'
import { extractRefName } from '@kubb/ast'
import type { OperationNode, ParameterNode, SchemaNode } from '@kubb/ast/types'
import type { ResolverZod } from './types.ts'

export function buildSchemaNames(node: OperationNode, params: Array<ParameterNode>, resolver: ResolverZod) {
  const pathParam = params.find((p) => p.in === 'path')
  const queryParam = params.find((p) => p.in === 'query')
  const headerParam = params.find((p) => p.in === 'header')

  const responses: Record<number | string, string> = {}
  const errors: Record<number | string, string> = {}

  for (const res of node.responses) {
    const name = resolver.resolveResponseStatusName(node, res.statusCode)
    const statusNum = Number(res.statusCode)

    if (!Number.isNaN(statusNum)) {
      responses[statusNum] = name
      if (statusNum >= 400) {
        errors[statusNum] = name
      }
    }
  }

  responses['default'] = resolver.resolveResponseName(node)

  return {
    request: node.requestBody?.schema ? resolver.resolveDataName(node) : undefined,
    parameters: {
      path: pathParam ? resolver.resolvePathParamsName(node, pathParam) : undefined,
      query: queryParam ? resolver.resolveQueryParamsName(node, queryParam) : undefined,
      header: headerParam ? resolver.resolveHeaderParamsName(node, headerParam) : undefined,
    },
    responses,
    errors,
  }
}


/**
 * Format a default value as a code-level literal.
 * Objects become `{}`, primitives become their string representation, strings are quoted.
 */
export function formatDefault(value: unknown): string {
  if (typeof value === 'string') return stringify(value)
  if (typeof value === 'object' && value !== null) return '{}'
  return String(value ?? '')
}

/**
 * Format a primitive enum/literal value.
 * Strings are quoted; numbers and booleans are emitted raw.
 */
export function formatLiteral(v: string | number | boolean): string {
  if (typeof v === 'string') return stringify(v)
  return String(v)
}

export type NumericConstraints = {
  min?: number
  max?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  multipleOf?: number
}

export type LengthConstraints = {
  min?: number
  max?: number
  pattern?: string
}

export type ModifierOptions = {
  value: string
  nullable?: boolean
  optional?: boolean
  nullish?: boolean
  defaultValue?: unknown
  description?: string
}

/**
 * Build `.min()` / `.max()` / `.gt()` / `.lt()` constraint chains for numbers
 * using the standard chainable Zod v4 API.
 */
export function numberConstraints({ min, max, exclusiveMinimum, exclusiveMaximum, multipleOf }: NumericConstraints): string {
  return [
    min !== undefined ? `.min(${min})` : '',
    max !== undefined ? `.max(${max})` : '',
    exclusiveMinimum !== undefined ? `.gt(${exclusiveMinimum})` : '',
    exclusiveMaximum !== undefined ? `.lt(${exclusiveMaximum})` : '',
    multipleOf !== undefined ? `.multipleOf(${multipleOf})` : '',
  ].join('')
}

/**
 * Build `.min()` / `.max()` / `.regex()` chains for strings/arrays
 * using the standard chainable Zod v4 API.
 */
export function lengthConstraints({ min, max, pattern }: LengthConstraints): string {
  return [
    min !== undefined ? `.min(${min})` : '',
    max !== undefined ? `.max(${max})` : '',
    pattern !== undefined ? `.regex(${toRegExpString(pattern, null)})` : '',
  ].join('')
}

/**
 * Build `.check(z.minimum(), z.maximum())` for `zod/mini` numeric constraints.
 */
export function numberChecksMini({ min, max, exclusiveMinimum, exclusiveMaximum, multipleOf }: NumericConstraints): string {
  const checks: string[] = []
  if (min !== undefined) checks.push(`z.minimum(${min})`)
  if (max !== undefined) checks.push(`z.maximum(${max})`)
  if (exclusiveMinimum !== undefined) checks.push(`z.minimum(${exclusiveMinimum}, { exclusive: true })`)
  if (exclusiveMaximum !== undefined) checks.push(`z.maximum(${exclusiveMaximum}, { exclusive: true })`)
  if (multipleOf !== undefined) checks.push(`z.multipleOf(${multipleOf})`)
  return checks.length ? `.check(${checks.join(', ')})` : ''
}

/**
 * Build `.check(z.minLength(), z.maxLength(), z.regex())` for `zod/mini` length constraints.
 */
export function lengthChecksMini({ min, max, pattern }: LengthConstraints): string {
  const checks: string[] = []
  if (min !== undefined) checks.push(`z.minLength(${min})`)
  if (max !== undefined) checks.push(`z.maxLength(${max})`)
  if (pattern !== undefined) checks.push(`z.regex(${toRegExpString(pattern, null)})`)
  return checks.length ? `.check(${checks.join(', ')})` : ''
}

/**
 * Apply nullable / optional / nullish modifiers and an optional `.describe()` call
 * to a schema value string using the chainable Zod v4 API.
 */
export function applyModifiers({ value, nullable, optional, nullish, defaultValue, description }: ModifierOptions): string {
  let result = value
  if (nullish || (nullable && optional)) {
    result = `${result}.nullish()`
  } else if (optional) {
    result = `${result}.optional()`
  } else if (nullable) {
    result = `${result}.nullable()`
  }
  if (defaultValue !== undefined) {
    result = `${result}.default(${formatDefault(defaultValue)})`
  }
  if (description) {
    result = `${result}.describe(${stringify(description)})`
  }
  return result
}

/**
 * Apply nullable / optional / nullish modifiers using the functional `zod/mini` API
 * (`z.nullable()`, `z.optional()`, `z.nullish()`).
 */
export function applyMiniModifiers({ value, nullable, optional, nullish, defaultValue }: Omit<ModifierOptions, 'description'>): string {
  let result = value
  if (nullish) {
    result = `z.nullish(${result})`
  } else {
    if (nullable) {
      result = `z.nullable(${result})`
    }
    if (optional) {
      result = `z.optional(${result})`
    }
  }
  if (defaultValue !== undefined) {
    result = `z._default(${result}, ${formatDefault(defaultValue)})`
  }
  return result
}

/**
 * Returns true when the schema tree contains a self-referential `$ref`
 * whose resolved name matches `schemaName`.
 *
 * A `visited` set prevents infinite recursion on circular schema graphs.
 */
export function containsSelfRef(node: SchemaNode, schemaName: string, resolver: ResolverZod | undefined, visited: Set<SchemaNode> = new Set()): boolean {
  if (visited.has(node)) return false
  visited.add(node)

  if (node.type === 'ref' && node.ref) {
    const rawName = extractRefName(node.ref) ?? node.name
    const resolved = rawName ? (resolver?.default(rawName, 'function') ?? rawName) : node.name
    return resolved === schemaName
  }
  if (node.type === 'object') {
    if (node.properties?.some((p) => containsSelfRef(p.schema, schemaName, resolver, visited))) return true
    if (node.additionalProperties && node.additionalProperties !== true) {
      return containsSelfRef(node.additionalProperties, schemaName, resolver, visited)
    }
    return false
  }
  if (node.type === 'array' || node.type === 'tuple') {
    return node.items?.some((item) => containsSelfRef(item, schemaName, resolver, visited)) ?? false
  }
  if (node.type === 'union' || node.type === 'intersection') {
    return node.members?.some((m) => containsSelfRef(m, schemaName, resolver, visited)) ?? false
  }
  return false
}
