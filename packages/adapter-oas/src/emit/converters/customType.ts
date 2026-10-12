import { type ast, Diagnostics } from '@kubb/kit'
import { createNode } from '../createNode.ts'
import type { ConvertContext } from '../parseSchema.ts'

/**
 * Vendor extension that maps a schema to an existing TypeScript type, for values JSON Schema
 * cannot describe, such as functions or a `RegExp`.
 */
export const customTypeExtension = 'x-kubb-type'

/**
 * A type name, optionally dotted (`ts.Node`). Anything else would reach generated source as-is.
 */
const typeNamePattern = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/

/**
 * A module specifier printed inside quotes, so it must not hold a quote, a backtick, or a line break.
 */
const importPathPattern = /^[^'"`\r\n]+$/

/**
 * Reads `x-kubb-type: { name, import }`, or `undefined` when the value is not that shape.
 */
function readCustomType(value: unknown): ast.CustomType | undefined {
  if (!value || typeof value !== 'object') return undefined

  const { name, import: importPath } = value as { name?: unknown; import?: unknown }
  if (typeof name !== 'string' || !typeNamePattern.test(name)) return undefined
  if (importPath === undefined) return { name }
  if (typeof importPath !== 'string' || !importPathPattern.test(importPath)) return undefined

  return { name, importPath }
}

/**
 * Converts a schema carrying `x-kubb-type` into an `unknown` node with `customType` set, whatever
 * its other keywords say. An invalid extension value is reported and the schema is parsed without it.
 */
export function convertCustomType(ctx: ConvertContext): ast.SchemaNode {
  const { [customTypeExtension]: value, ...schema } = ctx.schema as ConvertContext['schema'] & Record<string, unknown>
  const customType = readCustomType(value)

  if (!customType) {
    Diagnostics.report({
      code: Diagnostics.code.invalidSpec,
      severity: 'warning',
      message: `\`${customTypeExtension}\` must be \`{ name, import? }\` with a TypeScript type name, so it is ignored.`,
      help: `Use for example \`${customTypeExtension}: { name: ResolverPatch, import: kubb/kit }\`.`,
    })
    return ctx.parse({ schema, name: ctx.name })
  }

  return createNode(ctx, { type: 'unknown', customType })
}
