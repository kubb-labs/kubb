import { read } from '@internals/utils'
import { bundle } from 'api-ref-bundler'
import { parse } from 'yaml'
import type { Document } from './types.ts'

const urlRegExp = /^https?:\/+/i

async function readSource(sourcePath: string): Promise<string> {
  if (urlRegExp.test(sourcePath)) {
    // api-ref-bundler joins relative refs with posix normalization, collapsing `https://` to
    // `https:/`. The WHATWG URL parser restores the double slash.
    const url = new URL(sourcePath)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Cannot fetch the OAS document at ${url.href} (HTTP ${response.status})`)
    }

    return response.text()
  }

  return read(sourcePath)
}

async function resolveSource(sourcePath: string): Promise<object | string> {
  const data = await readSource(sourcePath)

  if (sourcePath.toLowerCase().endsWith('.md')) {
    return data
  }

  return parse(data) as object
}

/**
 * Bundles a multi-file OpenAPI document into a single document via `api-ref-bundler`.
 *
 * External file schemas are hoisted into named `components.schemas` entries, so a property
 * pointing at `./schemas/User.yaml` ends up referencing `#/components/schemas/User`. Generators
 * can then emit a named type with an import instead of inlining the shape. Sources are read with
 * the Bun-aware `read` util for local YAML and JSON files, and with `fetch` for HTTP(S) URLs.
 *
 * @example Local file
 * `const document = await bundleDocument('./openapi.yaml')`
 *
 * @example Remote URL
 * `const document = await bundleDocument('https://example.com/openapi.yaml')`
 */
export async function bundleDocument(pathOrUrl: string): Promise<Document> {
  const cache = new Map<string, Promise<object | string>>()

  const resolver = (sourcePath: string) => {
    // api-ref-bundler refers to the same URL as both `https://` and the posix-normalized
    // `https:/`, so cache on the canonical href to fetch each source once.
    const key = urlRegExp.test(sourcePath) ? new URL(sourcePath).href : sourcePath
    const cached = cache.get(key)
    if (cached) {
      return cached
    }

    const result = resolveSource(sourcePath)
    cache.set(key, result)
    return result
  }

  // api-ref-bundler swallows resolver errors and leaves refs unresolved, so surface an
  // unreadable input document as a hard error before bundling.
  await resolver(pathOrUrl)

  return (await bundle(pathOrUrl, resolver)) as Document
}
