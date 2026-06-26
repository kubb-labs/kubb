import path from 'node:path'
import { exists } from '@internals/utils'
import { Diagnostics } from '@kubb/core'
import type { AdapterSource } from '@kubb/core'
import { compileErrors, validate } from '@readme/openapi-parser'
import { upgrade } from '@scalar/openapi-upgrader'
import { parse } from 'yaml'
import { bundleDocument } from './bundler.ts'
import type { Document } from './types.ts'

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
 * Throws a coded `KUBB_INPUT_NOT_FOUND` diagnostic when a local input path does not exist.
 * URLs are skipped, and a malformed but readable file is left for `parseDocument` to surface
 * its parse error instead.
 */
export async function assertInputExists(input: string): Promise<void> {
  if (URL.canParse(input)) {
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
 * Validates an OpenAPI document using `@readme/openapi-parser` with colorized error output.
 *
 * @example
 * ```ts
 * await validateDocument(document)
 * ```
 */
export async function validateDocument(document: Document, { throwOnError = false }: { throwOnError?: boolean } = {}): Promise<void> {
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
