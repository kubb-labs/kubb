import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import * as yaml from 'yaml'
import { type Diagnostic, Diagnostics } from '@kubb/kit'
import { assertDocument, bundleDocument, hasExternalRef, parseFromConfig, validateDocument, validateDocumentInWorker } from './normalize.ts'
import type { Document, SchemaObject } from '../types.ts'

// Records each result a validation worker posts, so a test can tell the worker from the in-place fallback.
const workerSpy = vi.hoisted(() => vi.fn())

vi.mock('node:worker_threads', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:worker_threads')>()
  return {
    ...actual,
    Worker: function (...args: ConstructorParameters<typeof actual.Worker>) {
      const worker = new actual.Worker(...args)
      worker.once('message', workerSpy)
      return worker
    },
  }
})

const __dirname = path.dirname(fileURLToPath(import.meta.url))

vi.mock('yaml', async (importOriginal) => {
  const actual = await importOriginal<typeof import('yaml')>()
  return { ...actual, parse: vi.fn(actual.parse) }
})

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
  it('bundles the external refs of inline data from root and lists the files it read', async () => {
    const mocks = path.resolve(__dirname, '../../mocks')
    const data = yaml.parse(await readFile(path.join(mocks, 'withExternalFileRef.yaml'), 'utf8'))
    const sources: Array<string> = []
    const doc = await parseFromConfig({ type: 'data', data, root: mocks }, sources)

    expect(doc.components?.schemas?.['Pet']).toMatchObject({ type: 'object', properties: { name: { type: 'string' } } })
    expect(sources).toStrictEqual([path.join(mocks, 'external/pet.yaml')])
  })

  it('lists the input file and the files its external refs read', async () => {
    const mocks = path.resolve(__dirname, '../../mocks')
    const sources: Array<string> = []
    await parseFromConfig({ type: 'path', path: path.join(mocks, 'withExternalFileRef.yaml') }, sources)

    expect(sources).toStrictEqual([path.join(mocks, 'withExternalFileRef.yaml'), path.join(mocks, 'external/pet.yaml')])
  })

  it('upgrades an unquoted `swagger: 2.0` instead of dropping its definitions', async () => {
    const doc = await parseFromConfig({
      type: 'data',
      data: 'swagger: 2.0\ninfo: { title: t, version: 1.0.0 }\npaths: {}\ndefinitions:\n  Pet:\n    properties:\n      name: { type: string }\n',
    })

    expect(doc.openapi).toMatch(/^3\.1/)
    expect(doc.components?.schemas).toHaveProperty('Pet')
  })

  it('resolves a Swagger 2.0 ref into a response schema after the upgrade', async () => {
    const doc = await parseFromConfig({
      type: 'data',
      data: [
        "swagger: '2.0'",
        'info: { title: t, version: 1.0.0 }',
        'paths:',
        '  /x:',
        '    get:',
        '      responses:',
        "        '200':",
        '          description: ok',
        '          schema:',
        '            type: object',
        '            properties:',
        '              first: { type: string }',
        "              second: { $ref: '#/paths/~1x/get/responses/200/schema/properties/first' }",
      ].join('\n'),
    })
    const response = doc.paths?.['/x']?.get?.responses?.['200'] as { content: Record<string, { schema: SchemaObject }> }

    expect(response.content['application/json']!.schema.properties?.second).toStrictEqual({ type: 'string' })
  })

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

  it('parses inline JSON and YAML without the slower `yaml` parser', async () => {
    const parse = vi.mocked(yaml.parse)
    parse.mockClear()

    await parseFromConfig({ type: 'data', data: JSON.stringify(petSchema) })
    const doc = await parseFromConfig({ type: 'data', data: 'openapi: 3.0.3\ninfo: { title: Pets API, version: 1.0.0 }\npaths: {}\n' })

    expect(doc.info.title).toBe('Pets API')
    expect(parse).not.toHaveBeenCalled()
  })

  it.each([
    ['inline JSON', '{"openapi":"3.0.3","info":{"title":"Pets API","version":"1"},"paths":{"/pets":{},"/pets":{}}}'],
    ['inline YAML', 'openapi: 3.0.3\ninfo: { title: Pets API, version: 1.0.0 }\npaths:\n  /pets: {}\n  /pets: {}\n'],
  ])('rejects duplicate keys in %s instead of keeping the last one', async (_kind, data) => {
    const error = await parseFromConfig({ type: 'data', data }).catch((caught: unknown) => caught)

    expect(Diagnostics.from(error).code).toBe(Diagnostics.code.invalidDocument)
  })

  it('keeps timestamps as strings and `<<` as a plain key, like YAML 1.2', async () => {
    const doc = await parseFromConfig({
      type: 'data',
      data: 'openapi: 3.0.3\ninfo: { title: Pets API, version: 2024-01-01 }\npaths: {}\nx-merge:\n  <<: { a: 1 }\n',
    })

    expect(doc.info.version).toBe('2024-01-01')
    expect((doc as Record<string, unknown>)['x-merge']).toStrictEqual({ '<<': { a: 1 } })
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

describe('validateDocumentInWorker', () => {
  const invalidSchema = {
    openapi: '3.0.3',
    info: { title: 'Invalid API', version: '1.0.0' },
    paths: { '/pets': { get: { responses: { '200': {} } } } },
  } as unknown as Document

  it('reports the same warnings as validateDocument', async () => {
    const inPlace: Array<Diagnostic> = []
    const inWorker: Array<Diagnostic> = []

    await Diagnostics.scope(
      (diagnostic) => inPlace.push(diagnostic),
      () => validateDocument(invalidSchema),
    )
    await Diagnostics.scope(
      (diagnostic) => inWorker.push(diagnostic),
      () => validateDocumentInWorker(invalidSchema),
    )

    expect(workerSpy).toHaveBeenCalled()
    expect(inWorker.length).toBeGreaterThan(0)
    expect(inWorker).toStrictEqual(inPlace)
  })

  it('reports nothing for a valid document', async () => {
    const diagnostics: Array<Diagnostic> = []
    const validSchema = { openapi: '3.0.3', info: { title: 'Valid API', version: '1.0.0' }, paths: {} } as unknown as Document

    await Diagnostics.scope(
      (diagnostic) => diagnostics.push(diagnostic),
      () => validateDocumentInWorker(validSchema),
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
  'https://specs.example.com/broken.yaml': `
openapi: '3.0.3'
info:
  title: Remote API
  version: 1.0.0
paths: {}
components:
  schemas:
    Pet:
      $ref: './schemas/Gone.yaml'
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

  it('hoists a ref into a property of an external schema into components.schemas', async () => {
    const doc = await bundleDocument(path.resolve(__dirname, '../../mocks/withDeepExternalRef.yaml'))

    expect(doc.components?.schemas?.['Household']).toStrictEqual({
      type: 'object',
      properties: { catName: { $ref: '#/components/schemas/name' } },
    })
    expect(doc.components?.schemas?.['name']).toStrictEqual({ type: 'string' })
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

  it('reports an unreadable external ref at the key that holds it and still lists the file', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'kubb-bundle-'))
    const sources: Array<string> = []
    const document = {
      openapi: '3.0.3',
      info: { title: 'Pets API', version: '1.0.0' },
      paths: {},
      components: { schemas: { Pet: { $ref: './missing.yaml' } } },
    } as Document

    try {
      await bundleDocument(path.join(dir, 'main.yaml'), { document, sources })
      expect.unreachable('expected bundleDocument to throw')
    } catch (error) {
      expect(Diagnostics.isError(error) && error.diagnostic).toMatchObject({
        code: Diagnostics.code.refNotFound,
        location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
      })
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
    expect(sources).toStrictEqual([path.join(dir, 'missing.yaml')])
  })

  it('reports an unreadable external ref of a URL input at the key that holds it', async () => {
    using _fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(mockFetch)

    try {
      await bundleDocument('https://specs.example.com/broken.yaml')
      expect.unreachable('expected bundleDocument to throw')
    } catch (error) {
      expect(Diagnostics.isError(error) && error.diagnostic).toMatchObject({
        code: Diagnostics.code.refNotFound,
        location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
      })
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
