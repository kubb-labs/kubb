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

  const ensurePreScan = once((schemas: Awaited<ReturnType<typeof ensureSchemas>>, parseSchema: ReturnType<typeof ensureSchemaParser>['parseSchema']) =>
    preScan({ schemas, parseSchema, parserOptions, discriminator }),
  )

  async function createStream(source: AdapterSource): Promise<ast.InputStreamNode> {
    const document = await ensureDocument(source)
    const schemas = await ensureSchemas(document)
    const { parseSchema, parseOperation } = ensureSchemaParser(document)
    const { refAliasMap, enumNames, circularNames, discriminatorChildMap } = ensurePreScan(schemas, parseSchema)

    return createInputStream({
      schemas,
      parseSchema,
      parseOperation,
      baseOas: ensureBaseOas(document),
      parserOptions,
      refAliasMap,
      discriminatorChildMap,
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
    async parse(source) {
      const streamNode = await createStream(source)

      const collect = async <T>(iter: AsyncIterable<T>): Promise<T[]> => {
        const out: T[] = []
        for await (const item of iter) out.push(item)
        return out
      }

      const [schemas, operations] = await Promise.all([collect(streamNode.schemas), collect(streamNode.operations)])

      return ast.createInput({ schemas, operations, meta: streamNode.meta })
    },
    stream: createStream,
  }
})
