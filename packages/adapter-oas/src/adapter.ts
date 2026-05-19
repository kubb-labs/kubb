import { ast, createAdapter } from '@kubb/core'
import type { AdapterSource } from '@kubb/core'
import BaseOas from 'oas'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { applyDiscriminatorInheritance, buildDiscriminatorChildMap, patchDiscriminatorNode } from './discriminator.ts'
import { parseDocument, parseFromConfig, validateDocument } from './factory.ts'
import { createSchemaParser, parseOas } from './parser.ts'
import { getSchemas, resolveServerUrl } from './resolvers.ts'
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
  let schemaObjects: ReturnType<typeof getSchemas>['schemas'] | null = null
  let baseOasInstance: BaseOas | null = null
  let schemaParserInstance: ReturnType<typeof createSchemaParser> | null = null

  function resolveBaseURL(document: Document): string | undefined {
    const server = serverIndex !== undefined ? document.servers?.at(serverIndex) : undefined
    return server?.url ? resolveServerUrl(server, serverVariables) : undefined
  }

  async function ensureDocument(source: AdapterSource): Promise<Document> {
    if (parsedDocument) return parsedDocument
    const fresh = await parseFromConfig(source)
    if (validate) await validateDocument(fresh)
    parsedDocument = fresh
    return fresh
  }

  async function ensureSchemas(document: Document): Promise<ReturnType<typeof getSchemas>['schemas']> {
    if (!schemaObjects) {
      const result = getSchemas(document, { contentType })
      schemaObjects = result.schemas
      nameMapping = result.nameMapping
    }
    return schemaObjects
  }

  function ensureBaseOas(document: Document): BaseOas {
    if (!baseOasInstance) baseOasInstance = new BaseOas(document)
    return baseOasInstance
  }

  function ensureSchemaParser(document: Document): ReturnType<typeof createSchemaParser> {
    if (!schemaParserInstance) schemaParserInstance = createSchemaParser({ document, contentType })
    return schemaParserInstance
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
      const document = await ensureDocument(source)

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

      return ast.createInput({
        ...node,
        meta: {
          title: document.info?.title,
          description: document.info?.description,
          version: document.info?.version,
          baseURL: resolveBaseURL(document),
        },
      })
    },
    async count(source) {
      const document = await ensureDocument(source)
      const schemas = await ensureSchemas(document)

      const baseOas = ensureBaseOas(document)
      const operationCount = Object.values(baseOas.getPaths()).flatMap(Object.values).filter(Boolean).length

      return { schemas: Object.keys(schemas).length, operations: operationCount }
    },
    async stream(source) {
      const document = await ensureDocument(source)
      const schemas = await ensureSchemas(document)

      let discriminatorChildMap: Awaited<ReturnType<typeof buildDiscriminatorChildMap>> | null = null
      if (discriminator === 'inherit') {
        const { parseSchema: _preParser } = ensureSchemaParser(document)
        const parentNodes: ast.SchemaNode[] = []
        for (const [name, schema] of Object.entries(schemas)) {
          if ((schema.oneOf ?? schema.anyOf) && schema.discriminator?.propertyName) {
            parentNodes.push(_preParser({ schema, name }, parserOptions))
          }
        }
        if (parentNodes.length > 0) {
          discriminatorChildMap = buildDiscriminatorChildMap(parentNodes)
        }
      }

      // Each [Symbol.asyncIterator]() call returns a fresh generator so multiple
      // plugins can do independent `for await` passes without shared state.
      // The underlying parser and BaseOas instance are cached at adapter scope.
      const schemasIterable: AsyncIterable<ast.SchemaNode> = {
        [Symbol.asyncIterator]() {
          return (async function* () {
            const { parseSchema: _parseSchema } = ensureSchemaParser(document)
            for (const [name, schema] of Object.entries(schemas)) {
              let node = _parseSchema({ schema, name }, parserOptions)
              const entry = discriminatorChildMap?.get(name)
              if (entry) node = patchDiscriminatorNode(node, entry)
              yield node
            }
          })()
        },
      }

      const operationsIterable: AsyncIterable<ast.OperationNode> = {
        [Symbol.asyncIterator]() {
          return (async function* () {
            const { parseOperation: _parseOperation } = ensureSchemaParser(document)
            const baseOas = ensureBaseOas(document)
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
        baseURL: resolveBaseURL(document),
      })
    },
  }
})
