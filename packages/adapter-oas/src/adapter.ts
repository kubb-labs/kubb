import { createHash } from 'node:crypto'
import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ast, createAdapter } from '@kubb/core'
import type { AdapterSource } from '@kubb/core'
import BaseOas from 'oas'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { applyDiscriminatorInheritance } from './discriminator.ts'
import { parseDocument, parseFromConfig, validateDocument } from './factory.ts'
import { createSchemaParser, parseOas } from './parser.ts'
import { getSchemas, resolveServerUrl } from './resolvers.ts'
import type { AdapterOas, Document } from './types.ts'

type DocumentCacheEntry = {
  document: unknown
  nameMappingEntries: Array<[string, string]>
  /** File mtime in milliseconds — used to invalidate `type: 'path'` sources. */
  mtime?: number
}

function sourceCacheFilename(source: AdapterSource): string {
  const content = source.type === 'path' ? source.path : JSON.stringify(source.type === 'data' ? source.data : source)
  return `${createHash('sha256').update(content).digest('hex')}.json`
}

async function readDocumentCache(source: AdapterSource): Promise<{ document: Document; nameMapping: Map<string, string> } | null> {
  if (!source.cache) return null

  const key = resolve(source.cache.dir, sourceCacheFilename(source))
  const raw = await source.cache.storage.getItem(key)
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

async function writeDocumentCache(source: AdapterSource, document: Document, nameMapping: Map<string, string>): Promise<void> {
  if (!source.cache) return

  const key = resolve(source.cache.dir, sourceCacheFilename(source))
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

  await source.cache.storage.setItem(key, JSON.stringify(entry))
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

  // Let-binding so parse() can replace it with a simple reassignment (no clear+loop).
  let nameMapping = new Map<string, string>()
  let parsedDocument: Document | null
  let inputNode: ast.InputNode | null

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
    get inputNode() {
      return inputNode
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
    async parse(source) {
      let document: Document
      let fromCache = false

      if (parsedDocument) {
        document = parsedDocument
        fromCache = true
      } else {
        const cached = await readDocumentCache(source)
        if (cached) {
          document = cached.document
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

      if (!fromCache) {
        await writeDocumentCache(source, document, nameMapping)
      }

      inputNode = ast.createInput({
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
    async count(source) {
      if (!parsedDocument) {
        const cached = await readDocumentCache(source)
        if (cached) {
          parsedDocument = cached.document
          nameMapping = cached.nameMapping
        } else {
          parsedDocument = await parseFromConfig(source)
          if (validate) await validateDocument(parsedDocument)
          const { nameMapping: freshNameMapping } = getSchemas(parsedDocument, { contentType })
          nameMapping = freshNameMapping
          await writeDocumentCache(source, parsedDocument, nameMapping)
        }
      }

      const { schemas: schemaObjects } = getSchemas(parsedDocument, { contentType })
      const baseOas = new BaseOas(parsedDocument)
      const paths = baseOas.getPaths()
      const operationCount = Object.values(paths).flatMap(Object.values).filter(Boolean).length

      return { schemas: Object.keys(schemaObjects).length, operations: operationCount }
    },
    async stream(source) {
      let fromCache = true

      if (!parsedDocument) {
        const cached = await readDocumentCache(source)
        if (cached) {
          parsedDocument = cached.document
          nameMapping = cached.nameMapping
        } else {
          parsedDocument = await parseFromConfig(source)
          if (validate) await validateDocument(parsedDocument)
          fromCache = false
        }
      }

      const document = parsedDocument
      const server = serverIndex !== undefined ? document.servers?.at(serverIndex) : undefined
      const baseURL = server?.url ? resolveServerUrl(server, serverVariables) : undefined

      const { schemas: schemaObjects, nameMapping: parsedNameMapping } = getSchemas(document, { contentType })
      nameMapping = parsedNameMapping

      if (!fromCache) {
        await writeDocumentCache(source, document, nameMapping)
      }

      const parserOptions: ast.ParserOptions = {
        ...DEFAULT_PARSER_OPTIONS,
        dateType,
        integerType,
        unknownType,
        emptySchemaType,
        enumSuffix,
      }

      // Each [Symbol.asyncIterator]() call returns a fresh generator so multiple
      // plugins can do independent `for await` passes without shared state.
      const schemasIterable: AsyncIterable<ast.SchemaNode> = {
        [Symbol.asyncIterator]() {
          return (async function* () {
            const { parseSchema: _parseSchema } = createSchemaParser({ document, contentType })

            if (discriminator === 'inherit') {
              // applyDiscriminatorInheritance requires all schemas upfront — buffer then yield one-by-one.
              const all = Object.entries(schemaObjects).map(([name, schema]) => _parseSchema({ schema, name }, parserOptions))
              const inherited = applyDiscriminatorInheritance(ast.createInput({ schemas: all, operations: [] }))
              for (const node of inherited.schemas) yield node
            } else {
              for (const [name, schema] of Object.entries(schemaObjects)) {
                yield _parseSchema({ schema, name }, parserOptions)
              }
            }
          })()
        },
      }

      const operationsIterable: AsyncIterable<ast.OperationNode> = {
        [Symbol.asyncIterator]() {
          return (async function* () {
            const { parseOperation: _parseOperation } = createSchemaParser({ document, contentType })
            const baseOas = new BaseOas(document)
            const paths = baseOas.getPaths()

            for (const methods of Object.values(paths)) {
              for (const operation of Object.values(methods)) {
                if (!operation) continue
                const node = _parseOperation(parserOptions, operation)
                if (node) yield node
              }
            }
          })()
        },
      }

      return ast.createStreamInput(schemasIterable, operationsIterable, {
        title: document.info?.title,
        description: document.info?.description,
        version: document.info?.version,
        baseURL,
      })
    },
  }
})
