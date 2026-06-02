import { diagnosticCode, Diagnostics } from '@kubb/core'
import { formatMap } from './constants.ts'
import { isReference } from './guards.ts'
import type { AdapterOasDiagnosticsOptions, Document, SchemaObject } from './types.ts'

/**
 * Formats Kubb maps to a specific AST type. A `format` outside this set falls through to
 * the base type, which is what `KUBB_UNSUPPORTED_FORMAT` flags. Kept in sync with the
 * parser: `formatMap` plus the formats `convertFormat` special-cases.
 */
const handledFormats = new Set<string>([...Object.keys(formatMap), 'int64', 'date-time', 'date', 'time'])

/**
 * Walks the named component schemas and reports the opt-in advisory diagnostics
 * (`KUBB_UNSUPPORTED_FORMAT`, `KUBB_DEPRECATED`) against their JSON pointers. Reports land
 * in the active build run via `Diagnostics.report`; outside a build it is a no-op. Repeats
 * are collapsed by the build's deduplication.
 */
export function reportDocumentDiagnostics({ document, options }: { document: Document; options: AdapterOasDiagnosticsOptions | undefined }): void {
  if (!options || (!options.unsupportedFormat && !options.deprecated)) {
    return
  }

  const schemas = document.components?.schemas
  if (!schemas) {
    return
  }

  const seen = new Set<unknown>()
  for (const [name, schema] of Object.entries(schemas)) {
    walkSchema({ schema, pointer: `#/components/schemas/${name}`, options, seen })
  }
}

function walkSchema({ schema, pointer, options, seen }: { schema: unknown; pointer: string; options: AdapterOasDiagnosticsOptions; seen: Set<unknown> }): void {
  if (!schema || typeof schema !== 'object' || isReference(schema) || seen.has(schema)) {
    return
  }
  seen.add(schema)
  const node = schema as SchemaObject

  if (options.deprecated && node.deprecated) {
    Diagnostics.report({
      code: diagnosticCode.deprecated,
      severity: 'info',
      message: 'This schema is marked as deprecated.',
      location: { kind: 'schema', pointer },
    })
  }

  if (options.unsupportedFormat && typeof node.format === 'string' && !handledFormats.has(node.format)) {
    Diagnostics.report({
      code: diagnosticCode.unsupportedFormat,
      severity: 'warning',
      message: `Kubb does not map the format "${node.format}" to a specific type, so it falls back to the base type.`,
      help: `Use a format Kubb supports, or handle "${node.format}" with a custom parser or plugin.`,
      location: { kind: 'schema', pointer },
    })
  }

  for (const [key, value] of Object.entries(node.properties ?? {})) {
    walkSchema({ schema: value, pointer: `${pointer}/properties/${key}`, options, seen })
  }

  if (Array.isArray(node.items)) {
    node.items.forEach((item, index) => walkSchema({ schema: item, pointer: `${pointer}/items/${index}`, options, seen }))
  } else if (node.items) {
    walkSchema({ schema: node.items, pointer: `${pointer}/items`, options, seen })
  }

  if (node.additionalProperties && typeof node.additionalProperties === 'object') {
    walkSchema({ schema: node.additionalProperties, pointer: `${pointer}/additionalProperties`, options, seen })
  }

  for (const keyword of ['allOf', 'anyOf', 'oneOf'] as const) {
    const members = node[keyword]
    if (Array.isArray(members)) {
      members.forEach((member, index) => walkSchema({ schema: member, pointer: `${pointer}/${keyword}/${index}`, options, seen }))
    }
  }
}
