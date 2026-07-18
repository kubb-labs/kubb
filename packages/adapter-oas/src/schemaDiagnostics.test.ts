import { ast } from '@kubb/ast'
import { type Diagnostic, Diagnostics } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { adapterOas } from './adapter.ts'
import { formatMap, specialCasedFormats } from './constants.ts'
import { scanSchema } from './schemaDiagnostics.ts'

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

async function collect(data: unknown = spec): Promise<Array<Diagnostic>> {
  const adapter = adapterOas({ validate: false })
  const reported: Array<Diagnostic> = []
  await Diagnostics.scope(
    (diagnostic) => reported.push(diagnostic),
    () => adapter.parse({ type: 'data', data }),
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

  it('points at the full nested path, not the immediate parent', async () => {
    const nested = {
      openapi: '3.0.3',
      info: { title: 'Pets', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Pet: {
            type: 'object',
            properties: {
              owner: {
                type: 'object',
                properties: {
                  badge: { type: 'string', format: 'snowflake' },
                },
              },
            },
          },
        },
      },
    }
    const diagnostics = await collect(nested)
    const formatWarnings = diagnostics.filter((diagnostic) => diagnostic.code === 'KUBB_UNSUPPORTED_FORMAT')

    expect(formatWarnings).toHaveLength(1)
    expect(formatWarnings[0]).toMatchObject({ location: { pointer: '#/components/schemas/Pet/properties/owner/properties/badge' } })
  })

  it('reports each union member at its own indexed pointer', async () => {
    const union = {
      openapi: '3.0.3',
      info: { title: 'Pets', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Pet: {
            oneOf: [
              { type: 'string', format: 'snowflake' },
              { type: 'string', format: 'discord' },
            ],
          },
        },
      },
    }
    const diagnostics = await collect(union)
    const pointers = diagnostics
      .filter(Diagnostics.isProblem)
      .filter((diagnostic) => diagnostic.code === 'KUBB_UNSUPPORTED_FORMAT')
      .map((diagnostic) => (diagnostic.location && 'pointer' in diagnostic.location ? diagnostic.location.pointer : undefined))

    expect(pointers).toStrictEqual(['#/components/schemas/Pet/members/0', '#/components/schemas/Pet/members/1'])
  })

  it('does not warn on any format the parser handles', async () => {
    const handled = [...Object.keys(formatMap), ...specialCasedFormats]
    const properties = Object.fromEntries(handled.map((format, index) => [`field${index}`, { type: 'string', format }]))
    const allFormats = {
      openapi: '3.0.3',
      info: { title: 'Pets', version: '1.0.0' },
      paths: {},
      components: { schemas: { Pet: { type: 'object', properties } } },
    }
    const diagnostics = await collect(allFormats)

    expect(diagnostics.filter((diagnostic) => diagnostic.code === 'KUBB_UNSUPPORTED_FORMAT')).toHaveLength(0)
  })
})

describe('scanSchema referenced names', () => {
  it('collects ref names nested in properties, arrays and unions in one walk', () => {
    const node = ast.factory.createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        ast.factory.createProperty({
          name: 'category',
          required: false,
          schema: ast.factory.createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category' }),
        }),
        ast.factory.createProperty({
          name: 'tags',
          required: false,
          schema: ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'ref', name: 'Tag', ref: '#/components/schemas/Tag' })] }),
        }),
        ast.factory.createProperty({
          name: 'owner',
          required: false,
          schema: ast.factory.createSchema({
            type: 'union',
            members: [ast.factory.createSchema({ type: 'null' }), ast.factory.createSchema({ type: 'ref', name: 'User', ref: '#/components/schemas/User' })],
          }),
        }),
      ],
    })

    expect(scanSchema({ node, name: 'Pet' })).toStrictEqual(new Set(['Category', 'Tag', 'User']))
  })

  it('returns an empty set for a schema without refs', () => {
    const node = ast.factory.createSchema({ type: 'string' })

    expect(scanSchema({ node, name: 'Name' })).toStrictEqual(new Set())
  })
})
