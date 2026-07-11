import { ast, findCircularSchemas, narrowSchema, transform } from '@kubb/ast'
import { createAdapter } from '@kubb/core'
import type { AdapterSource } from '@kubb/core'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { buildDiscriminatorChildMap, patchDiscriminatorNode } from './discriminator.ts'
import type { DiscriminatorTarget } from './discriminator.ts'
import { assertInputExists, parseDocument, parseFromConfig, validateDocument } from './factory.ts'
import { getOperations } from './operation.ts'
import { createSchemaParser } from './parser.ts'
import { collectInlineEnums, refPromotedEnums } from './promoteEnums.ts'
import { getSchemas, resolveBaseUrl } from './resolvers.ts'
import { reportSchemaDiagnostics } from './schemaDiagnostics.ts'
import type { AdapterOas, Document, SchemaObject } from './types.ts'

/**
 * The `name` of `@kubb/adapter-oas`, used to identify this adapter in a Kubb config.
 */
export const adapterOasName = 'oas' satisfies AdapterOas['name']

/**
 * Default Kubb adapter for OpenAPI 2.0, 3.0, and 3.1 specifications. Reads the
 * spec from `input` (a file path, URL, inline content, or parsed object), validates
 * it, resolves the base URL, and converts every schema and operation into the
 * universal AST that every downstream plugin consumes.
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
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   adapter: adapterOas({
 *     server: { index: 0 },
 *     discriminator: 'propagate',
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
    server,
    discriminator = 'preserve',
    enums = 'inline',
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

  let parsedDocument: Document | null = null

  // Cache per source and per document so one adapter instance reused across a `defineConfig` array
  // parses each config's spec instead of replaying the first one. The document-derived caches key
  // off the resulting document, so distinct configs (distinct documents) stay isolated.
  const documentCache = new WeakMap<AdapterSource, Promise<Document>>()
  const schemasCache = new WeakMap<Document, ReturnType<typeof getSchemas>>()
  const schemaParserCache = new WeakMap<Document, ReturnType<typeof createSchemaParser>>()

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

  function ensureSchemas(document: Document): ReturnType<typeof getSchemas> {
    const cached = schemasCache.get(document)
    if (cached) return cached

    const result = getSchemas(document, { contentType })
    schemasCache.set(document, result)
    return result
  }

  function ensureSchemaParser(document: Document): ReturnType<typeof createSchemaParser> {
    const cached = schemaParserCache.get(document)
    if (cached) return cached

    const parser = createSchemaParser({ document, contentType })
    schemaParserCache.set(document, parser)
    return parser
  }

  // Parses every schema and operation once. Ref aliases and discriminator children are
  // resolved from the schemas already parsed in this same pass rather than re-parsed.
  function parseInput({
    document,
    schemas,
    renames,
    parser,
  }: {
    document: Document
    schemas: Record<string, SchemaObject>
    renames: Map<string, string>
    parser: ReturnType<typeof ensureSchemaParser>
  }): ast.InputNode {
    const { parseSchema, parseOperation } = parser

    // Refs whose target was collision-renamed carry the emitted name on the node itself
    // (`targetName`), so `resolveRefName` works without a side-channel map. Stamped before
    // circular-ref detection, so the schema graph also sees the corrected edges.
    const stampTargetNames = <T extends ast.SchemaNode | ast.OperationNode>(node: T): T => {
      if (renames.size === 0) return node
      return transform(node, {
        schema(child) {
          const refNode = narrowSchema(child, 'ref')
          if (!refNode?.ref) return undefined
          const targetName = renames.get(refNode.ref)
          return targetName ? { ...refNode, targetName } : undefined
        },
      }) as T
    }

    const parsedByName = new Map<string, ast.SchemaNode>()
    const refAliasMap = new Map<string, ast.SchemaNode>()
    const enumNames: Array<string> = []
    const discriminatorParentNodes: Array<ast.SchemaNode> = []

    for (const [name, schema] of Object.entries(schemas)) {
      const node = stampTargetNames(parseSchema({ schema, name }, parserOptions))
      parsedByName.set(name, node)
      reportSchemaDiagnostics({ node, name })
      if (node.type === 'ref' && node.name && node.name !== name) {
        refAliasMap.set(name, node)
      }
      if (narrowSchema(node, 'enum') && node.name) {
        enumNames.push(node.name)
      }
      if (discriminator === 'propagate' && (schema.oneOf ?? schema.anyOf) && schema.discriminator?.propertyName) {
        discriminatorParentNodes.push(node)
      }
    }

    const circularNames = [...findCircularSchemas([...parsedByName.values()])]
    const discriminatorChildMap: Map<string, DiscriminatorTarget> | null =
      discriminatorParentNodes.length > 0 ? buildDiscriminatorChildMap(discriminatorParentNodes) : null

    const operationNodes: Array<ast.OperationNode> = []
    for (const operation of getOperations(document)) {
      const operationNode = parseOperation(parserOptions, operation)
      if (operationNode) operationNodes.push(stampTargetNames(operationNode))
    }

    let promotedEnums: Map<string, ast.SchemaNode> | null = null
    if (enums === 'root') {
      promotedEnums = collectInlineEnums([...parsedByName.values(), ...operationNodes], new Set(Object.keys(schemas)))
      for (const name of promotedEnums.keys()) enumNames.push(name)
    }

    const schemaNodes: Array<ast.SchemaNode> = promotedEnums ? [...promotedEnums.values()] : []
    for (const name of Object.keys(schemas)) {
      const alias = refAliasMap.get(name)

      let node: ast.SchemaNode
      if (alias?.name && parsedByName.has(alias.name)) {
        node = { ...parsedByName.get(alias.name)!, name }
      } else {
        const parsed = parsedByName.get(name)!
        const child = discriminatorChildMap?.get(name)
        node = child ? patchDiscriminatorNode(parsed, child) : parsed
      }

      schemaNodes.push(promotedEnums ? refPromotedEnums(node, promotedEnums) : node)
    }

    const operations = promotedEnums ? operationNodes.map((node) => refPromotedEnums(node, promotedEnums!)) : operationNodes

    return ast.factory.createInput({
      schemas: schemaNodes,
      operations,
      meta: {
        title: document.info?.title,
        description: document.info?.description,
        version: document.info?.version,
        baseURL: resolveBaseUrl({ document, server }),
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
        server,
        discriminator,
        enums,
        dateType,
        integerType,
        unknownType,
        emptySchemaType,
        enumSuffix,
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
    async parse(source) {
      const document = await ensureDocument(source)
      const { schemas, renames } = ensureSchemas(document)
      const parser = ensureSchemaParser(document)

      return parseInput({ document, schemas, renames, parser })
    },
  }
})
