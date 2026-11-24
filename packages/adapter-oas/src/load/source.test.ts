import { describe, expect, it, vi } from 'vitest'
import { Diagnostics } from '@kubb/kit'
import { assertInputExists, isPrivateHost, resolveSource } from './source.ts'

function codeOf(error: unknown): string | undefined {
  return Diagnostics.isError(error) ? error.diagnostic.code : undefined
}

describe('resolveSource', () => {
  it.each([
    [401, 'Kubb sends no credentials'],
    [404, 'Open it in a browser'],
    [418, 'Open the URL in a browser'],
    [503, 'The server failed while serving the document'],
  ])('reports HTTP %i as an input-request-failed diagnostic naming the URL', async (status, help) => {
    using _fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status }))
    const url = 'https://specs.example.com/schemas/Pet.yaml'

    try {
      await resolveSource(url)
      expect.unreachable('expected resolveSource to throw')
    } catch (error) {
      expect(codeOf(error)).toBe(Diagnostics.code.inputRequestFailed)
      expect(Diagnostics.isError(error) && error.diagnostic.message).toContain(`HTTP ${status}`)
      expect(Diagnostics.isError(error) && error.diagnostic.message).toContain(url)
      expect(Diagnostics.isError(error) && error.diagnostic.help).toContain(help)
    }
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

  it.each([
    {
      title: 'a JSON document via the JSON.parse fast path',
      body: JSON.stringify({ openapi: '3.1.0', paths: {} }),
      url: 'https://specs.example.com/openapi.json',
    },
    {
      title: 'a YAML document that JSON.parse rejects via the YAML parser',
      body: "openapi: '3.1.0'\npaths: {}\n",
      url: 'https://specs.example.com/openapi.yaml',
    },
  ])('parses $title', async ({ body, url }) => {
    using _fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status: 200 }))

    await expect(resolveSource(url)).resolves.toStrictEqual({ openapi: '3.1.0', paths: {} })
  })

  it('keeps the YAML parser, and its duplicate-key error, for a .yaml URL with a query string', async () => {
    const body = '{"openapi":"3.1.0","paths":{"/pets":{},"/pets":{}}}'
    using _fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status: 200 }))

    const error = await resolveSource('https://specs.example.com/openapi.yaml?rev=1').catch((caught: unknown) => caught)

    expect(Diagnostics.isError(error) && error.diagnostic.code).toBe(Diagnostics.code.invalidDocument)
  })
})

describe('resolveSource requests', () => {
  const url = 'https://specs.example.com/openapi.json'
  const ok = () => new Response('{"openapi":"3.1.0"}', { status: 200 })

  it('passes a signal that a canceled build aborts, and follows redirects by default', async () => {
    using fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => ok())
    const controller = new AbortController()

    await resolveSource(url, { signal: controller.signal })
    const init = fetchSpy.mock.calls[0]?.[1]
    controller.abort()

    expect(init?.redirect).toBe('follow')
    expect(init?.signal?.aborted).toBe(true)
  })

  it('makes a redirect fail for a public-only request', async () => {
    using fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => ok())

    await resolveSource(url, { publicOnly: true })

    expect(fetchSpy.mock.calls[0]?.[1]?.redirect).toBe('error')
  })

  it('reports a body that fails after the headers as an unreachable input', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.error(new DOMException('The operation was aborted due to timeout', 'TimeoutError'))
      },
    })
    using _fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status: 200 }))

    expect(codeOf(await resolveSource(url).catch((caught: unknown) => caught))).toBe(Diagnostics.code.inputUnreachable)
  })

  it('rethrows the cancel reason instead of reporting the host as unreachable', async () => {
    const controller = new AbortController()
    const reason = new Error('canceled')
    using _fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      controller.abort(reason)
      throw new DOMException('aborted', 'AbortError')
    })

    await expect(resolveSource(url, { signal: controller.signal })).rejects.toBe(reason)
  })
})

describe('isPrivateHost', () => {
  it.each(['http://127.0.0.1:8080/x.yaml', 'http://[::1]/x.yaml', 'http://169.254.169.254/latest', 'http://10.0.0.7/x.yaml', 'http://localhost/x.yaml'])(
    'treats %s as not public',
    async (url) => {
      await expect(isPrivateHost(new URL(url))).resolves.toBe(true)
    },
  )

  it('treats a public IP literal as public', async () => {
    await expect(isPrivateHost(new URL('https://93.184.216.34/x.yaml'))).resolves.toBe(false)
  })

  it('treats a host that does not resolve as not public', async () => {
    await expect(isPrivateHost(new URL('https://kubb-test.invalid/x.yaml'))).resolves.toBe(true)
  })

  it('rethrows the cancel reason of a canceled lookup', async () => {
    const reason = new Error('canceled')

    await expect(isPrivateHost(new URL('https://kubb-test.invalid/x.yaml'), { signal: AbortSignal.abort(reason) })).rejects.toBe(reason)
  })
})

describe('assertInputExists', () => {
  it('skips the check for an http(s) URL', async () => {
    await expect(assertInputExists('https://specs.example.com/openapi.yaml')).resolves.toBeUndefined()
  })

  it('reports a missing Windows-style absolute path instead of treating it as a URL', async () => {
    try {
      await assertInputExists('C:\\specs\\missing.yaml')
      expect.unreachable('expected assertInputExists to throw')
    } catch (error) {
      expect(codeOf(error)).toBe(Diagnostics.code.inputNotFound)
    }
  })
})
