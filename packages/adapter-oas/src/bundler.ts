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
 * Returns the trailing numeric suffix of a name (e.g. `1` for `"Category1"`), or `null` when
 * the name does not end in digits.
 */
function trailingNumber(name: string): number | null {
  const match = name.match(/(\d+)$/)
  return match ? parseInt(match[1]!, 10) : null
}

/**
 * Shifts collision suffixes created by `api-ref-bundler` from `1`-based to `2`-based, matching
 * the `2, 3, …` convention that `getSchemas` uses for same-source collisions.
 *
 * `api-ref-bundler` resolves name conflicts by appending a counter starting at `1`
 * (e.g. `Category`, `Category1`). This function detects every schema whose name ends in a
 * digit and whose base name also exists in `components.schemas`, then renames it so the suffix
 * starts at `2` instead of `1`. The `$ref` strings throughout the document are rewritten to
 * match. Schemas whose trailing digits are unrelated to a collision (no `basename` sibling) are
 * left unchanged.
 */
function shiftBundlerCollisionSuffix(doc: Document): Document {
  const rawSchemas = doc.components?.schemas as Record<string, unknown> | undefined
  if (!rawSchemas) return doc

  // Determine which names need renaming.
  // Process in descending suffix order so renaming Name3→Name4 before Name2→Name3 avoids
  // transient conflicts when the freed slot is reused.
  const tracked = new Set(Object.keys(rawSchemas))
  const renames = new Map<string, string>()

  const candidates = [...tracked]
    .map((name) => ({ name, n: trailingNumber(name) }))
    .filter((c): c is { name: string; n: number } => c.n !== null)
    .sort((a, b) => b.n - a.n)

  for (const { name, n } of candidates) {
    const base = name.slice(0, -String(n).length)
    if (!base || !tracked.has(base)) continue

    // Find the first free slot above n.
    let newN = n + 1
    let newName = `${base}${newN}`
    while (tracked.has(newName)) {
      newN++
      newName = `${base}${newN}`
    }

    renames.set(name, newName)
    tracked.delete(name)
    tracked.add(newName)
  }

  if (renames.size === 0) return doc

  // Build a $ref-path → new-path lookup for the deep walk.
  const refRenames = new Map<string, string>()
  for (const [oldName, newName] of renames) {
    refRenames.set(`#/components/schemas/${oldName}`, `#/components/schemas/${newName}`)
  }

  // Walk every value in the document and rewrite $ref strings.
  const walk = (value: unknown): unknown => {
    if (typeof value !== 'object' || value === null) return value
    if (Array.isArray(value)) return value.map(walk)

    const obj = value as Record<string, unknown>
    const ref = obj['$ref']
    if (typeof ref === 'string' && refRenames.has(ref)) {
      return { ...obj, $ref: refRenames.get(ref) }
    }

    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, walk(v)]))
  }

  const updated = walk(doc) as Document

  // Rename the schema keys in components.schemas.
  const oldSchemas = updated.components!.schemas as Record<string, unknown>
  const newSchemas: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(oldSchemas)) {
    newSchemas[renames.get(key) ?? key] = value
  }

  return { ...updated, components: { ...updated.components, schemas: newSchemas } }
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
