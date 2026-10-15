import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { type Diagnostic, Diagnostics } from '@kubb/kit'
import { assertDocument, bundleDocument, hasExternalRef, parseFromConfig, validateDocument } from './normalize.ts'
import type { Document } from '../types.ts'

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

describe('parseFromConfig', () => {
  it.each([
    { title: 'an inline object', data: petSchema },
    { title: 'an inline JSON string', data: JSON.stringify(petSchema) },
    {
      title: 'an inline YAML string',
      data: `
openapi: '3.0.3'
info:
  title: Pets API
  version: 1.0.0
paths: {}
components:
  schemas:
    Pet:
      type: object
`,
    },
  ])('parses $title via type: data', async ({ data }) => {
    const doc = await parseFromConfig({ type: 'data', data })

    expect(doc.components?.schemas?.['Pet']).toBeDefined()
  })

  it('up-converts a Swagger 2.0 document to OpenAPI 3', async () => {
    const swagger2 = { swagger: '2.0', info: { title: 'Test', version: '1.0.0' }, paths: {} }

    const doc = await parseFromConfig({ type: 'data', data: swagger2 })

    expect(doc.openapi).toMatch(/^3\./)
  })

  it('throws KUBB_INVALID_DOCUMENT with the line and column for invalid inline YAML', async () => {
    const error = await parseFromConfig({ type: 'data', data: 'openapi: 3.0.0\ninfo:\n  title: [unclosed\n' }).catch((caught: unknown) => caught)

    expect(Diagnostics.from(error)).toMatchObject({ code: Diagnostics.code.invalidDocument, location: { kind: 'config' } })
    expect(Diagnostics.from(error).message).toMatch(/^Cannot parse the inline `input` string as JSON or YAML: .*line \d+, column \d+/s)
    expect(Diagnostics.from(error).cause).toBeInstanceOf(Error)
  })

  it('throws KUBB_INVALID_DOCUMENT naming the file for an invalid YAML file', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'kubb-oas-'))
    const file = path.join(dir, 'broken.yaml')
    await writeFile(file, 'openapi: 3.0.0\npaths:\n  /pets: [unclosed\n')

    try {
      const error = await parseFromConfig({ type: 'path', path: file }).catch((caught: unknown) => caught)

      expect(Diagnostics.from(error)).toMatchObject({ code: Diagnostics.code.invalidDocument, message: expect.stringContaining(`Cannot parse ${file}`) })
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
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

  it('throws when throwOnError is enabled', async () => {
    await expect(validateDocument(invalidSchema, { throwOnError: true })).rejects.toThrow()
  })

  it('reports each problem as a KUBB_INVALID_SPEC warning inside a build', async () => {
    const diagnostics: Array<Diagnostic> = []

    await Diagnostics.scope(
      (diagnostic) => diagnostics.push(diagnostic),
      () => validateDocument(invalidSchema),
    )

    expect(diagnostics.length).toBeGreaterThan(0)
    expect(diagnostics.every((diagnostic) => diagnostic.code === Diagnostics.code.invalidSpec && diagnostic.severity === 'warning')).toBe(true)
    expect(diagnostics.every((diagnostic) => !Diagnostics.isProblem(diagnostic) || !diagnostic.message.includes('\n'))).toBe(true)
  })

  it('reports nothing for a valid document', async () => {
    const diagnostics: Array<Diagnostic> = []
    const validSchema = { openapi: '3.0.3', info: { title: 'Valid API', version: '1.0.0' }, paths: {} } as unknown as Document

    await Diagnostics.scope(
      (diagnostic) => diagnostics.push(diagnostic),
      () => validateDocument(validSchema),
    )

    expect(diagnostics).toStrictEqual([])
  })
})

const remoteFiles: Record<string, string> = {
  'https://specs.example.com/main.yaml': `
openapi: '3.0.3'
info:
  title: Remote API
  version: 1.0.0
paths: {}
components:
  schemas:
    Owner:
      type: object
      properties:
        pet:
          $ref: './schemas/Pet.yaml'
`,
  'https://specs.example.com/schemas/Pet.yaml': `
type: object
properties:
  name:
    type: string
`,
}

function mockFetch(input: string | URL | Request): Promise<Response> {
  const href = input instanceof URL ? input.href : String(input)
  const body = remoteFiles[href]

  if (!body) {
    return Promise.resolve(new Response('not found', { status: 404 }))
  }

  return Promise.resolve(new Response(body, { status: 200 }))
}

