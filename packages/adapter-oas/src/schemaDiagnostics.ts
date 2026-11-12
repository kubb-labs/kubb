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

// Pointers per unsupported format, collected while `groupUnsupportedFormats` runs.
let formatTally: Map<string, Set<string>> | undefined

/**
 * Runs `fn` and reports `KUBB_UNSUPPORTED_FORMAT` once per format with the number of schemas that use it,
 * instead of once per schema. `format` is an open value in OpenAPI, so a large spec would otherwise print
 * thousands of warnings that say the same thing. `fn` must be synchronous.
 */
export function groupUnsupportedFormats<T>(fn: () => T): T {
  formatTally = new Map()
  try {
    return fn()
  } finally {
    const tally = formatTally
    formatTally = undefined
    for (const [format, pointers] of tally) reportUnsupportedFormat(format, [...pointers])
  }
}

function tallyFormat(format: string, pointer: string): void {
  if (!formatTally) return reportUnsupportedFormat(format, [pointer])
  formatTally.set(format, (formatTally.get(format) ?? new Set()).add(pointer))
}

function reportUnsupportedFormat(format: string, pointers: Array<string>): void {
  const count = pointers.length
  Diagnostics.report({
    code: Diagnostics.code.unsupportedFormat,
    severity: 'warning',
    message:
      count === 1
        ? `Kubb does not map the format "${format}" to a specific type, so it falls back to the base type.`
        : `Kubb does not map the format "${format}" to a specific type, so ${count} schemas fall back to the base type.`,
    help: `Use a format Kubb supports, or handle "${format}" with a custom parser or plugin.`,
    location: { kind: 'schema', pointer: pointers[0]! },
  })
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
    tallyFormat(node.format, pointer)
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
  const membersByValue = new Map<Literal, Array<string>>()

  for (const [index, member] of (node.members ?? []).entries()) {
    const label = memberName(member) ?? `${keyword}/${index}`
    for (const value of memberValues(member, propertyName)) membersByValue.set(value, [...(membersByValue.get(value) ?? []), label])
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

type Literal = string | number | boolean | null

// Values a member allows for the discriminator. A nested `oneOf`/`anyOf` allows any of its alternatives' values.
function memberValues(node: ast.SchemaNode, propertyName: string, seen = new Set<ast.SchemaNode>()): Array<Literal> {
  if (seen.has(node)) return []
  seen.add(node)
  const target = node.type === 'ref' && node.schema ? node.schema : node
  if (target.type === 'union') return [...new Set(target.members?.flatMap((member) => memberValues(member, propertyName, seen)))]

  return intersect(ast.schema.findProperties({ node, propertyName }).map((property) => [...ast.schema.getLiterals(property.schema)]))
}

// Every slice that pins values narrows the set, so only values they all allow count. Unpinned slices are ignored.
function intersect(slices: Array<Array<Literal>>): Array<Literal> {
  const pinned = slices.filter((values) => values.length > 0)
  return pinned.reduce((acc, values) => acc.filter((value) => values.includes(value)), pinned[0] ?? [])
}

// A member is a `$ref`, or an intersection of the `$ref` and its narrowed discriminant.
function memberName(member: ast.SchemaNode): string | undefined {
  if (member.type === 'ref') return member.name ?? undefined
  if (member.type === 'intersection') return member.members?.map(memberName).find(Boolean)
  return undefined
}
