import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { ast, createAdapter } from '@kubb/core'
import type { AdapterStreamSource, Storage } from '@kubb/core'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { collectDiscriminatorTargets, type DiscriminatorChildMap, patchDiscriminatorChild } from './discriminator.ts'
import { parseDocument, parseFromConfig, validateDocument } from './factory.ts'
import { parseOasStreaming } from './parser.ts'
import { resolveServerUrl } from './resolvers.ts'
import type { AdapterOas, Document } from './types.ts'

const AST_PREFIX = '.kubb/.cache'

function safeKey(value: string): string {
  return value.replace(/[^A-Za-z0-9_.-]/g, '_')
}

function cacheDir(root: string, namespace: string): string {
  return path.resolve(root, AST_PREFIX, namespace)
}

function schemaKey(root: string, namespace: string, index: number, name: string): string {
  return path.resolve(cacheDir(root, namespace), 'schemas', `${String(index).padStart(6, '0')}-${safeKey(name)}.json`)
}

function operationKey(root: string, namespace: string, index: number, id: string): string {
  return path.resolve(cacheDir(root, namespace), 'operations', `${String(index).padStart(6, '0')}-${safeKey(id)}.json`)
}

/**
 * Builds an {@link AdapterStreamSource} backed by `storage`. The maps capture
 * the resolved storage key per name/id so re-reads in `loadSchema` /
 * `loadOperation` do not need to scan the cache directory.
 */
function createStorageStreamSource(args: {
  storage: Storage
  namespaceDir: string
  schemaNames: string[]
  operationIds: string[]
  schemaKeyByName: Map<string, string>
  operationKeyById: Map<string, string>
}): AdapterStreamSource {
  const { storage, namespaceDir, schemaNames, operationIds, schemaKeyByName, operationKeyById } = args

  async function loadFromKey<T>(key: string | undefined): Promise<T | undefined> {
    if (!key) return undefined
    const raw = await storage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : undefined
  }

  return {
    schemas: {
      async *[Symbol.asyncIterator]() {
        for (const name of schemaNames) {
          const node = await loadFromKey<ast.SchemaNode>(schemaKeyByName.get(name))
          if (node) yield node
        }
      },
    },
    operations: {
      async *[Symbol.asyncIterator]() {
        for (const id of operationIds) {
          const node = await loadFromKey<ast.OperationNode>(operationKeyById.get(id))
          if (node) yield node
        }
      },
    },
    schemaNames,
    operationIds,
    schemaCount: schemaNames.length,
    operationCount: operationIds.length,
    async loadSchema(name) {
      return loadFromKey<ast.SchemaNode>(schemaKeyByName.get(name))
    },
    async loadOperation(id) {
      return loadFromKey<ast.OperationNode>(operationKeyById.get(id))
    },
    async dispose() {
      try {
        await storage.clear(namespaceDir)
      } catch {
        // best-effort cleanup
      }
    },
  }
}

/**
 * Builds an in-memory {@link AdapterStreamSource} for the no-storage fallback
 * path (e.g. ad-hoc adapter usage outside `createKubb`). Holds nodes in maps
 * so iteration and random access stay O(1).
 */
function createMemoryStreamSource(schemas: ast.SchemaNode[], operations: ast.OperationNode[]): AdapterStreamSource {
  const schemaMap = new Map<string, ast.SchemaNode>()
  const schemaNames: string[] = []
  schemas.forEach((schema, index) => {
    const name = schema.name ?? `__anonymous_schema_${index}`
    schemaMap.set(name, schema)
    schemaNames.push(name)
  })

  const operationMap = new Map<string, ast.OperationNode>()
  const operationIds: string[] = []
  operations.forEach((operation, index) => {
    const id = operation.operationId ?? `${operation.method}_${operation.path}_${index}`
    operationMap.set(id, operation)
    operationIds.push(id)
  })

  return {
    schemas: {
      async *[Symbol.asyncIterator]() {
        for (const name of schemaNames) yield schemaMap.get(name)!
      },
    },
    operations: {
      async *[Symbol.asyncIterator]() {
        for (const id of operationIds) yield operationMap.get(id)!
      },
    },
    schemaNames,
    operationIds,
    schemaCount: schemas.length,
    operationCount: operations.length,
    async loadSchema(name) {
      return schemaMap.get(name)
    },
    async loadOperation(id) {
      return operationMap.get(id)
    },
  }
}

/**
 * Stable string identifier for the OAS adapter used in Kubb's adapter registry.
 */
