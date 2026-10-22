import http from 'node:http'
import net from 'node:net'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { createPublicFetch, withPublicFetch } from './publicFetch.ts'

const servers: Array<http.Server> = []

async function serve(host: string, handler: http.RequestListener): Promise<string> {
  const server = http.createServer(handler)
  servers.push(server)
  await new Promise<void>((resolve) => server.listen(0, host, resolve))
  return `http://${host}:${(server.address() as AddressInfo).port}`
}

// Only 127.0.0.2 is blocked, so two loopback servers play a public host and a private one.
const onlySecond = new net.BlockList()
onlySecond.addAddress('127.0.0.2', 'ipv4')

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))))
})

describe('createPublicFetch', () => {
  it('returns the body of an allowed host', async () => {
    const url = await serve('127.0.0.1', (_req, res) => res.end('openapi: 3.1.0'))

    const response = await createPublicFetch(onlySecond)(url)

    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toBe('openapi: 3.1.0')
  })

  it('refuses a redirect to a blocked address', async () => {
    const blocked = await serve('127.0.0.2', (_req, res) => res.end('secret'))
    const url = await serve('127.0.0.1', (_req, res) => res.writeHead(302, { location: blocked }).end())

    await expect(createPublicFetch(onlySecond)(url)).rejects.toThrow('not a public address')
  })

  it('refuses an IP literal and a name that resolves to a private address', async () => {
    const url = await serve('127.0.0.1', (_req, res) => res.end('secret'))

    await expect(createPublicFetch()(url)).rejects.toThrow('not a public address')
    await expect(createPublicFetch()(url.replace('127.0.0.1', 'localhost'))).rejects.toThrow('not a public address')
  })

  it('refuses other schemes, methods, and request objects', async () => {
    const fetchPublic = createPublicFetch()

    await expect(fetchPublic('file:///etc/passwd')).rejects.toThrow('http and https')
    await expect(fetchPublic('https://example.com', { method: 'POST' })).rejects.toThrow('GET')
    await expect(fetchPublic(new Request('https://example.com'))).rejects.toThrow('by URL only')
  })

  it('stops following redirects after a few hops', async () => {
    const url = await serve('127.0.0.1', (req, res) => res.writeHead(302, { location: req.url ?? '/' }).end())

    await expect(createPublicFetch(onlySecond)(url)).rejects.toThrow('redirects')
  })
})

describe('withPublicFetch', () => {
  it('swaps the global fetch for the run and puts the original back, even when it throws', async () => {
    const original = globalThis.fetch

    await expect(
      withPublicFetch(async () => {
        expect(globalThis.fetch).not.toBe(original)
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')
    expect(globalThis.fetch).toBe(original)
  })
})
