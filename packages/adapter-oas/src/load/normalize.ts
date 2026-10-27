import { join } from 'node:path'
import { escapePointerToken, getErrorMessage, toError } from '@internals/utils'
import { Diagnostics } from '@kubb/kit'
import type { AdapterSource, Diagnostic } from '@kubb/kit'
import { upgrade } from '@scalar/openapi-upgrader'
import { bundle } from 'api-ref-bundler'
import { createRefs } from '../refs.ts'
import type { Document } from '../types.ts'
import type { ValidationErrors, WorkerResult } from './validateWorker.ts'
import { assertInputExists, parseYaml, resolveSource, urlRegExp } from './source.ts'

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
 * Replaces each `$ref` into `#/paths/...` with a copy of its target, in place.
 *
 * The Swagger 2.0 upgrade moves `responses/200/schema` under `content`, so a ref to the old location
 * would no longer resolve. A ref that points back into itself is kept, since inlining it never ends.
 */
function inlinePathRefs(node: unknown, resolve: (ref: string) => unknown, visiting: Array<string> = []): unknown {
  if (!node || typeof node !== 'object') {
    return node
  }

  const ref = (node as { $ref?: unknown }).$ref
  if (typeof ref === 'string' && ref.startsWith('#/paths/') && !visiting.includes(ref)) {
    const target = resolve(ref)
    return target && typeof target === 'object' ? inlinePathRefs(structuredClone(target), resolve, [...visiting, ref]) : node
  }

  for (const [key, value] of Object.entries(node)) {
    ;(node as Record<string, unknown>)[key] = inlinePathRefs(value, resolve, visiting)
  }
  return node
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
 * `document` stands in for the file at `pathOrUrl`, such as inline input. Every other file or URL
 * read, including one that fails, lands in `sources`. A `$ref` that cannot be read reports
 * `KUBB_REF_NOT_FOUND` at the key that holds it.
 *
 * @example Local file
 * `const document = await bundleDocument('./openapi.yaml')`
 *
 * @example Remote URL
 * `const document = await bundleDocument('https://example.com/openapi.yaml')`
 */
export async function bundleDocument(pathOrUrl: string, { document, sources = [] }: { document?: Document; sources?: Array<string> } = {}): Promise<Document> {
  const cache = new Map<string, Promise<object | string>>()
  // api-ref-bundler refers to the same URL as both `https://` and the posix-normalized
  // `https:/`, so key on the canonical href to fetch each source once and to match the input.
  const toKey = (sourcePath: string) => (urlRegExp.test(sourcePath) ? new URL(sourcePath).href : sourcePath)

  const resolver = (sourcePath: string) => {
    if (document && sourcePath === pathOrUrl) {
      return Promise.resolve(document)
    }
    const key = toKey(sourcePath)
    const cached = cache.get(key)
    if (cached) {
      return cached
    }

    sources.push(key)
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

  return (await bundle(pathOrUrl, resolver, {
    hooks: {
      onError: (message, { path, state }) => {
        // Only a `$ref` in the input itself has a key in the document to point at.
        const pointer = toKey(state.baseFile) === toKey(pathOrUrl) ? `#/${path.map((token) => escapePointerToken(String(token))).join('/')}` : undefined
        const diagnostic: Diagnostic = {
          code: Diagnostics.code.refNotFound,
          severity: 'error',
          message: `Could not bundle an external \`$ref\`. ${message}.`,
          help: 'Check that the file or URL the `$ref` points at exists and is readable, or fix the `$ref`.',
          ...(pointer && { location: { kind: 'schema', pointer } }),
        }
        if (!Diagnostics.report(diagnostic)) {
          throw new Diagnostics.Error(diagnostic)
        }
      },
    },
  })) as Document
}

// Inline input has no file of its own, so its relative `$ref`s resolve from a stand-in name in `root`.
const inlineInputName = '<inline input>'

/**
 * Creates a `Document` from an `AdapterSource`.
 *
 * - `{ type: 'path' }` bundles an absolute file path (core resolves `input`) or remote URL via
 *   `api-ref-bundler`, hoisting external file schemas into named `components.schemas` entries so
 *   generators can emit named types and imports.
 * - `{ type: 'data' }` parses an inline string (YAML/JSON) or raw object, then bundles its
 *   external `$ref`s from `root` when it has any. Each file or URL read lands in `sources`.
 *
 * Swagger 2.0 and OpenAPI 3.0 documents are up-converted to OpenAPI 3.1 via `@scalar/openapi-upgrader`.
 *
 * @example
 * ```ts
 * const document = await parseFromConfig({ type: 'path', path: './openapi.yaml' })
 * const document = await parseFromConfig({ type: 'data', data: '{"openapi":"3.0.0",...}' })
 * ```
 */
export async function parseFromConfig(source: AdapterSource, sources: Array<string> = []): Promise<Document> {
  const raw = await (async (): Promise<Document> => {
    // YAML parsing also handles JSON.
    if (source.type === 'data') {
      const data =
        typeof source.data === 'string'
          ? (parseYaml(source.data, {
              origin: 'the inline `input` string',
              help: 'Fix the syntax at the reported line. Kubb reads `input` as an inline spec, not a file path, because it starts with `{`, `[`, `openapi:`, or `swagger:`, or spans several lines.',
            }) as Document)
          : structuredClone(source.data as Document)
      return source.root && hasExternalRef(data) ? bundleDocument(join(source.root, inlineInputName), { document: data, sources }) : data
    }
    await assertInputExists(source.path)
    return bundleDocument(source.path, { sources })
  })()

  // Unquoted `swagger: 2.0` parses as the number 2, which `upgrade` does not recognise as a version.
  if (raw && typeof raw === 'object') {
    const document = raw as Record<string, unknown>
    for (const key of ['swagger', 'openapi']) {
      const version = document[key]
      if (typeof version === 'number') {
        document[key] = Number.isInteger(version) ? version.toFixed(1) : String(version)
      }
    }
  }

  if (raw && typeof raw === 'object' && 'swagger' in raw) {
    const refs = createRefs(raw)
    inlinePathRefs(raw, (ref) => refs.resolve(ref, { report: false }))
  }

  // `upgrade` chains Swagger 2.0 -> 3.0 -> 3.1, leaving documents already on 3.1 untouched.
  try {
    return upgrade(raw, '3.1') as Document
  } catch (error) {
    const declared = raw && typeof raw === 'object' ? ((raw as { openapi?: unknown }).openapi ?? (raw as { swagger?: unknown }).swagger) : undefined
    throw new Diagnostics.Error({
      code: Diagnostics.code.invalidDocument,
      severity: 'error',
      message: `Cannot upgrade the document${declared ? ` (version ${String(declared)})` : ''} to OpenAPI 3.1: ${getErrorMessage(error)}`,
      help: 'Kubb reads Swagger 2.0, OpenAPI 3.0, and OpenAPI 3.1. Set `swagger` or `openapi` to one of those versions, and fix the reported problem in the document.',
      location: { kind: 'config' },
      cause: toError(error),
    })
  }
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
  // An inline string with no YAML mapping parses to a plain string, which the `in` checks would throw on.
  if (document && typeof document === 'object' && ('openapi' in document || 'swagger' in document)) return

  throw new Diagnostics.Error({
    code: Diagnostics.code.invalidDocument,
    severity: 'error',
    message: 'The resolved `input` is not an OpenAPI or Swagger document: it declares no `openapi` or `swagger` version.',
    help: 'Point `input` at a document that declares `openapi` or `swagger`. If you pass an object, pass the spec itself rather than a wrapper such as `{ path }` or `{ data }`.',
    location: { kind: 'config' },
  })
}

/** Reports a validation problem as a `KUBB_INVALID_SPEC` warning, a no-op outside a build. */
function reportInvalidSpec(message: string): void {
  Diagnostics.report({
    code: Diagnostics.code.invalidSpec,
    severity: 'warning',
    message,
    help: 'Fix the spec, or run `kubb validate` to list every error. Set `validate: false` on the adapter to skip this check.',
  })
}

/**
 * Validates an OpenAPI document using `@readme/openapi-parser`. Throws with `throwOnError`, otherwise warns.
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

  let result: Awaited<ReturnType<typeof validate>>
  try {
    // `validate` dereferences its input in place, so clone to keep the cached document intact.
    result = await validate(structuredClone(document), {
      validate: {
        errors: { colorize: throwOnError },
      },
    })
  } catch (error) {
    if (throwOnError) throw error
    reportInvalidSpec(getErrorMessage(error))
    return
  }

  if (result.valid) return
  if (throwOnError)
    throw new Diagnostics.Error({
      code: Diagnostics.code.invalidSpec,
      severity: 'error',
      message: compileErrors(result),
      help: 'Fix each problem listed in the spec, then validate again.',
    })

  reportValidationErrors(result)
}

function reportValidationErrors({ errors, additionalErrors }: ValidationErrors): void {
  for (const { message } of errors) {
    // The code frame after the first line numbers a JSON copy of the spec, not the user's file.
    reportInvalidSpec(message.replace(/\n.*/s, ''))
  }
  if (additionalErrors > 0) {
    reportInvalidSpec(`${additionalErrors} more validation errors are not listed.`)
  }
}