export const adapterOasName = 'oas' satisfies AdapterOas['name']

/**
 * Creates the default OpenAPI / Swagger adapter for Kubb.
 *
 * Parses the spec, optionally validates it, resolves the base URL, and exposes
 * each parsed schema and operation through `adapter.source` (a streaming view
 * backed by `config.storage` under `.kubb/.cache`). The returned `InputNode`
 * itself stays small — meta only — so plugins always interact with the same
 * primitives regardless of spec size.
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
    bundle = true,
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
  let streamSource: AdapterStreamSource | null = null

  return {
    name: adapterOasName,
    get options() {
      return {
        validate,
        bundle,
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
    get source() {
      return streamSource
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
    async parse(source, context) {
      const document = await parseFromConfig(source, { bundle })

      if (validate) {
        await validateDocument(document)
      }

      const server = serverIndex !== undefined ? document.servers?.at(serverIndex) : undefined
      const baseURL = server?.url ? resolveServerUrl(server, serverVariables) : undefined

      const meta = {
        title: document.info?.title,
        description: document.info?.description,
        version: document.info?.version,
        baseURL,
      }

      const parserOptions = { contentType, dateType, integerType, unknownType, emptySchemaType, enumSuffix }

      // No storage context (e.g. ad-hoc adapter usage outside `createKubb`):
      // collect everything in memory and expose it via an in-memory source.
      if (!context) {
        const schemas: ast.SchemaNode[] = []
        const operations: ast.OperationNode[] = []
        const childMap: DiscriminatorChildMap = new Map()

        const { nameMapping: parsedNameMapping } = await parseOasStreaming(document, parserOptions, {
          onSchema(node) {
            if (discriminator === 'inherit') collectDiscriminatorTargets(node, childMap)
            schemas.push(node)
          },
          onOperation(node) {
            operations.push(node)
          },
        })

        const finalSchemas = discriminator === 'inherit' && childMap.size > 0 ? schemas.map((s) => patchDiscriminatorChild(s, childMap)) : schemas

        nameMapping = parsedNameMapping
        parsedDocument = document
        inputNode = ast.createInput({ meta })
        streamSource = createMemoryStreamSource(finalSchemas, operations)
        return inputNode
      }

      const { storage, root } = context
      // Per-build cache directory so concurrent builds (and parallel tests)
      // don't clobber each other under the shared `.kubb/.cache` prefix.
      const namespace = `${process.pid}-${Date.now()}-${randomBytes(4).toString('hex')}`

      const childMap: DiscriminatorChildMap = new Map()
      const schemaNames: string[] = []
      const operationIds: string[] = []
      const schemaKeyByName = new Map<string, string>()
      const operationKeyById = new Map<string, string>()

      const { nameMapping: parsedNameMapping } = await parseOasStreaming(document, parserOptions, {
        async onSchema(node) {
          if (discriminator === 'inherit') collectDiscriminatorTargets(node, childMap)
          const index = schemaNames.length
          const name = node.name ?? `__anonymous_schema_${index}`
          const key = schemaKey(root, namespace, index, name)
          await storage.setItem(key, JSON.stringify(node))
          schemaNames.push(name)
          schemaKeyByName.set(name, key)
        },
        async onOperation(node) {
          const index = operationIds.length
          const id = node.operationId ?? `${node.method}_${node.path}_${index}`
          const key = operationKey(root, namespace, index, id)
          await storage.setItem(key, JSON.stringify(node))
          operationIds.push(id)
          operationKeyById.set(id, key)
        },
      })

      // Pass 2: rewrite schemas that match a discriminator target. Skipped when
      // no targets were collected, preserving the fast path.
      if (discriminator === 'inherit' && childMap.size > 0) {
        for (const name of schemaNames) {
          const key = schemaKeyByName.get(name)
          if (!key) continue
          const raw = await storage.getItem(key)
          if (!raw) continue
          const node = JSON.parse(raw) as ast.SchemaNode
          const patched = patchDiscriminatorChild(node, childMap)
          if (patched !== node) {
            await storage.setItem(key, JSON.stringify(patched))
          }
        }
      }

      nameMapping = parsedNameMapping
      parsedDocument = document

      inputNode = ast.createInput({ meta })
      streamSource = createStorageStreamSource({
        storage,
        namespaceDir: cacheDir(root, namespace),
        schemaNames,
        operationIds,
        schemaKeyByName,
        operationKeyById,
      })

      return inputNode
    },
  }
})
