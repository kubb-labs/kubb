import path from 'node:path'
import { exists, mergeDeep, Url } from '@internals/utils'
import { Diagnostics } from '@kubb/core'
import type { AdapterSource } from '@kubb/core'
import OASNormalize from 'oas-normalize'
import { bundleDocument } from './bundler.ts'
import { MERGE_DEFAULT_TITLE, MERGE_DEFAULT_VERSION, MERGE_OPENAPI_VERSION } from './constants.ts'
import { isOpenApiV2Document } from './guards.ts'
import type { Document } from './types.ts'

export type ParseOptions = {
  canBundle?: boolean
  enablePaths?: boolean
}

export type ValidateDocumentOptions = {
  throwOnError?: boolean
}

/**
 * Loads and dereferences an OpenAPI document, returning the raw `Document`.
 *
 * Accepts a file path string or an already-parsed document object. File paths and URLs are
 * bundled via `api-ref-bundler`, hoisting external file schemas into named `components.schemas`
 * entries so generators can emit named types and imports. Swagger 2.0 documents are
 * automatically up-converted to OpenAPI 3.0 via `swagger2openapi`.
 *
 * @example
 * ```ts
 * const document = await parseDocument('./openapi.yaml')
 * const document = await parse(rawDocumentObject, { canBundle: false })
 * ```
 */
export async function parseDocument(pathOrApi: string | Document, { canBundle = true, enablePaths = true }: ParseOptions = {}): Promise<Document> {
  if (typeof pathOrApi === 'string' && canBundle) {
    const bundled = await bundleDocument(pathOrApi)

    return parseDocument(bundled, { canBundle: false, enablePaths })
  }

  const oasNormalize = new OASNormalize(pathOrApi, {
    enablePaths,
    colorizeErrors: true,
  })
  const document = (await oasNormalize.load()) as Document

  if (isOpenApiV2Document(document)) {
    const { default: swagger2openapi } = await import('swagger2openapi')
    const { openapi } = await swagger2openapi.convertObj(document, {
      anchors: true,
    })

    return openapi as Document
  }

  return document
}

/**
 * Deep-merges multiple OpenAPI documents into a single `Document`.
 *
 * Each document is parsed independently, then deep-merged into one in array order.
 * Throws when the input array is empty.
 *
 * @example
 * ```ts
 * const document = await mergeDocuments(['./pets.yaml', './orders.yaml'])
 * ```
 */
export async function mergeDocuments(pathOrApi: Array<string | Document>): Promise<Document> {
  const documents = await Promise.all(pathOrApi.map((p) => parseDocument(p, { enablePaths: false, canBundle: false })))

  if (documents.length === 0) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.inputRequired,
      severity: 'error',
      message: 'No OAS documents were provided for merging.',
      help: 'Pass at least one path or document to `input.path`.',
      location: { kind: 'config' },
    })
  }

  const seed: Document = {
    openapi: MERGE_OPENAPI_VERSION,
    info: { title: MERGE_DEFAULT_TITLE, version: MERGE_DEFAULT_VERSION },
    paths: {},
    components: { schemas: {} },
  } as Document

  const merged = documents.reduce(
    (acc, current) => mergeDeep(acc as Record<string, unknown>, current as Record<string, unknown>),
    seed as Record<string, unknown>,
  )

  return parseDocument(merged as Document)
}

/**
 * Creates a `Document` from an `AdapterSource`.
 *
 * Handles all three source types:
 * - `{ type: 'path' }` resolves and bundles a local file path or remote URL.
 * - `{ type: 'paths' }` merges multiple file paths into a single document.
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
    if (typeof source.data === 'object') {
      return parseDocument(structuredClone(source.data) as Document)
    }

    return parseDocument(source.data as string, { canBundle: false })
  }

  if (source.type === 'paths') {
    return mergeDocuments(source.paths)
  }

  // type === 'path'
  if (Url.canParse(source.path)) {
    return parseDocument(source.path)
  }

  const resolved = path.resolve(path.dirname(source.path), source.path)
  await assertInputExists(resolved)
  return parseDocument(resolved)
}

/**
 * Throws a coded `KUBB_INPUT_NOT_FOUND` diagnostic when a local input path does not exist.
 * URLs are skipped, and a malformed but readable file is left for `parseDocument` to surface
 * its parse error instead.
 */
export async function assertInputExists(input: string): Promise<void> {
  if (Url.canParse(input)) {
    return
  }
  if (!(await exists(input))) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.inputNotFound,
      severity: 'error',
      message: `Cannot read the file set in \`input.path\` (or via \`kubb generate PATH\`): ${input}`,
      help: 'Check that the path exists and is readable, then set it in `input.path` or pass it as `kubb generate PATH`.',
      location: { kind: 'config' },
    })
  }
}

/**
 * Validates an OpenAPI document using `oas-normalize` with colorized error output.
 *
 * @example
 * ```ts
 * await validateDocument(document)
 * ```
 */
export async function validateDocument(document: Document, { throwOnError = false }: ValidateDocumentOptions = {}): Promise<void> {
  try {
    const oasNormalize = new OASNormalize(document, {
      enablePaths: true,
      colorizeErrors: true,
    })

    await oasNormalize.validate({
      parser: {
        validate: {
          errors: { colorize: true },
        },
      },
    })
  } catch (error) {
    if (throwOnError) {
      throw error
    }

    // Validation failures are non-fatal, mirror plugin-oas behavior
  }
}
