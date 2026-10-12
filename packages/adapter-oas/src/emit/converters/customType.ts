import { type ast, Diagnostics } from '@kubb/kit'
import { createNode } from '../createNode.ts'
import type { ConvertContext } from '../parseSchema.ts'

export const customTypeExtension = 'x-kubb-type'

// Both values reach generated source, so only a (dotted) identifier and a quote-free path pass.
const typeNamePattern = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/

const importPathPattern = /^[^'"`\r\n]+$/

function readCustomType(value: unknown): ast.CustomType | undefined {
  if (!value || typeof value !== 'object') return undefined

  const { name, import: importPath } = value as { name?: unknown; import?: unknown }
  if (typeof name !== 'string' || !typeNamePattern.test(name)) return undefined
  if (importPath === undefined) return { name }
  if (typeof importPath !== 'string' || !importPathPattern.test(importPath)) return undefined

  return { name, importPath }
}

/**
 * Turns a schema with `x-kubb-type: { name, import }` into an `unknown` node with `customType` set.
 * An invalid value is reported and the schema is parsed without it.
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