/**
 * Validates like {@link validateDocument} without `throwOnError`, but in a worker thread, so the
 * build keeps generating while `@readme/openapi-parser` dereferences and checks the spec. Await the
 * returned promise inside the build's diagnostics scope to report its warnings there. Falls back to
 * validating in place where worker threads are missing, as in edge runtimes.
 */
export async function validateDocumentInWorker(document: Document): Promise<void> {
  let message: WorkerResult
  try {
    const { Worker } = await import('node:worker_threads')
    // Tests run the `.ts` source; the build emits `validateWorker.js` next to the bundle.
    const workerFile = import.meta.url.endsWith('.ts') ? './validateWorker.ts' : './validateWorker.js'
    // `workerData` is a structured clone, so the worker can dereference it without touching the cached document.
    const worker = new Worker(new URL(workerFile, import.meta.url), { workerData: document })
    message = await new Promise<WorkerResult>((resolve, reject) => {
      worker.once('message', resolve)
      worker.once('error', reject)
      worker.once('exit', (code) => reject(new Error(`Validation worker exited with code ${code}`)))
    }).finally(() => worker.terminate())
  } catch {
    return validateDocument(document)
  }

  if ('thrown' in message) return reportInvalidSpec(message.thrown)
  if (!message.valid) reportValidationErrors(message)
}
