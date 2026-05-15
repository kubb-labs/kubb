import { createHash } from 'node:crypto'
import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ast, createAdapter } from '@kubb/core'
import type { AdapterSource, Storage } from '@kubb/core'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { applyDiscriminatorInheritance } from './discriminator.ts'
import { parseDocument, parseFromConfig, validateDocument } from './factory.ts'
import { parseOas } from './parser.ts'
import { resolveServerUrl } from './resolvers.ts'
import type { AdapterOas, Document } from './types.ts'

type DocumentCacheEntry = {
  document: unknown
  nameMappingEntries: Array<[string, string]>
  mtime?: number
}

function sourceCacheKey(source: AdapterSource): string {
  const content = source.type === 'path' ? source.path : JSON.stringify(source.type === 'data' ? source.data : source)
  const hash = createHash('sha256').update(content).digest('hex')
  return resolve(process.cwd(), '.kubb', '.cache', `${hash}.json`)
}

async function readDocumentCache(source: AdapterSource, storage: Storage): Promise<{ document: Document; nameMapping: Map<string, string> } | null> {
  const raw = await storage.getItem(sourceCacheKey(source))
  if (!raw) return null

  try {
    const entry = JSON.parse(raw) as DocumentCacheEntry

    if (source.type === 'path' && entry.mtime !== undefined) {
      const fileStat = await stat(source.path).catch(() => null)
      if (!fileStat || fileStat.mtimeMs !== entry.mtime) return null
    }

    return {
      document: entry.document as Document,
      nameMapping: new Map(entry.nameMappingEntries),
    }
  } catch {
    return null
  }
}

async function writeDocumentCache(source: AdapterSource, storage: Storage, document: Document, nameMapping: Map<string, string>): Promise<void> {
  let mtime: number | undefined
  if (source.type === 'path') {
    const fileStat = await stat(source.path).catch(() => null)
    mtime = fileStat?.mtimeMs
  }

  const entry: DocumentCacheEntry = {
    document,
    nameMappingEntries: [...nameMapping.entries()],
    mtime,
  }

  await storage.setItem(sourceCacheKey(source), JSON.stringify(entry))
}

/**
 * Stable string identifier for the OAS adapter used in Kubb's adapter registry.
 */
export const adapterOasName = 'oas' satisfies AdapterOas['name']

/**
 * Creates the default OpenAPI / Swagger adapter for Kubb.
 *
 * Parses the spec, optionally validates it, resolves the base URL, and converts
 * everything into an `InputNode` that downstream plugins consume.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { adapterOas } from '@kubb/adapter-oas'
 * import { pluginTs } from '@kubb/plugin-ts'
 *
 * export default defineConfig({
 *   adapter: adapterOas({ dateType: 'date', serverIndex: 0 }),
 *   input: { path: './openapi.yaml' },
 *   plugins: [pluginTs()],
 * })
 * ```
 */
export const adapterOas = createAdapter<AdapterOas>((options) => {
  const {
    validate = true,
    contentType,
    serverIndex,
    serverVariables,
    discriminator = 'strict',
    dateType = DEFAULT_PARSER_OPTIONS.dateType,
    integerType = DEFAULT_PARSER_OPTIONS.integerType,
    unknownType = DEFAULT_PARSER_OPTIONS.unknownType,
    enumSuffix = DEFAULT_PARSER_OPTIONS.enumSuffix,
    emptySchemaType = unknownType || DEFAULT_PARSER_OPTIONS.emptySchemaType,
  } = options

  let nameMapping = new Map<string, string>()
  let parsedDocument: Document | null

  return {
    name: adapterOasName,
    get options() {
      return {
        validate,
        contentType,
        serverIndex,
        serverVariables,
        discriminator,
        dateType,
        integerType,
        unknownType,
        emptySchemaType,
        enumSuffix,
        nameMapping,
      }
    },
    get document() {
      return parsedDocument
    },
    async validate(input, options) {
      const document = await parseDocument(input)
      await validateDocument(document, options)
    },
    getImports(node, resolve) {
      return ast.collectImports({
        node,
        nameMapping,
        resolve: (schemaName) => {
          const result = resolve(schemaName)
          if (!result) return

          return ast.createImport({ name: [result.name], path: result.path })
        },
      })
    },
    async parse(source, storage) {
      let document: Document
      let fromCache = false

      if (parsedDocument) {
        document = parsedDocument
        fromCache = true
      } else {
        const cached = storage ? await readDocumentCache(source, storage) : null
        if (cached) {
          document = cached.document
          nameMapping = cached.nameMapping
          fromCache = true
        } else {
          document = await parseFromConfig(source)
          if (validate) await validateDocument(document)
        }
        parsedDocument = document
      }

      const server = serverIndex !== undefined ? document.servers?.at(serverIndex) : undefined
      const baseURL = server?.url ? resolveServerUrl(server, serverVariables) : undefined

      const { root: parsedRoot, nameMapping: parsedNameMapping } = parseOas(document, {
        contentType,
        dateType,
        integerType,
        unknownType,
        emptySchemaType,
        enumSuffix,
      })

      const node = discriminator === 'inherit' ? applyDiscriminatorInheritance(parsedRoot) : parsedRoot

      // This must happen after parseOas() because legacy enum remapping is finalized there.
      nameMapping = parsedNameMapping
      // Expose the raw document so consumers (e.g. plugin-redoc) can access it.
      parsedDocument = document

      if (!fromCache && storage) {
        await writeDocumentCache(source, storage, document, nameMapping)
      }

      const inputNode = ast.createInput({
        ...node,
        meta: {
          title: document.info?.title,
          description: document.info?.description,
          version: document.info?.version,
          baseURL,
        },
      })

      return inputNode
    },
  }
})
