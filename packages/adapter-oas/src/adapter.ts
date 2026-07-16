import { ast, findCircularSchemas, narrowSchema } from '@kubb/ast'
import { createAdapter } from '@kubb/core'
import type { AdapterSource } from '@kubb/core'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { buildDiscriminatorChildMap, patchDiscriminatorNode } from './emit/discriminator/propagate.ts'
import type { DiscriminatorTarget } from './emit/discriminator/propagate.ts'
import { assertInputExists } from './load/source.ts'
import { parseDocument, parseFromConfig, validateDocument } from './load/normalize.ts'
import { getSchemas } from './model/components.ts'
import { resolveBaseUrl } from './model/server.ts'
import { getOperations } from './operation.ts'
import { createSchemaParser } from './parser.ts'
import { collectInlineEnums, refPromotedEnums } from './promoteEnums.ts'
import { createRefs } from './refs.ts'
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

  // One cache per source: reusing one adapter instance across a `defineConfig` array must parse
  // each config's spec instead of replaying the first one, and a repeat `.parse()` call for the
  // same source must not redo the work. The `$ref` memo lives inside the `Refs` instance created
  // fresh for each document, scoped to this one pass.
  const inputCache = new WeakMap<AdapterSource, Promise<ast.InputNode>>()

  // Parses every schema and operation once. Ref aliases and discriminator children are
  // resolved from the schemas already parsed in this same pass rather than re-parsed.
  function parseInput({
    document,
    refs,
    schemas,
    parser,
  }: {
    document: Document
    refs: ReturnType<typeof createRefs>
    schemas: Record<string, SchemaObject>
    parser: ReturnType<typeof createSchemaParser>
  }): ast.InputNode {
    const { parseSchema, parseOperation } = parser

    const parsedByName = new Map<string, ast.SchemaNode>()
    const refAliasMap = new Map<string, ast.SchemaNode>()
    const enumNames: Array<string> = []
    const discriminatorParentNodes: Array<ast.SchemaNode> = []

    for (const [name, schema] of Object.entries(schemas)) {
      const node = parseSchema({ schema, name }, parserOptions)
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
    for (const operation of getOperations(document, refs)) {
      const operationNode = parseOperation(parserOptions, operation)
      if (operationNode) operationNodes.push(operationNode)
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
      const cached = inputCache.get(source)
      if (cached) return cached

      const promise = (async () => {
        const document = await parseFromConfig(source)
        if (validate) await validateDocument(document)
        parsedDocument = document

        const refs = createRefs(document)
        const { schemas, renames } = getSchemas(document, { contentType }, refs)
        const parser = createSchemaParser({ document, refs, contentType, renames })

        return parseInput({ document, refs, schemas, parser })
      })()
      inputCache.set(source, promise)
      return promise
    },
  }
})
