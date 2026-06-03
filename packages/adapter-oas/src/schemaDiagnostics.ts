import { diagnosticCode, Diagnostics } from '@kubb/core'
import type { ast } from '@kubb/core'
import { isHandledFormat } from './resolvers.ts'

/**
 * Reports the advisory diagnostics (`KUBB_UNSUPPORTED_FORMAT`, `KUBB_DEPRECATED`) for a
 * single top-level schema. It walks the node the parser already produced during `preScan`,
 * threading the RFC 6901 pointer as it descends, so a nested field reports against its full
 * path (`#/components/schemas/Pet/properties/owner/properties/name`) rather than its immediate
 * parent. Refs are not followed: the resolved schema is reported under its own top-level walk.
 * Reports land in the active build run; outside a build `Diagnostics.report` is a no-op and
 * repeats are collapsed by the build's deduplication.
 */
export function reportSchemaDiagnostics({ node, name }: { node: ast.SchemaNode; name: string }): void {
  visit(node, `#/components/schemas/${name}`)
}

function visit(node: ast.SchemaNode, pointer: string): void {
  if (node.deprecated) {
    Diagnostics.report({
      code: diagnosticCode.deprecated,
      severity: 'info',
      message: 'This schema is marked as deprecated.',
      location: { kind: 'schema', pointer },
    })
  }

  if (typeof node.format === 'string' && !isHandledFormat(node.format)) {
    Diagnostics.report({
      code: diagnosticCode.unsupportedFormat,
      severity: 'warning',
      message: `Kubb does not map the format "${node.format}" to a specific type, so it falls back to the base type.`,
      help: `Use a format Kubb supports, or handle "${node.format}" with a custom parser or plugin.`,
      location: { kind: 'schema', pointer },
    })
  }

  if (node.type === 'object') {
    for (const property of node.properties) {
      visit(property.schema, `${pointer}/properties/${property.name}`)
    }
    if (node.additionalProperties && typeof node.additionalProperties === 'object') {
      visit(node.additionalProperties, `${pointer}/additionalProperties`)
    }
    return
  }

  if (node.type === 'array' || node.type === 'tuple') {
    for (const item of node.items ?? []) {
      visit(item, `${pointer}/items`)
    }
    return
  }

  if (node.type === 'union' || node.type === 'intersection') {
    for (const member of node.members ?? []) {
      visit(member, pointer)
    }
  }
}
