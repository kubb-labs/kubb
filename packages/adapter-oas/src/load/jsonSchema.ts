import type { Document, SchemaObject } from '../types.ts'

/**
 * Pointer prefixes a JSON Schema uses for its local definitions: `$defs` since draft 2019-09,
 * `definitions` before it.
 */
const definitionPrefixes = ['#/$defs/', '#/definitions/'] as const

/**
 * True when `document` is a plain JSON Schema rather than an OpenAPI or Swagger document: it
 * declares no `openapi` or `swagger` version, and has a JSON Schema keyword at its root.
 */
export function isJsonSchemaDocument(document: unknown): document is SchemaObject & Record<string, unknown> {
  if (!document || typeof document !== 'object' || Array.isArray(document)) return false
  if ('openapi' in document || 'swagger' in document) return false

  return ['$schema', '$defs', 'definitions', 'properties', 'type'].some((key) => key in document)
}

/**
 * Wraps a JSON Schema in an OpenAPI 3.1 document, so the rest of the adapter parses it like any
 * spec. The root schema becomes `components.schemas[title]` (`Schema` without a title), and each
 * `$defs` or `definitions` entry becomes a sibling schema. Local refs to those definitions, and
 * `#` refs to the root, are rewritten to their `#/components/schemas/` pointer.
 *
 * @example
 * ```ts
 * wrapJsonSchema({ title: 'Options', type: 'object', $defs: { Output: { type: 'object' } } })
 * // { openapi: '3.1.0', info: { title: 'Options', version: '0.0.0' }, paths: {},
 * //   components: { schemas: { Options: { type: 'object' }, Output: { type: 'object' } } } }
 * ```
 */
export function wrapJsonSchema(schema: SchemaObject & Record<string, unknown>): Document {
  const { $schema: _schema, $id: _id, $defs, definitions, ...root } = schema
  const name = typeof root.title === 'string' && root.title ? root.title : 'Schema'
  const rootPointer = `#/components/schemas/${name}`

  const rewriteRefs = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(rewriteRefs)
    if (!node || typeof node !== 'object') return node

    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => {
        if (key !== '$ref' || typeof value !== 'string') return [key, rewriteRefs(value)]
        if (value === '#') return [key, rootPointer]

        const prefix = definitionPrefixes.find((candidate) => value.startsWith(candidate))
        return [key, prefix ? `#/components/schemas/${value.slice(prefix.length)}` : value]
      }),
    )
  }

  const localDefinitions = { ...(definitions as Record<string, unknown> | undefined), ...($defs as Record<string, unknown> | undefined) }
  const document: Document = {
    openapi: '3.1.0',
    info: { title: name, version: '0.0.0' },
    paths: {},
    components: {
      schemas: rewriteRefs({ ...localDefinitions, [name]: root }) as NonNullable<Document['components']>['schemas'],
    },
  }

  return document
}
