import { ast } from '@kubb/core'
import BaseOas from 'oas'
import { buildDiscriminatorChildMap, patchDiscriminatorNode } from './discriminator.ts'
import { createSchemaParser } from './parser.ts'
import { resolveServerUrl } from './resolvers.ts'
import type { DiscriminatorTarget } from './discriminator.ts'
import type { AdapterOas, Document, SchemaObject } from './types.ts'

type PreScanResult = {
  refAliasMap: Map<string, ast.SchemaNode>
  enumNames: string[]
  circularNames: string[]
  discriminatorChildMap: Map<string, DiscriminatorTarget> | null
}

/**
 * Reads the server URL from the document's `servers` array at `serverIndex`,
 * interpolating any `serverVariables` into the URL template.
 *
 * Returns `undefined` when `serverIndex` is omitted or out of range.
 *
 * @example Resolve the first server
 * `resolveBaseUrl({ document, serverIndex: 0 })`
 *
 * @example Override a path variable
 * `resolveBaseUrl({ document, serverIndex: 0, serverVariables: { version: 'v2' } })`
 */
export function resolveBaseUrl({
  document,
  serverIndex,
  serverVariables,
}: {
  document: Document
  serverIndex?: number
  serverVariables?: Record<string, string>
}): string | undefined {
  const server = serverIndex !== undefined ? document.servers?.at(serverIndex) : undefined

  return server?.url ? resolveServerUrl(server, serverVariables) : undefined
}

/**
 * Parses every schema once to build the lookup structures that streaming needs upfront.
 *
 * Three things happen in this single pass:
 * - `refAliasMap` records schemas that are pure `$ref` aliases so the streaming pass can inline them.
 * - `enumNames` collects the names of every enum schema so plugins skip re-scanning the stream.
 * - `circularNames` runs cycle detection, which requires all nodes in memory simultaneously.
 *   The `allNodes` array is local and drops out of scope as soon as this function returns.
 *
 * After this call, only `refAliasMap` and `discriminatorChildMap` stay alive in the adapter closure.
 * Both are proportional to the number of aliases or discriminator parents, not total schema count.
 *
 * Each schema is parsed again during the streaming pass — this is intentional.
 * Holding the parsed nodes in memory here would defeat the streaming memory benefit.
 *
 * @example
 * ```ts
 * const { refAliasMap, enumNames, circularNames } = preScan({
 *   schemas,
 *   parseSchema,
 *   parserOptions,
 *   discriminator: 'strict',
 * })
 * ```
 */
export function preScan({
  schemas,
  parseSchema,
  parserOptions,
  discriminator,
}: {
  schemas: Record<string, SchemaObject>
  parseSchema: (entry: { schema: SchemaObject; name: string }, options: ast.ParserOptions) => ast.SchemaNode
  parserOptions: ast.ParserOptions
  discriminator: AdapterOas['options']['discriminator']
}): PreScanResult {
  const allNodes: ast.SchemaNode[] = []
  const refAliasMap = new Map<string, ast.SchemaNode>()
  const enumNames: string[] = []
  const discriminatorParentNodes: ast.SchemaNode[] = []

  for (const [name, schema] of Object.entries(schemas)) {
    const node = parseSchema({ schema, name }, parserOptions)
    allNodes.push(node)
    if (node.type === 'ref' && node.name && node.name !== name) {
      refAliasMap.set(name, node)
    }
    if (ast.narrowSchema(node, ast.schemaTypes.enum) && node.name) {
      enumNames.push(node.name)
    }
    if (discriminator === 'inherit' && (schema.oneOf ?? schema.anyOf) && schema.discriminator?.propertyName) {
      discriminatorParentNodes.push(node)
    }
  }

  const circularNames = [...ast.findCircularSchemas(allNodes)]
  const discriminatorChildMap = discriminatorParentNodes.length > 0 ? buildDiscriminatorChildMap(discriminatorParentNodes) : null

  return { refAliasMap, enumNames, circularNames, discriminatorChildMap }
}

/**
 * Creates a lazy `InputStreamNode` from already-resolved adapter state.
 *
 * The schema and operation iterables each start a fresh parse pass on every
 * `[Symbol.asyncIterator]()` call. This lets multiple plugins consume the same
 * stream object independently without sharing a cursor or holding all nodes in memory.
 *
 * Ref aliases in `refAliasMap` are inlined during iteration: an alias entry is replaced
 * with its target's parsed node (but keeps the alias name) so plugins never receive bare `ref` nodes.
 *
 * @example
 * ```ts
 * const streamNode = createInputStream({ schemas, parseSchema, parseOperation, baseOas, parserOptions, refAliasMap, discriminatorChildMap, meta })
 * for await (const schema of streamNode.schemas) {
 *   // each call to for-await restarts from the first schema
 * }
 * ```
 */
export function createInputStream({
  schemas,
  parseSchema,
  parseOperation,
  baseOas,
  parserOptions,
  refAliasMap,
  discriminatorChildMap,
  meta,
}: {
  schemas: Record<string, SchemaObject>
  parseSchema: ReturnType<typeof createSchemaParser>['parseSchema']
  parseOperation: ReturnType<typeof createSchemaParser>['parseOperation']
  baseOas: BaseOas
  parserOptions: ast.ParserOptions
  refAliasMap: Map<string, ast.SchemaNode>
  discriminatorChildMap: Map<string, DiscriminatorTarget> | null
  meta: ast.InputMeta
}): ast.InputStreamNode {
  const schemasIterable: AsyncIterable<ast.SchemaNode> = {
    [Symbol.asyncIterator]() {
      return (async function* () {
        for (const [name, schema] of Object.entries(schemas)) {
          const parsed = parseSchema({ schema, name }, parserOptions)
          const patched = discriminatorChildMap?.get(name) ? patchDiscriminatorNode(parsed, discriminatorChildMap.get(name)!) : parsed
          const alias = refAliasMap.get(name)
          const node = alias?.name && schemas[alias.name] ? { ...parseSchema({ schema: schemas[alias.name]!, name: alias.name }, parserOptions), name } : patched
          yield node
        }
      })()
    },
  }

  const operationsIterable: AsyncIterable<ast.OperationNode> = {
    [Symbol.asyncIterator]() {
      return (async function* () {
        for (const methods of Object.values(baseOas.getPaths())) {
          for (const operation of Object.values(methods)) {
            if (!operation) continue
            const node = parseOperation(parserOptions, operation)
            if (node) yield node
          }
        }
      })()
    },
  }

  return ast.createStreamInput(schemasIterable, operationsIterable, meta)
}
