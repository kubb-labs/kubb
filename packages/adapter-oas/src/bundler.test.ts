import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { bundleDocument } from './bundler.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
    const doc = await bundleDocument(path.resolve(__dirname, '../mocks/phantom/main.yaml'))

    expect(doc.components?.schemas?.['User']).toMatchObject({ type: 'object' })
    expect(doc.components?.schemas?.['Employer']).toMatchObject({ type: 'object' })
    expect(doc.components?.schemas?.['AppState']).toStrictEqual({
      type: 'object',
      properties: {
        currentUser: { $ref: '#/components/schemas/User' },
        employers: { type: 'array', items: { $ref: '#/components/schemas/Employer' } },
      },
    })
  })

  it('resolves ../ refs from nested files to the same named schema', async () => {
    const doc = await bundleDocument(path.resolve(__dirname, '../mocks/phantom/main.yaml'))

    const mePath = doc.paths?.['/me'] as Record<string, Record<string, unknown>>
    expect(mePath?.['get']?.['responses']).toMatchObject({
      '200': {
        content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
      },
    })
  })

  it('keeps internal #/ refs untouched', async () => {
    const doc = await bundleDocument(path.resolve(__dirname, '../mocks/withExternalFileRef.yaml'))

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
    const doc = await bundleDocument(path.resolve(__dirname, '../mocks/withFragmentRef.yaml'))

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

    const doc = await bundleDocument(path.resolve(__dirname, '../mocks/withUrlRef.yaml'))

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

  it('throws when the input URL cannot be fetched', async () => {
    using _fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(mockFetch)

    await expect(bundleDocument('https://specs.example.com/missing.yaml')).rejects.toThrow('HTTP 404')
  })

  it('throws when the input file does not exist', async () => {
    await expect(bundleDocument(path.resolve(__dirname, '../mocks/doesNotExist.yaml'))).rejects.toThrow()
  })
})
