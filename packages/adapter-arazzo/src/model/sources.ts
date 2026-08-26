import path from 'node:path'
import type { Document, Operation } from '@kubb/adapter-oas'
import { createRefs, createSchemaParser, getOperationId, getOperations, getSchemas, parseDocument } from '@kubb/adapter-oas/internal'
import type { Refs } from '@kubb/adapter-oas/internal'
import { Diagnostics } from '@kubb/core'
import type { ArazzoDocument, SourceDescriptionObject } from '../types.ts'

/**
 * One `sourceDescriptions` entry after its document has been loaded: the parsed OpenAPI document,
 * the `$ref` service and schema parser bound to it, and its operations indexed by `operationId`.
 */
export type LoadedSource = {
  name: string
  url: string
  document: Document
  refs: Refs
  parser: ReturnType<typeof createSchemaParser>
  operations: Map<string, Operation>
}

/**
 * Resolves a `sourceDescriptions` URL against the location of the Arazzo document.
 *
 * An absolute URL is used as written. A relative one needs a base: with `{ type: 'data' }` input
 * there is no file the document came from, so a relative URL cannot be resolved and returns `null`.
 */
function resolveSourceUrl({ url, basePath }: { url: string; basePath: string | null }): string | null {
  if (URL.canParse(url)) {
    return url
  }

  if (!basePath) {
    return null
  }

  if (URL.canParse(basePath)) {
    return new URL(url, basePath).href
  }

  return path.resolve(path.dirname(basePath), url)
}

/**
 * Reports a source description that could not be used and returns `null`, so one bad entry
 * degrades the steps that need it rather than failing the whole build.
 */
function skipSource({ index, message, help }: { index: number; message: string; help: string }): null {
  const diagnostic = {
    code: Diagnostics.code.invalidDocument,
    severity: 'error',
    message,
    help,
    location: { kind: 'document', pointer: `#/sourceDescriptions/${index}` },
  } as const

  if (!Diagnostics.report(diagnostic)) {
    throw new Diagnostics.Error(diagnostic)
  }

  return null
}

/**
 * Loads one source description into the parsing context its operations need.
 */
async function loadSource({
  source,
  index,
  basePath,
  contentType,
}: {
  source: SourceDescriptionObject
  index: number
  basePath: string | null
  contentType?: string
}): Promise<LoadedSource | null> {
  if (source.type && source.type !== 'openapi') {
    return skipSource({
      index,
      message: `\`sourceDescriptions\` entry \`${source.name}\` has type \`${source.type}\`, which this adapter cannot read yet.`,
      help: 'Only `openapi` source descriptions are supported. Remove the entry, or point it at an OpenAPI document.',
    })
  }

  const url = resolveSourceUrl({ url: source.url, basePath })
  if (!url) {
    return skipSource({
      index,
      message: `\`sourceDescriptions\` entry \`${source.name}\` has the relative URL \`${source.url}\`, which has nothing to resolve against.`,
      help: "Set `input` to the Arazzo document's path instead of passing it as inline data, or make the URL absolute.",
    })
  }

  const document = await parseDocument(url)
  const refs = createRefs(document)
  const { renames } = getSchemas(document, { contentType }, refs)
  const parser = createSchemaParser({ document, refs, contentType, renames })

  const operations = new Map<string, Operation>()
  for (const operation of getOperations(document, refs)) {
    operations.set(getOperationId(operation), operation)
  }

  return { name: source.name, url, document, refs, parser, operations }
}

/**
 * Loads every `sourceDescriptions` entry, keyed by its `name`.
 *
 * Each document is loaded through `@kubb/adapter-oas`, so a step's target operation is parsed by
 * exactly the same code the OpenAPI adapter runs. Entries that cannot be loaded are reported and
 * left out of the map, and the steps pointing at them resolve to nothing.
 *
 * @example
 * ```ts
 * const sources = await loadSources({ document, basePath: '/abs/workflows.yaml' })
 * sources.get('petStore')?.operations.get('loginUser')
 * ```
 */
export async function loadSources({
  document,
  basePath,
  contentType,
}: {
  document: ArazzoDocument
  basePath: string | null
  contentType?: string
}): Promise<Map<string, LoadedSource>> {
  const entries = await Promise.all((document.sourceDescriptions ?? []).map((source, index) => loadSource({ source, index, basePath, contentType })))

  const sources = new Map<string, LoadedSource>()
  for (const entry of entries) {
    if (entry) sources.set(entry.name, entry)
  }

  return sources
}
