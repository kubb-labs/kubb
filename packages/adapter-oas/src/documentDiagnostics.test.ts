import { type Diagnostic, Diagnostics } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { reportDocumentDiagnostics } from './documentDiagnostics.ts'
import type { AdapterOasDiagnosticsOptions, Document } from './types.ts'

function collect(document: Document, options: AdapterOasDiagnosticsOptions | undefined): Array<Diagnostic> {
  const diagnostics: Array<Diagnostic> = []
  Diagnostics.scope(
    (diagnostic) => diagnostics.push(diagnostic),
    () => reportDocumentDiagnostics({ document, options }),
  )
  return diagnostics
}

const document = {
  openapi: '3.0.3',
  info: { title: 'Pets', version: '1.0.0' },
  paths: {},
  components: {
    schemas: {
      Pet: {
        type: 'object',
        deprecated: true,
        properties: {
          id: { type: 'string', format: 'snowflake' },
          name: { type: 'string', format: 'uuid' },
        },
      },
    },
  },
} as unknown as Document

describe('reportDocumentDiagnostics', () => {
  it('reports nothing when no option is enabled', () => {
    expect(collect(document, undefined)).toHaveLength(0)
    expect(collect(document, {})).toHaveLength(0)
  })

  it('reports a deprecated schema as info at its pointer', () => {
    const diagnostics = collect(document, { deprecated: true })

    expect(diagnostics).toStrictEqual([
      {
        code: 'KUBB_DEPRECATED',
        severity: 'info',
        message: 'This schema is marked as deprecated.',
        location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
      },
    ])
  })

  it('warns on an unmapped format and ignores a mapped one', () => {
    const diagnostics = collect(document, { unsupportedFormat: true })

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]).toMatchObject({
      code: 'KUBB_UNSUPPORTED_FORMAT',
      severity: 'warning',
      location: { pointer: '#/components/schemas/Pet/properties/id' },
    })
  })

  it('treats int64 and date-time as supported formats', () => {
    const doc = {
      ...document,
      components: {
        schemas: { Order: { type: 'object', properties: { at: { type: 'string', format: 'date-time' }, qty: { type: 'integer', format: 'int64' } } } },
      },
    } as unknown as Document

    expect(collect(doc, { unsupportedFormat: true })).toHaveLength(0)
  })
})
