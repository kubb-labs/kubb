import dns from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import { Readable, Transform } from 'node:stream'
import { isPublicAddress } from '@kubb/core'

const MAX_REDIRECTS = 5
const MAX_BYTES = 50 * 1024 * 1024
const REDIRECTS = new Set([301, 302, 303, 307, 308])
const NO_BODY = new Set([204, 205, 304])

function notPublic(host: string): Error {
  return new Error(`${host} is not a public address, so a managed agent does not fetch from it`)
}

function createLookup(blocked?: net.BlockList): net.LookupFunction {
  return (hostname, options, callback) => {
    dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
      if (error) return callback(error, '', 0)
      const found = addresses as Array<dns.LookupAddress>
      // One private answer is enough to refuse, so a name cannot mix a public and a private record.
      if (!found.length || found.some(({ address }) => !isPublicAddress(address, blocked))) return callback(notPublic(hostname), '', 0)
      return options.all ? callback(null, found) : callback(null, found[0]!.address, found[0]!.family)
    })
  }
}

function request({ url, blocked, signal }: { url: URL; blocked?: net.BlockList; signal?: AbortSignal | null }): Promise<Response> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return Promise.reject(new Error(`Only http and https URLs are fetched, not ${url.protocol}`))
  // An IP literal skips the lookup below, so it is checked here.
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (net.isIP(host) && !isPublicAddress(host, blocked)) return Promise.reject(notPublic(host))

  return new Promise((resolve, reject) => {
    const send = url.protocol === 'https:' ? https.request : http.request
    // `lookup` runs for the connection itself, so a name that changes its answer after a check cannot reach a blocked address.
    const req = send(url, { method: 'GET', lookup: createLookup(blocked), signal: signal ?? undefined, headers: { 'accept-encoding': 'identity' } }, (res) => {
      const headers = new Headers()
      for (const [key, value] of Object.entries(res.headers)) {
        for (const item of [value].flat()) if (item !== undefined) headers.append(key, item)
      }
      let total = 0
      const limit = new Transform({
        transform(chunk: Buffer, _encoding, done) {
          total += chunk.length
          done(total > MAX_BYTES ? new Error('The response is larger than 50 MB') : null, chunk)
        },
      })
      res.on('error', (error) => limit.destroy(error))
      res.pipe(limit)
      const body = NO_BODY.has(res.statusCode ?? 0) ? null : (Readable.toWeb(limit) as unknown as ReadableStream)
      resolve(new Response(body, { status: res.statusCode, statusText: res.statusMessage, headers }))
    })
    req.on('error', reject)
    req.end()
  })
}

/**
 * Builds a `fetch` that only reaches addresses `blocked` does not list. It follows redirects itself
 * and checks every hop, and takes GET requests only, since that is all a spec load needs.
 */
export function createPublicFetch(blocked?: net.BlockList): typeof fetch {
  const publicFetch = async (input: Parameters<typeof fetch>[0], init?: RequestInit): Promise<Response> => {
    if (typeof input !== 'string' && !(input instanceof URL)) throw new TypeError('A managed agent fetches by URL only')
    if (init?.method && init.method.toUpperCase() !== 'GET') throw new TypeError('A managed agent only sends GET requests')

    let url = new URL(input)
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const response = await request({ url, blocked, signal: init?.signal })
      const location = response.headers.get('location')
      if (!REDIRECTS.has(response.status) || !location) return response
      await response.body?.cancel()
      url = new URL(location, url)
    }
    throw new Error(`Stopped after ${MAX_REDIRECTS} redirects from ${String(input)}`)
  }
  return publicFetch as typeof fetch
}

/**
 * Runs `run` with the global `fetch` limited to public addresses, then puts the original back.
 * A managed agent runs one job at a time, so nothing else shares the window.
 */
export async function withPublicFetch<T>(run: () => Promise<T>): Promise<T> {
  const original = globalThis.fetch
  globalThis.fetch = createPublicFetch()
  try {
    return await run()
  } finally {
    globalThis.fetch = original
  }
}
