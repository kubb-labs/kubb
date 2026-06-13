import { ast } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { parseFromConfig } from './factory.ts'
import { createSchemaParser } from './parser.ts'
import { createInputStream, preScan, resolveBaseUrl } from './stream.ts'
import type { SchemaObject } from './types.ts'

const minimalSpec = {
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com/v1' }],
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        responses: { '200': { description: 'ok' } },
      },
    },
  },
  components: {
    schemas: {
      Pet: {
        type: 'object',
        properties: { id: { type: 'string' }, name: { type: 'string' } },
        required: ['id'],
      },
      Category: {
        type: 'object',
        properties: { id: { type: 'integer' } },
      },
      Status: {
        type: 'string',
        enum: ['active', 'inactive'],
      },
    },
  },
} as const

const parserOptions = { ...DEFAULT_PARSER_OPTIONS }

// Typed schema fixtures — avoids `as unknown as SchemaObject` casts throughout tests.
const petSchema: SchemaObject = { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } }, required: ['id'] }
const categorySchema: SchemaObject = { type: 'object', properties: { id: { type: 'integer' } } }
const statusSchema: SchemaObject = { type: 'string', enum: ['active', 'inactive'] }

describe('resolveBaseUrl', () => {
  it('returns the server URL at the given index', async () => {
    const document = await parseFromConfig({ type: 'data', data: minimalSpec })
    const url = resolveBaseUrl({ document, serverIndex: 0 })
    expect(url).toMatchInlineSnapshot(`"https://api.example.com/v1"`)
  })

  it('returns null when no serverIndex is provided', async () => {
    const document = await parseFromConfig({ type: 'data', data: minimalSpec })
    const url = resolveBaseUrl({ document })
    expect(url).toMatchInlineSnapshot(`null`)
  })

  it('returns null when serverIndex is out of range', async () => {
    const document = await parseFromConfig({ type: 'data', data: minimalSpec })
    const url = resolveBaseUrl({ document, serverIndex: 99 })
    expect(url).toMatchInlineSnapshot(`null`)
  })
})

describe('preScan', () => {
  const schemas: Record<string, SchemaObject> = {
    Pet: petSchema,
    Status: statusSchema,
    PetAlias: { $ref: '#/components/schemas/Pet' },
  }

  // dedupe is off in these cases, so parseOperation is never invoked and the document is unused.
  const noopParseOperation = (() => null) as unknown as Parameters<typeof preScan>[0]['parseOperation']

  // The real parser sets `name` to the referenced schema name (not the alias key).
  // That is how `node.name !== name` detects top-level $ref aliases.
  const makeParseSchema =
    () =>
    ({ name, schema }: { schema: SchemaObject; name: string }): ast.SchemaNode => {
      if ('enum' in schema && schema.enum) return ast.createSchema({ type: 'enum', name, members: schema.enum.map(String) })
      if ('$ref' in schema) {
        const refName = (schema.$ref as string).split('/').pop() ?? name
        return ast.createSchema({ type: 'ref', name: refName, ref: schema.$ref as string })
      }
      return ast.createSchema({ type: 'object', name })
    }

  it('collects enum schema names', () => {
    const { enumNames } = preScan({
      schemas,
      parseSchema: makeParseSchema(),
      parseOperation: noopParseOperation,
      document: minimalSpec as never,
      parserOptions,
      discriminator: 'strict',
      dedupe: false,
    })
    expect(enumNames).toMatchInlineSnapshot(`
      [
        "Status",
      ]
    `)
  })

  it('builds refAliasMap for pure $ref alias schemas only', () => {
    const { refAliasMap } = preScan({
      schemas,
      parseSchema: makeParseSchema(),
      parseOperation: noopParseOperation,
      document: minimalSpec as never,
      parserOptions,
      discriminator: 'strict',
      dedupe: false,
    })
    expect([...refAliasMap.keys()]).toMatchInlineSnapshot(`
      [
        "PetAlias",
      ]
    `)
  })

  it('detects circular schema names', async () => {
    const document = await parseFromConfig({ type: 'data', data: minimalSpec })
    const { parseSchema } = createSchemaParser({ document })

    const circularSchemas: Record<string, SchemaObject> = {
      Cat: { type: 'object', properties: { enemy: { $ref: '#/components/schemas/Dog' } } },
      Dog: { type: 'object', properties: { enemy: { $ref: '#/components/schemas/Cat' } } },
    }

    const { circularNames } = preScan({
      schemas: circularSchemas,
      parseSchema,
      parseOperation: noopParseOperation,
      document,
      parserOptions,
      discriminator: 'strict',
      dedupe: false,
    })
    expect(circularNames).toMatchInlineSnapshot(`
      [
        "Cat",
        "Dog",
      ]
    `)
  })

  it('returns null discriminatorChildMap when discriminator is strict', () => {
    const { discriminatorChildMap } = preScan({
      schemas,
      parseSchema: makeParseSchema(),
      parseOperation: noopParseOperation,
      document: minimalSpec as never,
      parserOptions,
      discriminator: 'strict',
      dedupe: false,
    })
    expect(discriminatorChildMap).toMatchInlineSnapshot(`null`)
  })
})

