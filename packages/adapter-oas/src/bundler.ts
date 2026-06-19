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
 * Shifts collision suffixes created by `api-ref-bundler` from `1`-based to `2`-based, matching
 * the `2, 3, …` convention that `getSchemas` uses for same-source collisions.
 *
 * `api-ref-bundler` resolves name conflicts by appending a counter starting at `1`
 * (e.g. `Category`, `Category1`). This function detects every schema whose name ends in a
 * digit and whose base name also exists in `components.schemas`, then renames it so the suffix
 * starts at `2` instead of `1`. `$ref` strings throughout the document are rewritten to match
 * via a JSON round-trip. Schemas whose trailing digits are unrelated to a collision (no base-name
 * sibling) are left unchanged.
 */
function shiftBundlerCollisionSuffix(doc: Document): Document {
  const rawSchemas = doc.components?.schemas
  if (!rawSchemas) return doc

  const names = new Set(Object.keys(rawSchemas))
  const renames = new Map<string, string>()

  // Collect candidates in descending suffix order so Name3→Name4 is processed before
  // Name2→Name3, preventing double-renaming when slots chain.
  const candidates = [...names]
    .map((name) => {
      const m = name.match(/^(.+?)(\d+)$/)
      return m && names.has(m[1]!) ? { name, base: m[1]!, n: parseInt(m[2]!, 10) } : null
    })
    .filter((c): c is { name: string; base: string; n: number } => c !== null)
    .sort((a, b) => b.n - a.n)

  for (const { name, base, n } of candidates) {
    let newN = n + 1
    let newName = `${base}${newN}`
    while (names.has(newName)) newName = `${base}${++newN}`
    renames.set(name, newName)
    names.delete(name)
    names.add(newName)
  }

  if (renames.size === 0) return doc

  // Rewrite $ref strings via JSON round-trip. The Map iterates in insertion (descending-suffix)
  // order, so higher-numbered renames are applied first and no $ref is rewritten twice.
  let json = JSON.stringify(doc)
  for (const [old, next] of renames) {
    json = json.replaceAll(`"#/components/schemas/${old}"`, `"#/components/schemas/${next}"`)
  }

  const updated = JSON.parse(json) as Document
  updated.components!.schemas = Object.fromEntries(Object.entries(updated.components!.schemas!).map(([k, v]) => [renames.get(k) ?? k, v]))

  return updated
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

  const bundled = (await bundle(pathOrUrl, resolver)) as Document
  return shiftBundlerCollisionSuffix(bundled)
}
