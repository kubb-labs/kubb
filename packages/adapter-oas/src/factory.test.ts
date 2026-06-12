import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { mergeDocuments, parseDocument, parseFromConfig, validateDocument } from './factory.ts'
import type { Document } from './types.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const petSchema: Document = {
  openapi: '3.0.3',
  info: { title: 'Pets API', version: '1.0.0' },
  paths: {},
  components: {
    schemas: {
      Pet: { type: 'object', properties: { name: { type: 'string' } } },
    },
  },
} as Document

const orderSchema: Document = {
  openapi: '3.0.3',
  info: { title: 'Orders API', version: '1.0.0' },
  paths: {},
  components: {
    schemas: {
      Order: { type: 'object', properties: { id: { type: 'integer' } } },
    },
  },
} as Document

describe('parseDocument', () => {
  it('returns an OpenAPI 3 document from a plain object', async () => {
    const doc = await parseDocument(petSchema)

    expect(doc.openapi).toMatch(/^3\./)
    expect(doc.components?.schemas?.['Pet']).toBeDefined()
  })

  it('up-converts a Swagger 2.0 document to OpenAPI 3.0', async () => {
    const swagger2: Document = {
      swagger: '2.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
    } as unknown as Document

    const doc = await parseDocument(swagger2)

    expect(doc.openapi).toMatch(/^3\./)
  })

  it('resolves external file $refs when given a file path', async () => {
    const docPath = path.resolve(__dirname, '../mocks/withExternalFileRef.yaml')
    const doc = await parseDocument(docPath)

    expect(doc.openapi).toMatch(/^3\./)
    const pet = doc.components?.schemas?.['Pet'] as Document
    expect(pet).toBeDefined()
    expect(pet).toMatchObject({ type: 'object', properties: { name: { type: 'string' } } })
  })

  it('hoists external file schemas into named components.schemas entries', async () => {
    const docPath = path.resolve(__dirname, '../mocks/phantom/main.yaml')
    const doc = await parseDocument(docPath)

    expect(doc.components?.schemas?.['User']).toMatchObject({
      type: 'object',
      properties: { id: { type: 'string' }, email: { type: 'string' }, name: { type: 'string' } },
    })
    expect(doc.components?.schemas?.['Employer']).toMatchObject({
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' }, industry: { type: 'string' } },
    })

    expect(doc.components?.schemas?.['AppState']).toStrictEqual({
      type: 'object',
      properties: {
        currentUser: { $ref: '#/components/schemas/User' },
        employers: { type: 'array', items: { $ref: '#/components/schemas/Employer' } },
      },
    })
  })

  it('rewrites operation refs to the same named schema as components.schemas', async () => {
    const docPath = path.resolve(__dirname, '../mocks/phantom/main.yaml')
    const doc = await parseDocument(docPath)

    const mePath = doc.paths?.['/me'] as Record<string, Record<string, unknown>>
    expect(mePath?.['get']?.['operationId']).toBe('getMe')
    expect(mePath?.['get']?.['responses']).toMatchObject({
      '200': {
        content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
      },
    })

    const employersPath = doc.paths?.['/employers'] as Record<string, Record<string, unknown>>
    expect(employersPath?.['get']?.['responses']).toMatchObject({
      '200': {
        content: {
          'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Employer' } } },
        },
      },
    })
  })

  it('throws when the input file does not exist', async () => {
    const docPath = path.resolve(__dirname, '../mocks/doesNotExist.yaml')

    await expect(parseDocument(docPath)).rejects.toThrow()
  })
})

describe('mergeDocuments', () => {
  it('merges two documents into one', async () => {
    const merged = await mergeDocuments([petSchema, orderSchema])

    expect(merged.components?.schemas?.['Pet']).toBeDefined()
    expect(merged.components?.schemas?.['Order']).toBeDefined()
  })

  it('throws a coded diagnostic when given an empty array', async () => {
    await expect(mergeDocuments([])).rejects.toMatchObject({
      name: 'DiagnosticError',
      diagnostic: { code: 'KUBB_INPUT_REQUIRED', severity: 'error' },
    })
  })

  it('returns a single document unchanged when only one is provided', async () => {
    const merged = await mergeDocuments([petSchema])

    expect(merged.components?.schemas?.['Pet']).toBeDefined()
  })
})

describe('parseFromConfig', () => {
  it('parses an inline object via type: data', async () => {
    const doc = await parseFromConfig({ type: 'data', data: petSchema })

    expect(doc.components?.schemas?.['Pet']).toBeDefined()
  })

  it('parses an inline JSON string via type: data', async () => {
    const doc = await parseFromConfig({
      type: 'data',
      data: JSON.stringify(petSchema),
    })

    expect(doc.components?.schemas?.['Pet']).toBeDefined()
  })

  it('parses an inline YAML string via type: data', async () => {
    const yaml = `
openapi: '3.0.3'
info:
  title: Pets API
  version: 1.0.0
paths: {}
components:
  schemas:
    Pet:
      type: object
`
    const doc = await parseFromConfig({ type: 'data', data: yaml })

    expect(doc.components?.schemas?.['Pet']).toBeDefined()
  })

  it('merges multiple documents via type: paths (using object sources)', async () => {
    const doc = await parseFromConfig({
      type: 'paths',
      paths: [petSchema as unknown as string, orderSchema as unknown as string],
    })

    expect(doc.components?.schemas?.['Pet']).toBeDefined()
    expect(doc.components?.schemas?.['Order']).toBeDefined()
  })
})

describe('validateDocument', () => {
  const invalidSchema: Document = {
    openapi: '3.0.3',
    info: { title: 'Invalid API', version: '1.0.0' },
    paths: {
      '/pets': {
        get: {
          responses: {
            '200': {},
          },
        },
      },
    },
  } as unknown as Document

  it('does not throw by default', async () => {
    await expect(validateDocument(invalidSchema)).resolves.toBeUndefined()
  })

  it('throws when throwOnError is enabled', async () => {
    await expect(validateDocument(invalidSchema, { throwOnError: true })).rejects.toThrow()
  })
})
