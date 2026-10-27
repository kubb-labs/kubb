import { defineExtension } from '@kubb/core'
import { ast, Diagnostics } from '@kubb/kit'
import type { AdapterSource } from '@kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { buildDiscriminatorChildMap, patchDiscriminatorNode } from './emit/discriminator/propagate.ts'
import type { DiscriminatorTarget } from './emit/discriminator/propagate.ts'
import { assertDocument, parseFromConfig, validateDocument, validateDocumentInWorker } from './load/normalize.ts'
import { getSchemas } from './model/components.ts'
import { resolveBaseUrl, resolveServerUrl } from './model/server.ts'
import { pickExtensions } from './oas.ts'
import { getOperations, parseOperation } from './operation.ts'
import { createSchemaParser } from './parser.ts'
import { collectInlineEnums, refPromotedEnums } from './promoteEnums.ts'
import { createRefs } from './refs.ts'
import { scanSchema } from './schemaDiagnostics.ts'
import { locate } from './sourceLocator.ts'
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
export const adapterOas = defineExtension<AdapterOas>({
  kind: 'adapter',
  meta: { name: adapterOasName, version, compatibility, issues: 'https://github.com/kubb-labs/kubb/issues' },
  setup: ({
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
  }) => ({ validate, contentType, server, discriminator, enums, dateType, integerType, unknownType, emptySchemaType, enumSuffix }),
  build({ validate, contentType, server, discriminator, enums, ...parserOptions }) {
    let parsedDocument: Document | null = null
    let sources: Array<string> = []
    const pendingValidations: Array<Promise<void>> = []

    // One cache per source: reusing one adapter instance across a `defineConfig` array must parse
    // each config's spec instead of replaying the first one, and a repeat `.parse()` call for the
    // same source must not redo the work. The `$ref` memo lives inside the `Refs` instance created
    // fresh for each document, scoped to this one pass.
    const inputCache = new WeakMap<AdapterSource, { promise: Promise<ast.InputNode>; sources: Array<string> }>()

    /**
     * Parses every schema and operation once, resolving ref aliases and discriminator children from that same pass.
     */
    function parseInput({
      document,
      refs,
      schemas,
      pointers,
      parseSchema,
    }: {
      document: Document
      refs: ReturnType<typeof createRefs>
      schemas: Record<string, SchemaObject>
      pointers: Map<string, string>
      parseSchema: ReturnType<typeof createSchemaParser>
    }): ast.InputNode {
      const parsedByName = new Map<string, ast.SchemaNode>()
      const refAliasMap = new Map<string, ast.RefSchemaNode>()
      const enumNames: Array<string> = []
      const discriminatorParentNodes: Array<ast.SchemaNode> = []

      for (const [name, schema] of Object.entries(schemas)) {
        const node = { ...parseSchema({ schema, name }), pointer: pointers.get(name) }
        parsedByName.set(name, node)
        scanSchema(node)
        if (node.type === 'ref' && node.name) {
          refAliasMap.set(name, node)
        }
        if (ast.narrowSchema(node, 'enum') && node.name) {
          enumNames.push(node.name)
        }
        if (discriminator === 'propagate' && (schema.oneOf ?? schema.anyOf) && schema.discriminator?.propertyName) {
          discriminatorParentNodes.push(node)
        }
      }

      const circularNames = [...ast.findCircularSchemas([...parsedByName.values()])]
      const discriminatorChildMap: Map<string, DiscriminatorTarget> | null =
        discriminatorParentNodes.length > 0 ? buildDiscriminatorChildMap(discriminatorParentNodes) : null

      const operationNodes = getOperations(document, refs).map((operation) =>
        parseOperation({ operation, refs, contentType, options: parserOptions, parseSchema }),
      )

      const promotedEnums = enums === 'root' ? collectInlineEnums([...parsedByName.values(), ...operationNodes], new Set(Object.keys(schemas))) : null
      if (promotedEnums) {
        for (const name of promotedEnums.keys()) enumNames.push(name)
      }

      // A collapsed single-member `allOf` is named after the wrapper, so the target comes from `ref`.
      const aliasTargetOf = (name: string) => {
        const node = refAliasMap.get(name)
        return node?.ref ? ast.refName(node.ref) : node?.name
      }

      // A chain of pure aliases that leads back to `name` has no target to print, so it becomes `unknown`.
      function isAliasCycle(name: string): boolean {
        const seen = new Set([name])
        for (let next = aliasTargetOf(name); next; next = aliasTargetOf(next)) {
          if (next === name) return true
          if (seen.has(next)) return false
          seen.add(next)
        }
        return false
      }

      function createCycleNode(name: string, pointer: string | undefined): ast.SchemaNode {
        Diagnostics.report({
          code: Diagnostics.code.aliasCycle,
          severity: 'warning',
          message: `${name} only refers to other schemas that lead back to it, so it is resolved to unknown.`,
          help: 'Give one of the schemas in the loop a real definition, or remove the `$ref` that closes it.',
          location: { kind: 'schema', pointer: pointer ?? `#/components/schemas/${name}` },
        })

        return ast.factory.createSchema({ type: 'unknown', name, pointer })
      }

      const schemaNodes: Array<ast.SchemaNode> = promotedEnums ? [...promotedEnums.values()] : []
      for (const name of Object.keys(schemas)) {
        const aliasTarget = refAliasMap.get(name)?.name
        const aliased = aliasTarget ? parsedByName.get(aliasTarget) : undefined
        const parsed = parsedByName.get(name)!
        const child = discriminatorChildMap?.get(name)
        const base = child ? patchDiscriminatorNode(parsed, child) : parsed
        const resolved = aliased ? { ...aliased, name, pointer: parsed.pointer } : base
        const node = isAliasCycle(name) ? createCycleNode(name, parsed.pointer) : resolved

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
          servers: (document.servers ?? [])
            .filter((entry) => entry.url)
            .map(({ url, description, variables }) => {
              const declared = variables && Object.keys(variables).length > 0 ? { variables } : {}
              try {
                return { url: resolveServerUrl({ url, variables }), description, ...declared }
              } catch {
                return { url, description, ...declared }
              }
            }),
          securitySchemes: Object.entries(document.components?.securitySchemes ?? {}).flatMap(([name, value]) => {
            const scheme = refs.deref<Record<string, string>>(value)
            return scheme?.type
              ? [
                  {
                    name,
                    type: scheme.type,
                    description: scheme.description,
                    scheme: scheme.scheme,
                    bearerFormat: scheme.bearerFormat,
                    in: scheme.in,
                    parameterName: scheme.name,
                  },
                ]
              : []
          }),
          circularNames,
          enumNames,
          extensions: pickExtensions(document),
        },
      })
    }

    return {
      get document() {
        return parsedDocument
      },
      get sources() {
        return sources
      },
      locate,
      async validate(input, options) {
        const document = await parseFromConfig({ type: 'path', path: input })
        assertDocument(document)
        await validateDocument(document, options)
      },
      async settle() {
        await Promise.all(pendingValidations.splice(0))
      },
      async parse(source, { signal } = {}) {
        signal?.throwIfAborted()
        const cached = inputCache.get(source)
        if (cached) {
          sources = cached.sources
          return cached.promise
        }

        const read: Array<string> = []
        sources = read
        const promise = (async () => {
          const document = await parseFromConfig(source, read)
          signal?.throwIfAborted()
          assertDocument(document)
          if (validate) pendingValidations.push(validateDocumentInWorker(document))
          parsedDocument = document

          const refs = createRefs(document)
          const { schemas, renames, pointers } = getSchemas(document, { contentType }, refs)
          const parseSchema = createSchemaParser({ document, refs, renames, options: parserOptions })

          return parseInput({ document, refs, schemas, pointers, parseSchema })
        })()
        inputCache.set(source, { promise, sources: read })
        return promise.catch((error: unknown) => {
          // A canceled parse must not poison the cache: the next call with the same source needs a fresh attempt.
          if (signal?.aborted) inputCache.delete(source)
          throw error
        })
      },
    }
  },
})
