import { once } from '@internals/utils'
import { ast, createAdapter } from '@kubb/core'
import type { AdapterSource } from '@kubb/core'
import BaseOas from 'oas'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { parseDocument, parseFromConfig, validateDocument } from './factory.ts'
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
    diagnostics: diagnosticsOptions,
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

  // `once` collapses concurrent callers (e.g. a build's `stream()` racing with `openInStudio()`'s `parse()`) onto one in-flight promise.
  const ensureDocument = once(async (source: AdapterSource): Promise<Document> => {
    const fresh = await parseFromConfig(source)
    if (validate) await validateDocument(fresh)
    parsedDocument = fresh
    return fresh
  })

  const ensureSchemas = once(async (document: Document) => {
    const result = getSchemas(document, { contentType })
    nameMapping = result.nameMapping
    return result.schemas
  })

  const ensureBaseOas = once((document: Document) => new BaseOas(document))

  const ensureSchemaParser = once((document: Document) => createSchemaParser({ document, contentType }))

  const ensurePreScan = once(
    (
      schemas: Awaited<ReturnType<typeof ensureSchemas>>,
      parseSchema: ReturnType<typeof ensureSchemaParser>['parseSchema'],
      parseOperation: ReturnType<typeof ensureSchemaParser>['parseOperation'],
      baseOas: ReturnType<typeof ensureBaseOas>,
    ) => preScan({ schemas, parseSchema, parseOperation, baseOas, parserOptions, discriminator, dedupe, diagnostics: diagnosticsOptions }),
  )

  async function createStream(source: AdapterSource): Promise<ast.InputStreamNode> {
    const document = await ensureDocument(source)
    const schemas = await ensureSchemas(document)
    const { parseSchema, parseOperation } = ensureSchemaParser(document)
    const baseOas = ensureBaseOas(document)
    const { refAliasMap, enumNames, circularNames, discriminatorChildMap, dedupePlan } = ensurePreScan(schemas, parseSchema, parseOperation, baseOas)

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

      const collect = async <T>(iter: AsyncIterable<T>): Promise<Array<T>> => {
        const out: Array<T> = []
        for await (const item of iter) out.push(item)
        return out
      }

      const [schemas, operations] = await Promise.all([collect(streamNode.schemas), collect(streamNode.operations)])

      return ast.createInput({ schemas, operations, meta: streamNode.meta })
    },
    stream: createStream,
  }
})
