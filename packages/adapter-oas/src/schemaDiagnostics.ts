import { ast, diagnosticCode, Diagnostics } from '@kubb/core'
import { formatMap } from './constants.ts'

/**
 * Formats Kubb maps to a specific AST type. A `format` outside this set falls through to
 * the base type, which is what `KUBB_UNSUPPORTED_FORMAT` flags. Kept in sync with the
 * parser: `formatMap` plus the formats `convertFormat` special-cases.
 */
const handledFormats = new Set<string>([...Object.keys(formatMap), 'int64', 'date-time', 'date', 'time'])

/**
 * Reports the advisory diagnostics (`KUBB_UNSUPPORTED_FORMAT`, `KUBB_DEPRECATED`) for a
 * single top-level schema. It reuses the node the parser already produced during `preScan`
 * and walks it with the shared AST visitor, so it never re-implements the OpenAPI traversal
 * (refs, `allOf`/`oneOf`, items) the parser resolved. Reports land in the active build run;
 * outside a build `Diagnostics.report` is a no-op and repeats are collapsed by the build's
 * deduplication.
 */
export function reportSchemaDiagnostics({ node, name }: { node: ast.SchemaNode; name: string }): void {
  const base = `#/components/schemas/${name}`

  ast.collect<unknown>(node, {
    schema(schemaNode, context) {
      const parent = context.parent
      const pointer = parent?.kind === 'Property' && parent.name ? `${base}/properties/${parent.name}` : base

      if (schemaNode.deprecated) {
        Diagnostics.report({
          code: diagnosticCode.deprecated,
          severity: 'info',
          message: 'This schema is marked as deprecated.',
          location: { kind: 'schema', pointer },
        })
      }

      if (typeof schemaNode.format === 'string' && !handledFormats.has(schemaNode.format)) {
        Diagnostics.report({
          code: diagnosticCode.unsupportedFormat,
          severity: 'warning',
          message: `Kubb does not map the format "${schemaNode.format}" to a specific type, so it falls back to the base type.`,
          help: `Use a format Kubb supports, or handle "${schemaNode.format}" with a custom parser or plugin.`,
          location: { kind: 'schema', pointer },
        })
      }

      return undefined
    },
  })
}
