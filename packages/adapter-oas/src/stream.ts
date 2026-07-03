import { ast, findCircularSchemas } from '@kubb/ast'
import { buildDiscriminatorChildMap, patchDiscriminatorNode } from './discriminator.ts'
import { getOperations } from './operation.ts'
import type { SchemaParser } from './parser.ts'
import { collectInlineEnums, refPromotedEnums } from './promoteEnums.ts'
import { resolveServerUrl } from './resolvers.ts'
import { reportSchemaDiagnostics } from './schemaDiagnostics.ts'
import type { DiscriminatorTarget } from './discriminator.ts'
import type { AdapterOas, Document, SchemaObject, ServerOptions } from './types.ts'

export type PreScanResult = {
  refAliasMap: Map<string, ast.SchemaNode>
  enumNames: Array<string>
  circularNames: Array<string>
  discriminatorChildMap: Map<string, DiscriminatorTarget> | null
  promotedEnums: Map<string, ast.SchemaNode> | null
}

/**
 * Reads the server URL from the document's `servers` array at `server.index`,
 * interpolating any `server.variables` into the URL template.
 *
 * Returns `null` when `server.index` is omitted or out of range.
 *
 * @example Resolve the first server
 * `resolveBaseUrl({ document, server: { index: 0 } })`
 *
 * @example Override a path variable
 * `resolveBaseUrl({ document, server: { index: 0, variables: { version: 'v2' } } })`
 */
export function resolveBaseUrl({ document, server }: { document: Document; server?: ServerOptions }): string | null {
  const index = server?.index
  const entry = index !== undefined ? document.servers?.at(index) : undefined
  return entry?.url ? resolveServerUrl(entry, server?.variables) : null
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
 *   discriminator: 'preserve',
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
  enums = 'inline',
}: {
  schemas: Record<string, SchemaObject>
  parseSchema: (entry: { schema: SchemaObject; name: string }, options: ast.ParserOptions) => ast.SchemaNode
  parseOperation?: SchemaParser['parseOperation']
  document?: Document
  parserOptions: ast.ParserOptions
  discriminator: AdapterOas['options']['discriminator']
  enums?: AdapterOas['options']['enums']
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
    if (discriminator === 'propagate' && (schema.oneOf ?? schema.anyOf) && schema.discriminator?.propertyName) {
      discriminatorParentNodes.push(node)
    }
  }

  const circularNames = [...findCircularSchemas(allNodes)]
  const discriminatorChildMap = discriminatorParentNodes.length > 0 ? buildDiscriminatorChildMap(discriminatorParentNodes) : null

  let promotedEnums: Map<string, ast.SchemaNode> | null = null
  if (enums === 'root' && document && parseOperation) {
    // Walk operations too so inline enums in request/response bodies are promoted.
    const operationNodes: Array<ast.OperationNode> = []
    for (const operation of getOperations(document)) {
      const operationNode = parseOperation(parserOptions, operation)
      if (operationNode) operationNodes.push(operationNode)
    }

    promotedEnums = collectInlineEnums([...allNodes, ...operationNodes], new Set(Object.keys(schemas)))
    for (const name of promotedEnums.keys()) enumNames.push(name)
  }

  return { refAliasMap, enumNames, circularNames, discriminatorChildMap, promotedEnums }
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
  promotedEnums,
  meta,
}: {
  schemas: Record<string, SchemaObject>
  parseSchema: SchemaParser['parseSchema']
  parseOperation: SchemaParser['parseOperation']
  document: Document
  parserOptions: ast.ParserOptions
  refAliasMap: Map<string, ast.SchemaNode>
  discriminatorChildMap: Map<string, DiscriminatorTarget> | null
  promotedEnums?: Map<string, ast.SchemaNode> | null
  meta: ast.InputMeta
}): ast.InputNode<true> {
  const schemasIterable: AsyncIterable<ast.SchemaNode> = {
    [Symbol.asyncIterator]() {
      return (async function* () {
        // Promoted enums are emitted first so the schema list owns the lifted definitions.
        if (promotedEnums) {
          for (const definition of promotedEnums.values()) yield definition
        }

        for (const [name, schema] of Object.entries(schemas)) {
          // Inline ref aliases: replace the alias entry with its target's parsed node
          // (keeping the alias name). Skip the first parse entirely for alias entries
          // since that result is never used.
          const alias = refAliasMap.get(name)
          if (alias?.name && schemas[alias.name]) {
            const aliasNode = { ...parseSchema({ schema: schemas[alias.name]!, name: alias.name }, parserOptions), name }
            yield promotedEnums ? refPromotedEnums(aliasNode, promotedEnums) : aliasNode
            continue
          }

          const parsed = parseSchema({ schema, name }, parserOptions)
          const node = discriminatorChildMap?.get(name) ? patchDiscriminatorNode(parsed, discriminatorChildMap.get(name)!) : parsed
          yield promotedEnums ? refPromotedEnums(node, promotedEnums) : node
        }
      })()
    },
  }

  const operationsIterable: AsyncIterable<ast.OperationNode> = {
    [Symbol.asyncIterator]() {
      return (async function* () {
        for (const operation of getOperations(document)) {
          const node = parseOperation(parserOptions, operation)
          if (node) yield promotedEnums ? refPromotedEnums(node, promotedEnums) : node
        }
      })()
    },
  }

  return ast.factory.createInput({ stream: true, schemas: schemasIterable, operations: operationsIterable, meta })
}
