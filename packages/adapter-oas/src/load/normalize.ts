import path from 'node:path'
import { Diagnostics } from '@kubb/core'
import type { AdapterSource } from '@kubb/core'
import { upgrade } from '@scalar/openapi-upgrader'
import { bundle } from 'api-ref-bundler'
import { parse } from 'yaml'
import type { Document } from '../types.ts'
import { assertInputExists, resolveSource, urlRegExp } from './source.ts'

/**
 * True when `node` contains a `$ref` pointing outside the current document (a relative path,
 * absolute path, or URL). An internal `#/...` fragment does not count.
 *
 * `Object.values` reads array elements and object property values alike, so the same recursion
 * walks both without a separate array branch.
 */
export function hasExternalRef(node: unknown): boolean {
  if (!node || typeof node !== 'object') {
    return false
  }

  const ref = (node as { $ref?: unknown }).$ref
  if (typeof ref === 'string' && !ref.startsWith('#')) {
    return true
  }

  return Object.values(node).some(hasExternalRef)
}

/**
 * Bundles a multi-file OpenAPI document into a single document via `api-ref-bundler`.
 *
 * External file schemas are hoisted into named `components.schemas` entries, so a property
 * pointing at `./schemas/User.yaml` ends up referencing `#/components/schemas/User`. Generators
 * can then emit a named type with an import instead of inlining the shape. Sources are read with
 * the Bun-aware `read` util for local YAML and JSON files, and with `fetch` for HTTP(S) URLs.
 *
 * A document with no `$ref` outside itself has nothing to bundle, so it skips `api-ref-bundler`
 * and returns as parsed. `bundle` only rewrites external refs into internal ones; on an
 * all-internal document it is a no-op that still walks the whole tree to confirm that, which
 * costs real time on a large spec.
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
  const root = await resolver(pathOrUrl)

  if (typeof root === 'object' && root !== null && !hasExternalRef(root)) {
    return root as Document
  }

  return (await bundle(pathOrUrl, resolver)) as Document
}

/**
 * Loads and bundles an OpenAPI document, returning the raw `Document`.
 *
 * A string is a file path or URL: it is bundled via `api-ref-bundler`, hoisting external file
 * schemas into named `components.schemas` entries so generators can emit named types and imports.
 * An object is treated as an already-parsed document. Swagger 2.0 and OpenAPI 3.0 documents are
 * up-converted to OpenAPI 3.1 via `@scalar/openapi-upgrader`.
 *
 * @example
 * ```ts
 * const document = await parseDocument('./openapi.yaml')
 * const document = await parseDocument(rawDocumentObject)
 * ```
 */
export async function parseDocument(pathOrApi: string | Document): Promise<Document> {
  if (typeof pathOrApi === 'string') {
    const bundled = await bundleDocument(pathOrApi)

    return parseDocument(bundled)
  }

  // `upgrade` chains Swagger 2.0 -> 3.0 -> 3.1, leaving documents already on 3.1 untouched.
  return upgrade(pathOrApi, '3.1') as Document
}

/**
 * Creates a `Document` from an `AdapterSource`.
 *
 * - `{ type: 'path' }` resolves and bundles a local file path or remote URL.
 * - `{ type: 'data' }` parses an inline string (YAML/JSON) or raw object.
 *
 * @example
 * ```ts
 * const document = await parseFromConfig({ type: 'path', path: './openapi.yaml' })
 * const document = await parseFromConfig({ type: 'data', data: '{"openapi":"3.0.0",...}' })
 * ```
 */
export async function parseFromConfig(source: AdapterSource): Promise<Document> {
  if (source.type === 'data') {
    // Inline data is a parsed object or a raw YAML/JSON string. Parse the string here so
    // `parseDocument` never mistakes inline content for a file path. `parse` also handles JSON.
    const data = typeof source.data === 'string' ? parse(source.data) : structuredClone(source.data)
    return parseDocument(data as Document)
  }

  // type === 'path'
  if (URL.canParse(source.path)) {
    return parseDocument(source.path)
  }

  const resolved = path.resolve(path.dirname(source.path), source.path)
  await assertInputExists(resolved)
  return parseDocument(resolved)
}

/**
 * Asserts the parsed input is an OpenAPI or Swagger document.
 *
 * {@link validateDocument} keeps spec violations non-fatal so imperfect but usable documents still
 * generate. That leniency also swallowed input that is not a document at all, which then produced
 * an empty build with a success exit code. A missing version field is the one failure that cannot
 * be a usable document, so it is fatal regardless of the `validate` option.
 */
export function assertDocument(document: Document): void {
  if (document && ('openapi' in document || 'swagger' in document)) return

  throw new Diagnostics.Error({
    code: Diagnostics.code.invalidDocument,
    severity: 'error',
    message: 'The resolved `input` is not an OpenAPI or Swagger document: it declares no `openapi` or `swagger` version.',
    help: 'Point `input` at a document that declares `openapi` or `swagger`. If you pass an object, pass the spec itself rather than a wrapper such as `{ path }` or `{ data }`.',
    location: { kind: 'config' },
  })
}

/**
 * Validates an OpenAPI document using `@readme/openapi-parser` with colorized error output.
 *
 * @example
 * ```ts
 * await validateDocument(document)
 * ```
 */
export async function validateDocument(document: Document, { throwOnError = false }: { throwOnError?: boolean } = {}): Promise<void> {
  // The heaviest dependency in the package, and every config importing `@kubb/adapter-oas` would
  // pay for it even with `validate` off.
  const { compileErrors, validate } = await import('@readme/openapi-parser')

  try {
    // `validate` dereferences its input in place, so clone to keep the cached document intact.
    const result = await validate(structuredClone(document), {
      validate: {
        errors: { colorize: true },
      },
    })

    if (!result.valid) {
      throw new Error(compileErrors(result))
    }
  } catch (error) {
    if (throwOnError) {
      throw error
    }

    // Validation failures are non-fatal, mirror plugin-oas behavior
  }
}
