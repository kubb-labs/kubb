import { DEFAULT_PARSER_OPTIONS, scanSchema } from '@kubb/adapter-oas/internal'
import { ast, findCircularSchemasFromGraph, narrowSchema } from '@kubb/ast'
import { createAdapter } from '@kubb/core'
import type { AdapterSource } from '@kubb/core'
import { assertDocument, parseFromConfig, validateDocument } from './load/normalize.ts'
import { loadSources } from './model/sources.ts'
import { createWorkflowParser } from './parser.ts'
import type { AdapterArazzo, ArazzoDocument } from './types.ts'

/**
 * The `name` of `@kubb/adapter-arazzo`, used to identify this adapter in a Kubb config.
 */
export const adapterArazzoName = 'arazzo' satisfies AdapterArazzo['name']

/**
 * Kubb adapter for the [Arazzo Specification](https://spec.openapis.org/arazzo/latest.html), the
 * OpenAPI workflow format. Reads the workflow document from `input`, loads every OpenAPI document
 * listed in `sourceDescriptions`, and converts each workflow into the universal AST.
 *
 * One workflow becomes one operation with `protocol: 'arazzo'`: its `inputs` schema is the request
 * body, its resolved `outputs` are the response, and its steps ride along on the node for plugins
 * that emit a runner. Runtime expressions are kept as written, since only whatever executes the
 * workflow can evaluate them.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { adapterArazzo } from '@kubb/adapter-arazzo'
 * import { pluginTs } from '@kubb/plugin-ts'
 *
 * export default defineConfig({
 *   input: './workflows.arazzo.yaml',
 *   output: { path: './src/gen' },
 *   adapter: adapterArazzo(),
 *   plugins: [pluginTs()],
 * })
 * ```
 */
export const adapterArazzo = createAdapter<AdapterArazzo>((options) => {
  const {
    validate = true,
    contentType,
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

  let parsedDocument: ArazzoDocument | null = null

  // One cache per source, matching `@kubb/adapter-oas`: reusing one adapter instance across a
  // `defineConfig` array must parse each config's document, and a repeat `.parse()` for the same
  // source must not reload every source description again.
  const inputCache = new WeakMap<AdapterSource, Promise<ast.InputNode>>()

  return {
    name: adapterArazzoName,
    get options() {
      return { validate, contentType, dateType, integerType, unknownType, emptySchemaType, enumSuffix }
    },
    get document() {
      return parsedDocument
    },
    async validate(input, options) {
      const document = await parseFromConfig({ type: 'path', path: input })
      assertDocument(document)
      validateDocument(document, options)
    },
    async parse(source) {
      const cached = inputCache.get(source)
      if (cached) return cached

      const promise = (async () => {
        const document = await parseFromConfig(source)
        assertDocument(document)
        if (validate) validateDocument(document)
        parsedDocument = document

        const sources = await loadSources({
          document,
          basePath: source.type === 'path' ? source.path : null,
          contentType,
        })

        const parser = createWorkflowParser({ document, sources, options: parserOptions })

        const schemas = parser.parseComponentInputs()
        const operations: Array<ast.OperationNode> = []

        for (const [index, workflow] of (document.workflows ?? []).entries()) {
          const parsed = parser.parseWorkflow({ workflow, index })
          schemas.push(...parsed.schemas)
          operations.push(parsed.operation)
        }

        const refGraph = new Map<string, Set<string>>()
        const enumNames: Array<string> = []
        for (const node of schemas) {
          if (!node.name) continue
          refGraph.set(node.name, scanSchema({ node, name: node.name }))
          if (narrowSchema(node, 'enum')) enumNames.push(node.name)
        }

        return ast.factory.createInput({
          schemas,
          operations,
          meta: {
            title: document.info?.title,
            description: document.info?.description ?? document.info?.summary,
            version: document.info?.version,
            circularNames: [...findCircularSchemasFromGraph(refGraph)],
            enumNames,
          },
        })
      })()

      inputCache.set(source, promise)
      return promise
    },
  }
})