describe('bundleDocument', () => {
  it('hoists ./ file refs into named components.schemas entries', async () => {
    const doc = await bundleDocument(path.resolve(__dirname, '../../mocks/phantom/main.yaml'))

    expect(doc.components?.schemas?.['User']).toMatchObject({ type: 'object' })
    expect(doc.components?.schemas?.['Employer']).toMatchObject({ type: 'object' })
    expect(doc.components?.schemas?.['AppState']).toStrictEqual({
      type: 'object',
      properties: {
        currentUser: { $ref: '#/components/schemas/User' },
        employers: { type: 'array', items: { $ref: '#/components/schemas/Employer' } },
      },
    })

    // A ../ ref from a nested file lands on the same named schema.
    const mePath = doc.paths?.['/me'] as Record<string, Record<string, unknown>>
    expect(mePath?.['get']?.['responses']).toMatchObject({
      '200': {
        content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
      },
    })
  })

  it('keeps internal #/ refs untouched', async () => {
    const doc = await bundleDocument(path.resolve(__dirname, '../../mocks/withExternalFileRef.yaml'))

    const petsPath = doc.paths?.['/pets'] as Record<string, Record<string, unknown>>
    expect(petsPath?.['get']?.['responses']).toMatchObject({
      '200': {
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } },
      },
    })
    expect(doc.components?.schemas?.['Pet']).toMatchObject({
      type: 'object',
      properties: { name: { type: 'string' } },
    })
  })

  it('hoists fragment refs into external files under the pointer name', async () => {
    const doc = await bundleDocument(path.resolve(__dirname, '../../mocks/withFragmentRef.yaml'))

    expect(doc.components?.schemas?.['Cat']).toStrictEqual({
      type: 'object',
      properties: { name: { type: 'string' } },
    })
    expect(doc.components?.schemas?.['Household']).toStrictEqual({
      type: 'object',
      properties: { cat: { $ref: '#/components/schemas/Cat' } },
    })
    expect(doc.components?.schemas?.['Dog']).toBeUndefined()
  })

  it('resolves https refs found in a local document', async () => {
    using _fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(mockFetch)

    const doc = await bundleDocument(path.resolve(__dirname, '../../mocks/withUrlRef.yaml'))

    expect(doc.components?.schemas?.['Pet']).toStrictEqual({
      type: 'object',
      properties: { name: { type: 'string' } },
    })
    expect(doc.components?.schemas?.['Owner']).toStrictEqual({
      type: 'object',
      properties: { pet: { $ref: '#/components/schemas/Pet' } },
    })
  })

  it('bundles a document loaded from a URL and resolves its relative refs', async () => {
    using fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(mockFetch)

    const doc = await bundleDocument('https://specs.example.com/main.yaml')

    expect(doc.components?.schemas?.['Pet']).toStrictEqual({
      type: 'object',
      properties: { name: { type: 'string' } },
    })
    expect(doc.components?.schemas?.['Owner']).toStrictEqual({
      type: 'object',
      properties: { pet: { $ref: '#/components/schemas/Pet' } },
    })

    const requestedUrls = fetchSpy.mock.calls.map(([input]) => (input instanceof URL ? input.href : String(input)))
    expect(requestedUrls).toStrictEqual(['https://specs.example.com/main.yaml', 'https://specs.example.com/schemas/Pet.yaml'])
  })

  it('throws an input-request-failed diagnostic when the input URL answers with an error status', async () => {
    using _fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(mockFetch)

    try {
      await bundleDocument('https://specs.example.com/missing.yaml')
      expect.unreachable('expected bundleDocument to throw')
    } catch (error) {
      expect(Diagnostics.isError(error) && error.diagnostic.code).toBe(Diagnostics.code.inputRequestFailed)
      expect(Diagnostics.isError(error) && error.diagnostic.message).toContain('HTTP 404')
    }
  })

  it('throws when the input file does not exist', async () => {
    await expect(bundleDocument(path.resolve(__dirname, '../../mocks/doesNotExist.yaml'))).rejects.toThrow()
  })
})

describe('hasExternalRef', () => {
  it.each([
    { title: 'false for a document with no $ref at all', node: { openapi: '3.1.0', paths: {} }, expected: false },
    {
      title: 'false for an internal #/ ref, at any depth',
      node: { paths: { '/pets': { get: { responses: { '200': { schema: { $ref: '#/components/schemas/Pet' } } } } } } },
      expected: false,
    },
    { title: 'true for a relative file ref', node: { components: { schemas: { Pet: { $ref: './schemas/Pet.yaml' } } } }, expected: true },
    {
      title: 'true for an external ref nested inside an array',
      node: { allOf: [{ $ref: '#/components/schemas/Base' }, { $ref: './extra.yaml' }] },
      expected: true,
    },
  ])('returns $title', ({ node, expected }) => {
    expect(hasExternalRef(node)).toBe(expected)
  })
})

describe('assertDocument', () => {
  it.each([
    ['an OpenAPI document', { openapi: '3.1.0' }],
    ['a Swagger document', { swagger: '2.0' }],
  ])('accepts %s', (_name, document) => {
    expect(() => assertDocument(document as unknown as Document)).not.toThrow()
  })

  it.each([
    ['a v4 path wrapper read as data', { path: './petStore.yaml' }],
    ['a document with no version field', { info: { title: 'Pets', version: '1.0.0' } }],
  ])('throws an invalid-document diagnostic for %s', (_name, document) => {
    try {
      assertDocument(document as Document)
      expect.unreachable('expected assertDocument to throw')
    } catch (error) {
      expect(Diagnostics.isError(error) && error.diagnostic.code).toBe(Diagnostics.code.invalidDocument)
    }
  })
})
