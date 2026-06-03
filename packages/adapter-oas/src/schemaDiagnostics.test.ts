import { type Diagnostic, Diagnostics } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { adapterOas } from './adapter.ts'

const spec = {
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
} as const

async function collect(): Promise<Array<Diagnostic>> {
  const adapter = adapterOas({ validate: false })
  const reported: Array<Diagnostic> = []
  await Diagnostics.scope(
    (diagnostic) => reported.push(diagnostic),
    () => adapter.parse({ type: 'data', data: spec }),
  )
  return reported
}

describe('schema diagnostics during parse', () => {
  it('reports the deprecated schema at its component pointer', async () => {
    const diagnostics = await collect()

    expect(diagnostics).toContainEqual({
      code: 'KUBB_DEPRECATED',
      severity: 'info',
      message: 'This schema is marked as deprecated.',
      location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
    })
  })

  it('warns on an unmapped format at the property pointer and ignores a mapped one', async () => {
    const diagnostics = await collect()
    const formatWarnings = diagnostics.filter((diagnostic) => diagnostic.code === 'KUBB_UNSUPPORTED_FORMAT')

    expect(formatWarnings).toHaveLength(1)
    expect(formatWarnings[0]).toMatchObject({ severity: 'warning', location: { pointer: '#/components/schemas/Pet/properties/id' } })
  })
})
