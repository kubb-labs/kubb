import path from 'node:path'
import { URLPath } from '@internals/utils'
import type { AdapterSource } from '@kubb/core'
import { bundle, loadConfig } from '@redocly/openapi-core'
import yaml from '@stoplight/yaml'
import OASNormalize from 'oas-normalize'
import { mergeDeep } from 'remeda'
import swagger2openapi from 'swagger2openapi'
import { MERGE_DEFAULT_TITLE, MERGE_DEFAULT_VERSION, MERGE_OPENAPI_VERSION } from './constants.ts'
import { isOpenApiV2Document } from './guards.ts'
import type { Document } from './types.ts'

export type ParseOptions = {
  canBundle?: boolean
  enablePaths?: boolean
}

/**
 * Loads and dereferences an OpenAPI document, returning the raw `Document`.
 *
 * Accepts a file path string or an already-parsed document object. File paths are bundled via
 * Redocly to resolve external `$ref`s. Swagger 2.0 documents are automatically up-converted
 * to OpenAPI 3.0 via `swagger2openapi`.
 *
 * @example
 * ```ts
 * const document = await parseDocument('./openapi.yaml')
 * const document = await parse(rawDocumentObject, { canBundle: false })
 * ```
 */
export async function parseDocument(pathOrApi: string | Document, { canBundle = true, enablePaths = true }: ParseOptions = {}): Promise<Document> {
  if (typeof pathOrApi === 'string' && canBundle) {
    const config = await loadConfig()
    const bundleResults = await bundle({ ref: pathOrApi, config, base: pathOrApi })

    return parseDocument(bundleResults.bundle.parsed as string, { canBundle, enablePaths })
  }

  const oasNormalize = new OASNormalize(pathOrApi, {
    enablePaths,
    colorizeErrors: true,
  })
  const document = (await oasNormalize.load()) as Document

  if (isOpenApiV2Document(document)) {
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
 * Each document is parsed independently then recursively merged with `remeda`'s `mergeDeep`.
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
    throw new Error('No OAS documents provided for merging.')
  }

  const seed: Document = {
    openapi: MERGE_OPENAPI_VERSION,
    info: { title: MERGE_DEFAULT_TITLE, version: MERGE_DEFAULT_VERSION },
    paths: {},
    components: { schemas: {} },
  } as Document

  const merged = documents.reduce((acc, current) => mergeDeep(acc, current as Document), seed)

  return parseDocument(merged)
}

/**
 * Creates a `Document` from an `AdapterSource`.
 *
 * Handles all three source types:
 * - `{ type: 'path' }` — resolves and bundles a local file path or remote URL.
 * - `{ type: 'paths' }` — merges multiple file paths into a single document.
 * - `{ type: 'data' }` — parses an inline string (YAML/JSON) or raw object.
 *
 * @example
 * ```ts
 * const document = await parseFromConfig({ type: 'path', path: './openapi.yaml' })
 * const document = await parseFromConfig({ type: 'data', data: '{"openapi":"3.0.0",...}' })
 * ```
 */
export function parseFromConfig(source: AdapterSource): Promise<Document> {
  if (source.type === 'data') {
    if (typeof source.data === 'object') {
      return parseDocument(structuredClone(source.data) as Document)
    }

    try {
      const api: string = yaml.parse(source.data as string)
      return parseDocument(api)
    } catch {
      return parseDocument(source.data as string)
    }
  }

  if (source.type === 'paths') {
    return mergeDocuments(source.paths)
  }

  // type === 'path'
  if (new URLPath(source.path).isURL) {
    return parseDocument(source.path)
  }

  return parseDocument(path.resolve(path.dirname(source.path), source.path))
}

/**
 * Validates an OpenAPI document using `oas-normalize` with colorized error output.
 *
 * @example
 * ```ts
 * await validateDocument(document)
 * ```
 */
export async function validateDocument(document: Document): Promise<void> {
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
}
