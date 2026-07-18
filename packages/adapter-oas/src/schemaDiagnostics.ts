import { resolveRefName } from '@kubb/ast'
import type { ast } from '@kubb/ast'
import { Diagnostics } from '@kubb/core'
import { isHandledFormat } from './emit/schemaShape.ts'

/**
 * Scans one freshly converted top-level schema in a single walk, so the post-convert pass never
 * sweeps the same nodes twice. It reports the advisory diagnostics (`KUBB_UNSUPPORTED_FORMAT`,
 * `KUBB_DEPRECATED`) and returns the names of every schema the node references, ready to feed the
 * circular-dependency graph.
 *
 * Walks the node the parser produced, threading the RFC 6901 pointer as it descends so a nested
 * field reports against its full path (`#/components/schemas/Pet/properties/owner/properties/name`).
 * Refs are recorded by name and not followed, so the resolved schema is reported under its own walk.
 * Reports land in the active build run, are a no-op outside one, and repeats are deduped by the build.
 */
export function scanSchema({ node, name }: { node: ast.SchemaNode; name: string }): Set<string> {
  const refs = new Set<string>()
  visit(node, `#/components/schemas/${escapePointerToken(name)}`, refs)
  return refs
}

/**
 * Escapes a single JSON pointer reference token per RFC 6901 (`~` → `~0`, `/` → `~1`), so a
 * property name with those characters maps to a distinct pointer instead of colliding in the dedupe.
 */
function escapePointerToken(token: string): string {
  return token.replace(/~/g, '~0').replace(/\//g, '~1')
}

function visit(node: ast.SchemaNode, pointer: string, refs: Set<string>): void {
  if (node.type === 'ref') {
    const refName = resolveRefName(node)
    if (refName) refs.add(refName)
  }

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
      visit(property.schema, `${pointer}/properties/${escapePointerToken(property.name)}`, refs)
    }
    if (node.additionalProperties && typeof node.additionalProperties === 'object') {
      visit(node.additionalProperties, `${pointer}/additionalProperties`, refs)
    }
    return
  }

  if (node.type === 'array') {
    for (const item of node.items ?? []) {
      visit(item, `${pointer}/items`, refs)
    }
    return
  }

  if (node.type === 'tuple') {
    // Each tuple position has its own pointer, so index them. A shared `/items` would collapse
    // distinct diagnostics in the dedupe.
    for (const [index, item] of (node.items ?? []).entries()) {
      visit(item, `${pointer}/items/${index}`, refs)
    }
    return
  }

  if (node.type === 'union' || node.type === 'intersection') {
    for (const [index, member] of (node.members ?? []).entries()) {
      visit(member, `${pointer}/members/${index}`, refs)
    }
  }
}
