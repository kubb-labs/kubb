import { describe, expect, it, vi } from 'vitest'
import { Diagnostics } from '@kubb/core'
import { resolveSource } from './source.ts'

function codeOf(error: unknown): string | undefined {
  return Diagnostics.isError(error) ? error.diagnostic.code : undefined
}

describe('resolveSource', () => {
  it.each([
    [401, 'Kubb sends no credentials'],
    [403, 'Kubb sends no credentials'],
    [404, 'Open it in a browser'],
    [418, 'Open the URL in a browser'],
    [500, 'The server failed while serving the document'],
    [503, 'The server failed while serving the document'],
  ])('reports HTTP %i as an input-request-failed diagnostic', async (status, help) => {
    using _fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status }))

    try {
      await resolveSource('https://specs.example.com/openapi.yaml')
      expect.unreachable('expected resolveSource to throw')
    } catch (error) {
      expect(codeOf(error)).toBe(Diagnostics.code.inputRequestFailed)
      expect(Diagnostics.isError(error) && error.diagnostic.message).toContain(`HTTP ${status}`)
      expect(Diagnostics.isError(error) && error.diagnostic.help).toContain(help)
    }
  })

  it('names the URL that failed so a broken $ref is identifiable', async () => {
    using _fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 404 }))

    await expect(resolveSource('https://specs.example.com/schemas/Pet.yaml')).rejects.toThrow('https://specs.example.com/schemas/Pet.yaml')
  })

  it('reports an unreachable host as an input-unreachable diagnostic carrying the connection reason', async () => {
    const failure = new TypeError('fetch failed', { cause: new AggregateError([new Error('connect ECONNREFUSED 127.0.0.1:8000')], '') })
    using _fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(failure)

    try {
      await resolveSource('http://localhost:8000/api/schema/')
      expect.unreachable('expected resolveSource to throw')
    } catch (error) {
      expect(codeOf(error)).toBe(Diagnostics.code.inputUnreachable)
      expect(Diagnostics.isError(error) && error.diagnostic.message).toBe('Cannot reach http://localhost:8000/api/schema/: connect ECONNREFUSED 127.0.0.1:8000')
    }
  })

  it('parses the document when the server answers with 200', async () => {
    using _fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response("openapi: '3.1.0'", { status: 200 }))

    await expect(resolveSource('https://specs.example.com/openapi.yaml')).resolves.toStrictEqual({ openapi: '3.1.0' })
  })

  it('parses a JSON document via the JSON.parse fast path', async () => {
    using _fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ openapi: '3.1.0', paths: {} }), { status: 200 }))

    await expect(resolveSource('https://specs.example.com/openapi.json')).resolves.toStrictEqual({ openapi: '3.1.0', paths: {} })
  })

  it('falls back to the YAML parser for a document JSON.parse rejects', async () => {
    using _fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        `
openapi: '3.1.0'
paths: {}
`,
        { status: 200 },
      ),
    )

    await expect(resolveSource('https://specs.example.com/openapi.yaml')).resolves.toStrictEqual({ openapi: '3.1.0', paths: {} })
  })
})