describe('createInputStream', () => {
  it('yields schemas lazily via for await', async () => {
    const document = await parseFromConfig({ type: 'data', data: minimalSpec })
    const { parseSchema, parseOperation } = createSchemaParser({ document })
    const schemas = { Pet: petSchema }

    const node = createInputStream({
      schemas,
      parseSchema,
      parseOperation,
      document,
      parserOptions,
      refAliasMap: new Map(),
      discriminatorChildMap: null,
      dedupePlan: null,
      meta: { circularNames: [], enumNames: [] },
    })

    const collected: Array<ast.SchemaNode> = []
    for await (const schema of node.schemas) collected.push(schema)

    expect(collected).toHaveLength(1)
    expect(collected[0]?.name).toMatchInlineSnapshot(`"Pet"`)
  })

  it('each for await creates an independent pass', async () => {
    const document = await parseFromConfig({ type: 'data', data: minimalSpec })
    const { parseSchema, parseOperation } = createSchemaParser({ document })
    const schemas = { Pet: petSchema, Category: categorySchema }

    const node = createInputStream({
      schemas,
      parseSchema,
      parseOperation,
      document,
      parserOptions,
      refAliasMap: new Map(),
      discriminatorChildMap: null,
      dedupePlan: null,
      meta: { circularNames: [], enumNames: [] },
    })

    const first: Array<string> = []
    for await (const s of node.schemas) first.push(s.name ?? '')

    const second: Array<string> = []
    for await (const s of node.schemas) second.push(s.name ?? '')

    expect(second).toStrictEqual(first)
    expect(first).toMatchInlineSnapshot(`
      [
        "Pet",
        "Category",
      ]
    `)
  })

  it('resolves $ref alias schemas using refAliasMap', async () => {
    const document = await parseFromConfig({ type: 'data', data: minimalSpec })
    const { parseSchema, parseOperation } = createSchemaParser({ document })

    const schemas: Record<string, SchemaObject> = {
      Pet: petSchema,
      PetAlias: { $ref: '#/components/schemas/Pet' },
    }

    const aliasNode = ast.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })
    const refAliasMap = new Map([['PetAlias', aliasNode]])

    const node = createInputStream({
      schemas,
      parseSchema,
      parseOperation,
      document,
      parserOptions,
      refAliasMap,
      discriminatorChildMap: null,
      dedupePlan: null,
      meta: { circularNames: [], enumNames: [] },
    })

    const collected: Array<ast.SchemaNode> = []
    for await (const s of node.schemas) collected.push(s)

    const alias = collected.find((s) => s.name === 'PetAlias')
    expect(alias?.type).toMatchInlineSnapshot(`"object"`)
  })

  it('yields operations', async () => {
    const document = await parseFromConfig({ type: 'data', data: minimalSpec })
    const { parseSchema, parseOperation } = createSchemaParser({ document })

    const node = createInputStream({
      schemas: {},
      parseSchema,
      parseOperation,
      document,
      parserOptions,
      refAliasMap: new Map(),
      discriminatorChildMap: null,
      dedupePlan: null,
      meta: { circularNames: [], enumNames: [] },
    })

    const operations: Array<ast.OperationNode> = []
    for await (const op of node.operations) operations.push(op)

    expect(operations).toHaveLength(1)
    expect(operations[0]?.operationId).toMatchInlineSnapshot(`"listPets"`)
  })

  it('carries meta through to the returned node', async () => {
    const document = await parseFromConfig({ type: 'data', data: minimalSpec })
    const { parseSchema, parseOperation } = createSchemaParser({ document })
    const meta: ast.InputMeta = { title: 'My API', version: '2.0.0', circularNames: ['Cat'], enumNames: ['Status'] }

    const node = createInputStream({
      schemas: {},
      parseSchema,
      parseOperation,
      document,
      parserOptions,
      refAliasMap: new Map(),
      discriminatorChildMap: null,
      dedupePlan: null,
      meta,
    })

    expect(node.meta).toMatchInlineSnapshot(`
      {
        "circularNames": [
          "Cat",
        ],
        "enumNames": [
          "Status",
        ],
        "title": "My API",
        "version": "2.0.0",
      }
    `)
  })
})
