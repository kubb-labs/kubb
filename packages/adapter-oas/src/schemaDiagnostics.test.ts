import { type Diagnostic, Diagnostics } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { adapterOas } from './adapter.ts'
import { formatMap, specialCasedFormats } from './constants.ts'

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

const aliasCycleSpec = {
  openapi: '3.1.0',
  info: { title: 'r', version: '1' },
  paths: {},
  components: { schemas: { Baz: { $ref: '#/components/schemas/Qux' }, Qux: { $ref: '#/components/schemas/Baz' } } },
}

describe('schema diagnostics during parse', () => {
  it('warns once per schema in a pure $ref alias cycle', async () => {
    const diagnostics = (await collect(aliasCycleSpec)).filter((diagnostic) => diagnostic.code === 'KUBB_ALIAS_CYCLE')

    expect(diagnostics).toHaveLength(2)
    for (const pointer of ['#/components/schemas/Baz', '#/components/schemas/Qux']) {
      expect(diagnostics).toContainEqual(expect.objectContaining({ severity: 'warning', location: { kind: 'schema', pointer } }))
    }
  })

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

  it('reports a deprecated schema inside `not`', async () => {
    const data = { ...spec, components: { schemas: { Name: { type: 'string', not: { type: 'string', deprecated: true } } } } }
    const diagnostics = await collect(data)

    expect(diagnostics).toContainEqual(
      expect.objectContaining({ code: 'KUBB_DEPRECATED', location: { kind: 'schema', pointer: '#/components/schemas/Name/allOf/1/not' } }),
    )
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

    expect(pointers).toStrictEqual(['#/components/schemas/Pet/oneOf/0', '#/components/schemas/Pet/oneOf/1'])
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

  describe('duplicate discriminator values', () => {
    const message = (role: string) => ({
      type: 'object',
      required: ['type', 'role'],
      properties: { type: { type: 'string', enum: ['message'] }, role: { type: 'string', enum: [role] } },
    })
    const itemSpec = (item: object, extra: object = {}) => ({
      openapi: '3.1.0',
      info: { title: 'repro', version: '1' },
      paths: {},
      components: { schemas: { InMsg: message('user'), OutMsg: message('assistant'), ...extra, Item: item } },
    })
    const oneOf = [{ $ref: '#/components/schemas/InMsg' }, { $ref: '#/components/schemas/OutMsg' }]
    const duplicates = async (data: unknown) => (await collect(data)).filter((diagnostic) => diagnostic.code === 'KUBB_DUPLICATE_DISCRIMINATOR')

    it('warns at the union when two members share a discriminator value', async () => {
      expect(await duplicates(itemSpec({ oneOf, discriminator: { propertyName: 'type' } }))).toStrictEqual([
        expect.objectContaining({
          severity: 'warning',
          message: 'Discriminator "type" value "message" matches more than one member (InMsg, OutMsg).',
          location: { kind: 'schema', pointer: '#/components/schemas/Item' },
        }),
      ])
    })

    it('stays quiet when each member has its own value', async () => {
      const spec = itemSpec(
        { oneOf: [{ $ref: '#/components/schemas/InMsg' }, { $ref: '#/components/schemas/Other' }], discriminator: { propertyName: 'type' } },
        { Other: { type: 'object', properties: { type: { type: 'string', enum: ['other'] } } } },
      )

      expect(await duplicates(spec)).toHaveLength(0)
    })

    it('warns when a nested anyOf member shares a value with a sibling', async () => {
      const spec = itemSpec(
        {
          oneOf: [{ $ref: '#/components/schemas/InMsg' }, { anyOf: [{ $ref: '#/components/schemas/OutMsg' }, { $ref: '#/components/schemas/Other' }] }],
          discriminator: { propertyName: 'type' },
        },
        { Other: { type: 'object', properties: { type: { type: 'string', enum: ['other'] } } } },
      )

      expect(await duplicates(spec)).toHaveLength(1)
    })

    it('stays quiet when a mapping gives the members distinct values', async () => {
      // Both members allow either role, so only the mapping keeps their values apart.
      const shared = { type: 'object', properties: { role: { type: 'string', enum: ['user', 'assistant'] } } }
      const spec = itemSpec(
        { oneOf, discriminator: { propertyName: 'role', mapping: { user: '#/components/schemas/InMsg', assistant: '#/components/schemas/OutMsg' } } },
        { InMsg: shared, OutMsg: shared },
      )

      expect(await duplicates(spec)).toHaveLength(0)
    })
  })
})
