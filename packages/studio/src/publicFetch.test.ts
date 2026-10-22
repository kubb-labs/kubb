import http from 'node:http'
import net from 'node:net'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { assertPublicGitInput, createPublicFetch, isPublicAddress, withPublicFetch } from './publicFetch.ts'

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

describe('isPublicAddress', () => {
  it.each(['8.8.8.8', '93.184.216.34', '2606:4700:4700::1111'])('allows %s', (address) => expect(isPublicAddress(address)).toBe(true))

  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '::1',
    'fe80::1',
    'fd00::1',
    '::ffff:127.0.0.1',
    '::ffff:169.254.169.254',
    'not an ip',
  ])('refuses %s', (address) => expect(isPublicAddress(address)).toBe(false))
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

describe('assertPublicGitInput', () => {
  it('accepts an https repository on a public address', async () => {
    await expect(assertPublicGitInput('git+https://93.184.216.34/acme/api.git#main:openapi.yaml')).resolves.toBeUndefined()
  })

  it.each([
    ['plain http', 'git+http://93.184.216.34/api.git#main:a.yaml', 'https only'],
    ['an scp style address', 'git+git@github.com:acme/api.git#main:a.yaml', 'https only'],
    ['a local path', 'git+file:///srv/api.git#main:a.yaml', 'https only'],
    ['a private address', 'git+https://10.0.0.5/api.git#main:a.yaml', 'not a public address'],
    ['the metadata address', 'git+https://169.254.169.254/api.git#main:a.yaml', 'not a public address'],
    ['a name that resolves to loopback', 'git+https://localhost/api.git#main:a.yaml', 'not a public address'],
  ])('refuses %s', async (_label, input, message) => {
    await expect(assertPublicGitInput(input)).rejects.toThrow(message)
  })
})
