import type { ast } from '@kubb/ast'
import { Diagnostics } from '@kubb/core'
import { isHandledFormat } from './resolvers.ts'

/**
 * Reports the advisory diagnostics (`KUBB_UNSUPPORTED_FORMAT`, `KUBB_DEPRECATED`) for one
 * top-level schema. Walks the node the parser produced during `preScan`, threading the RFC 6901
 * pointer as it descends so a nested field reports against its full path
 * (`#/components/schemas/Pet/properties/owner/properties/name`). Refs are not followed, so the
 * resolved schema is reported under its own walk. Reports land in the active build run, are a
 * no-op outside one, and repeats are deduped by the build.
 */
export function reportSchemaDiagnostics({ node, name }: { node: ast.SchemaNode; name: string }): void {
  visit(node, `#/components/schemas/${escapePointerToken(name)}`)
}

/**
 * Escapes a single JSON pointer reference token per RFC 6901 (`~` → `~0`, `/` → `~1`), so a
 * property name with those characters maps to a distinct pointer instead of colliding in the dedupe.
 */
function escapePointerToken(token: string): string {
  return token.replace(/~/g, '~0').replace(/\//g, '~1')
}

function visit(node: ast.SchemaNode, pointer: string): void {
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

  if (node.type === 'union' || node.type === 'intersection') {
    for (const [index, member] of (node.members ?? []).entries()) {
      visit(member, `${pointer}/members/${index}`)
    }
  }
}
