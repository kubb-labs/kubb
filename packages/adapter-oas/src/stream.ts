import { findCircularSchemas } from '@kubb/ast/utils'
import { ast } from '@kubb/core'
import type { DedupePlan } from './dedupe.ts'
import { oasDialect } from './dialect.ts'
import { buildDiscriminatorChildMap, patchDiscriminatorNode } from './discriminator.ts'
import { getOperations } from './operation.ts'
import type { SchemaParser } from './parser.ts'
import { resolveServerUrl } from './resolvers.ts'
import { reportSchemaDiagnostics } from './schemaDiagnostics.ts'
import type { DiscriminatorTarget } from './discriminator.ts'
import type { AdapterOas, Document, SchemaObject } from './types.ts'

export type PreScanResult = {
  refAliasMap: Map<string, ast.SchemaNode>
  enumNames: Array<string>
  circularNames: Array<string>
  discriminatorChildMap: Map<string, DiscriminatorTarget> | null
  dedupePlan: DedupePlan | null
}

/**
 * Reads the server URL from the document's `servers` array at `serverIndex`,
 * interpolating any `serverVariables` into the URL template.
 *
 * Returns `null` when `serverIndex` is omitted or out of range.
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
}): string | null {
  const server = serverIndex !== undefined ? document.servers?.at(serverIndex) : undefined
  return server?.url ? resolveServerUrl(server, serverVariables) : null
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
 * Each schema is parsed again during the streaming pass. This is intentional.
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
  parseOperation,
  document,
  parserOptions,
  discriminator,
  dedupe,
}: {
  schemas: Record<string, SchemaObject>
  parseSchema: (entry: { schema: SchemaObject; name: string }, options: ast.ParserOptions) => ast.SchemaNode
  parseOperation: SchemaParser['parseOperation']
  document: Document
  parserOptions: ast.ParserOptions
  discriminator: AdapterOas['options']['discriminator']
  dedupe: boolean
}): PreScanResult {
  const allNodes: Array<ast.SchemaNode> = []
  const refAliasMap = new Map<string, ast.SchemaNode>()
  const enumNames: Array<string> = []
  const discriminatorParentNodes: Array<ast.SchemaNode> = []

  for (const [name, schema] of Object.entries(schemas)) {
    const node = parseSchema({ schema, name }, parserOptions)
    allNodes.push(node)
    reportSchemaDiagnostics({ node, name })
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

  const circularNames = [...findCircularSchemas(allNodes)]
  const discriminatorChildMap = discriminatorParentNodes.length > 0 ? buildDiscriminatorChildMap(discriminatorParentNodes) : null

  let dedupePlan: DedupePlan | null = null
  if (dedupe) {
    // One extra parse pass over operations so duplicates in request/response bodies are seen.
    // Reuses the already-parsed `allNodes` for schemas, no second schema parse.
    const operationNodes: Array<ast.OperationNode> = []
    for (const operation of getOperations(document)) {
      const operationNode = parseOperation(parserOptions, operation)
      if (operationNode) operationNodes.push(operationNode)
    }

    const circularSchemas = new Set(circularNames)
    const usedNames = new Set(Object.keys(schemas))

    dedupePlan = oasDialect.dedupe.plan([...allNodes, ...operationNodes], { circularSchemas, usedNames })

    for (const definition of dedupePlan.extracted) {
      if (definition.type === 'enum' && definition.name) enumNames.push(definition.name)
    }
  }

  // Enum names that duplicate an earlier schema's content are never emitted, so they are not
  // advertised to plugins either.
  const targetByName = dedupePlan?.targetByName
  const emittedEnumNames = targetByName && targetByName.size > 0 ? enumNames.filter((name) => !targetByName.has(name)) : enumNames

  return { refAliasMap, enumNames: emittedEnumNames, circularNames, discriminatorChildMap, dedupePlan }
}

/**
 * Creates a lazy `InputNode<true>` from already-resolved adapter state.
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
 * const streamNode = createInputStream({ schemas, parseSchema, parseOperation, document, parserOptions, refAliasMap, discriminatorChildMap, meta })
 * for await (const schema of streamNode.schemas) {
 *   // each call to for-await restarts from the first schema
 * }
 * ```
 */
export function createInputStream({
  schemas,
  parseSchema,
  parseOperation,
  document,
  parserOptions,
  refAliasMap,
  discriminatorChildMap,
  dedupePlan,
  meta,
}: {
  schemas: Record<string, SchemaObject>
  parseSchema: SchemaParser['parseSchema']
  parseOperation: SchemaParser['parseOperation']
  document: Document
  parserOptions: ast.ParserOptions
  refAliasMap: Map<string, ast.SchemaNode>
  discriminatorChildMap: Map<string, DiscriminatorTarget> | null
  dedupePlan: DedupePlan | null
  meta: ast.InputMeta
}): ast.InputNode<true> {
  // Rewrites a top-level schema against the dedupe plan: a structurally identical sibling
  // becomes a `ref` alias to the shared one (keeping its own name). Otherwise nested
  // duplicates are collapsed while the schema's own root is preserved.
  const rewriteTopLevelSchema = (node: ast.SchemaNode): ast.SchemaNode => {
    if (!dedupePlan) return node

    const target = dedupePlan.targetBySignature.get(ast.signatureOf(node))
    if (target && target.name !== node.name) {
      return ast.factory.createSchema({
        type: 'ref',
        name: node.name ?? null,
        ref: target.ref,
        description: node.description,
        deprecated: node.deprecated,
      })
    }

    return oasDialect.dedupe.apply(node, dedupePlan, true)
  }

  const schemasIterable: AsyncIterable<ast.SchemaNode> = {
    [Symbol.asyncIterator]() {
      return (async function* () {
        // Extracted shared definitions are emitted first so the schema list owns the shared shapes.
        if (dedupePlan) {
          for (const definition of dedupePlan.extracted) yield definition
        }

        for (const [name, schema] of Object.entries(schemas)) {
          // A top-level schema whose content duplicates an earlier one is not emitted: every
          // ref to it is repointed at the first schema with that content, so its model would
          // be dead code.
          if (dedupePlan?.targetByName.has(name)) continue

          // Inline ref aliases: replace the alias entry with its target's parsed node
          // (keeping the alias name). Skip the first parse entirely for alias entries
          // since that result is never used.
          const alias = refAliasMap.get(name)
          if (alias?.name && schemas[alias.name]) {
            yield rewriteTopLevelSchema({ ...parseSchema({ schema: schemas[alias.name]!, name: alias.name }, parserOptions), name })
            continue
          }

          const parsed = parseSchema({ schema, name }, parserOptions)
          const node = discriminatorChildMap?.get(name) ? patchDiscriminatorNode(parsed, discriminatorChildMap.get(name)!) : parsed
          yield rewriteTopLevelSchema(node)
        }
      })()
    },
  }

  const operationsIterable: AsyncIterable<ast.OperationNode> = {
    [Symbol.asyncIterator]() {
      return (async function* () {
        for (const operation of getOperations(document)) {
          const node = parseOperation(parserOptions, operation)
          if (node) yield dedupePlan ? oasDialect.dedupe.apply(node, dedupePlan) : node
        }
      })()
    },
  }

  return ast.factory.createInput({ stream: true, schemas: schemasIterable, operations: operationsIterable, meta })
}
