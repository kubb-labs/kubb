import { ast, createAdapter } from '@kubb/core'
import type { AdapterSource } from '@kubb/core'
import BaseOas from 'oas'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { assertInputExists, parseDocument, parseFromConfig, validateDocument } from './factory.ts'
import { createSchemaParser } from './parser.ts'
import { getSchemas } from './resolvers.ts'
import { createInputStream, preScan, resolveBaseUrl } from './stream.ts'
import type { AdapterOas, Document } from './types.ts'

/**
 * Canonical adapter name for `@kubb/adapter-oas`. Used for driver lookups.
 */
export const adapterOasName = 'oas' satisfies AdapterOas['name']

/**
 * Default Kubb adapter for OpenAPI 2.0, 3.0, and 3.1 specifications. Reads the
 * file at `input.path`, validates it, resolves the base URL, and converts every
 * schema and operation into the universal AST that every downstream plugin
 * consumes.
 *
 * Configure once on `defineConfig`. The adapter's choices (date representation,
 * integer width, server URL) apply to every plugin in the build.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { adapterOas } from '@kubb/adapter-oas'
 * import { pluginTs } from '@kubb/plugin-ts'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   adapter: adapterOas({
 *     serverIndex: 0,
 *     discriminator: 'inherit',
 *     dateType: 'date',
 *   }),
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
    dedupe = true,
    dateType = DEFAULT_PARSER_OPTIONS.dateType,
    integerType = DEFAULT_PARSER_OPTIONS.integerType,
    unknownType = DEFAULT_PARSER_OPTIONS.unknownType,
    enumSuffix = DEFAULT_PARSER_OPTIONS.enumSuffix,
    emptySchemaType = unknownType || DEFAULT_PARSER_OPTIONS.emptySchemaType,
  } = options

  const parserOptions: ast.ParserOptions = {
    ...DEFAULT_PARSER_OPTIONS,
    dateType,
    integerType,
    unknownType,
    emptySchemaType,
    enumSuffix,
  }

  let nameMapping = new Map<string, string>()
  let parsedDocument: Document | null = null

  // Cache per source and per document so one adapter instance reused across a `defineConfig` array
  // parses each config's spec instead of replaying the first one. Keying the document by its source
  // object still collapses a config's concurrent `stream()` (build) and `parse()` (studio) calls,
  // which share one source object, onto a single parse. The document-derived caches key off the
  // resulting document, so distinct configs (distinct documents) stay isolated.
  const documentCache = new WeakMap<AdapterSource, Promise<Document>>()
  const schemasCache = new WeakMap<Document, Promise<ReturnType<typeof getSchemas>['schemas']>>()
  const baseOasCache = new WeakMap<Document, BaseOas>()
  const schemaParserCache = new WeakMap<Document, ReturnType<typeof createSchemaParser>>()
  const preScanCache = new WeakMap<Document, ReturnType<typeof preScan>>()

  function ensureDocument(source: AdapterSource): Promise<Document> {
    const cached = documentCache.get(source)
    if (cached) return cached

    const promise = (async () => {
      const fresh = await parseFromConfig(source)
      if (validate) await validateDocument(fresh)
      parsedDocument = fresh
      return fresh
    })()
    documentCache.set(source, promise)
    return promise
  }

  function ensureSchemas(document: Document): Promise<ReturnType<typeof getSchemas>['schemas']> {
    const cached = schemasCache.get(document)
    if (cached) return cached

    const promise = Promise.resolve().then(() => {
      const result = getSchemas(document, { contentType })
      nameMapping = result.nameMapping
      return result.schemas
    })
    schemasCache.set(document, promise)
    return promise
  }

  function ensureBaseOas(document: Document): BaseOas {
    const cached = baseOasCache.get(document)
    if (cached) return cached

    const baseOas = new BaseOas(document)
    baseOasCache.set(document, baseOas)
    return baseOas
  }

  function ensureSchemaParser(document: Document): ReturnType<typeof createSchemaParser> {
    const cached = schemaParserCache.get(document)
    if (cached) return cached

    const parser = createSchemaParser({ document, contentType })
    schemaParserCache.set(document, parser)
    return parser
  }

  function ensurePreScan(
    document: Document,
    schemas: ReturnType<typeof getSchemas>['schemas'],
    parseSchema: ReturnType<typeof ensureSchemaParser>['parseSchema'],
    parseOperation: ReturnType<typeof ensureSchemaParser>['parseOperation'],
    baseOas: BaseOas,
  ): ReturnType<typeof preScan> {
    const cached = preScanCache.get(document)
    if (cached) return cached

    const result = preScan({ schemas, parseSchema, parseOperation, baseOas, parserOptions, discriminator, dedupe })
    preScanCache.set(document, result)
    return result
  }

  async function createStream(source: AdapterSource): Promise<ast.InputStreamNode> {
    const document = await ensureDocument(source)
    const schemas = await ensureSchemas(document)
    const { parseSchema, parseOperation } = ensureSchemaParser(document)
    const baseOas = ensureBaseOas(document)
    const { refAliasMap, enumNames, circularNames, discriminatorChildMap, dedupePlan } = ensurePreScan(document, schemas, parseSchema, parseOperation, baseOas)

    return createInputStream({
      schemas,
      parseSchema,
      parseOperation,
      baseOas,
      parserOptions,
      refAliasMap,
      discriminatorChildMap,
      dedupePlan,
      meta: {
        title: document.info?.title,
        description: document.info?.description,
        version: document.info?.version,
        baseURL: resolveBaseUrl({ document, serverIndex, serverVariables }),
        circularNames,
        enumNames,
      },
    })
  }

  return {
    name: adapterOasName,
    get options() {
      return {
        validate,
        contentType,
        serverIndex,
        serverVariables,
        discriminator,
        dedupe,
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
      await assertInputExists(input)
      const document = await parseDocument(input)
      await validateDocument(document, options)
    },
    getImports(node, resolve) {
      return ast.collectImports({
        node,
        nameMapping,
        resolve: (schemaName) => {
          const result = resolve(schemaName)
          if (!result) return null

          return ast.createImport({ name: [result.name], path: result.path })
        },
      })
    },
    async parse(source) {
      const streamNode = await createStream(source)

      const [schemas, operations] = await Promise.all([Array.fromAsync(streamNode.schemas), Array.fromAsync(streamNode.operations)])

      return ast.createInput({ schemas, operations, meta: streamNode.meta })
    },
    stream: createStream,
  }
})
