import { escapePointerToken } from '@internals/utils'
import { ast, Diagnostics } from '@kubb/kit'
import { isHandledFormat } from './emit/schemaShape.ts'

/**
 * Links one freshly converted schema and its nested schemas to their RFC 6901 pointers
 * (`#/components/schemas/Pet/properties/owner/properties/name`), and reports the advisory
 * diagnostics (`KUBB_UNSUPPORTED_FORMAT`, `KUBB_DEPRECATED`, `KUBB_DUPLICATE_DISCRIMINATOR`) against them.
 * Refs are not followed, so the resolved schema is handled under its own walk.
 * Reports land in the active build run, are a no-op outside one, and repeats are deduped by the build.
 */
export function scanSchema(node: ast.SchemaNode, pointer = node.pointer): void {
  if (pointer) visit(node, pointer)
}

function visit(node: ast.SchemaNode, pointer: string): void {
  node.pointer ??= pointer
  if (node.deprecated) {
    Diagnostics.report({
      code: Diagnostics.code.deprecated,
      severity: 'info',
      message: 'This schema is marked as deprecated.',
      location: { kind: 'schema', pointer },
    })
  }

  if (typeof node.format === 'string' && !isHandledFormat(node.format)) {
    Diagnostics.report({
      code: Diagnostics.code.unsupportedFormat,
      severity: 'warning',
      message: `Kubb does not map the format "${node.format}" to a specific type, so it falls back to the base type.`,
      help: `Use a format Kubb supports, or handle "${node.format}" with a custom parser or plugin.`,
      location: { kind: 'schema', pointer },
    })
  }

  if (node.type === 'object') {
    for (const property of node.properties) {
      visit(property.schema, `${pointer}/properties/${escapePointerToken(property.name)}`)
    }
    if (node.additionalProperties && typeof node.additionalProperties === 'object') {
      visit(node.additionalProperties, `${pointer}/additionalProperties`)
    }
    return
  }

  if (node.type === 'array') {
    for (const item of node.items ?? []) {
      visit(item, `${pointer}/items`)
    }
    return
  }

  if (node.type === 'tuple') {
    // Each tuple position has its own pointer, so index them. A shared `/items` would collapse
    // distinct diagnostics in the dedupe.
    for (const [index, item] of (node.items ?? []).entries()) {
      visit(item, `${pointer}/items/${index}`)
    }
    return
  }

  if (node.type === 'not') {
    for (const member of node.members ?? []) visit(member, `${pointer}/not`)
    return
  }

  // shortcut: a member the parser adds, such as the wrapper around `not` with sibling keys, gets an index past the spec's own entries; set pointers in the converters if editors need those exact.
  if (node.type === 'union' && node.discriminatorPropertyName) reportDuplicateDiscriminators(node, node.discriminatorPropertyName, pointer)

  if (node.type === 'union' || node.type === 'intersection') {
    const keyword = node.type === 'intersection' ? 'allOf' : node.strategy === 'any' ? 'anyOf' : 'oneOf'
    for (const [index, member] of (node.members ?? []).entries()) {
      visit(member, `${pointer}/${keyword}/${index}`)
    }
  }
}

/**
 * Reports a declared discriminator whose value pins more than one member. The spec cannot tell
 * those members apart, and Zod's `z.discriminatedUnion` throws on the first parse.
 * One diagnostic per union, since the build dedupes by code and pointer.
 */
function reportDuplicateDiscriminators(node: ast.UnionSchemaNode, propertyName: string, pointer: string): void {
  const keyword = node.strategy === 'any' ? 'anyOf' : 'oneOf'
  const membersByValue = new Map<string | number | boolean | null, Array<string>>()

  for (const [index, member] of (node.members ?? []).entries()) {
    // Every slice of an intersection constrains the property, so only values they all allow count.
    const slices = ast
      .resolveSchemaProperties({ node: member, propertyName })
      .map((property) => ast.getSchemaLiteralValues(property.schema))
      .filter((values) => values.length > 0)
    const values = slices.reduce((acc, values) => acc.filter((value) => values.includes(value)), slices[0] ?? [])
    const label = memberName(member) ?? `${keyword}/${index}`

    for (const value of values) membersByValue.set(value, [...(membersByValue.get(value) ?? []), label])
  }

  const duplicates = [...membersByValue].filter(([, members]) => members.length > 1)
  if (!duplicates.length) return

  Diagnostics.report({
    code: Diagnostics.code.duplicateDiscriminator,
    severity: 'warning',
    message: duplicates
      .map(([value, members]) => `Discriminator "${propertyName}" value ${JSON.stringify(value)} matches more than one member (${members.join(', ')}).`)
      .join(' '),
    help: `Give each member its own "${propertyName}" value, or drop the discriminator. Zod's z.discriminatedUnion throws on the first parse of this union.`,
    location: { kind: 'schema', pointer },
  })
}

// A member is a `$ref`, or an intersection of the `$ref` and its narrowed discriminant.
function memberName(member: ast.SchemaNode): string | undefined {
  if (member.type === 'ref') return member.name ?? undefined
  if (member.type === 'intersection') return member.members?.map(memberName).find(Boolean)
  return undefined
}
