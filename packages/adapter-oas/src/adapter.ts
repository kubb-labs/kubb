import { defineExtension } from '@kubb/core'
import type { Adapter as KubbAdapter } from '@kubb/core'
import { ast, Diagnostics } from '@kubb/kit'
import type { AdapterSource } from '@kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { buildDiscriminatorChildMap, patchDiscriminatorNode } from './emit/discriminator/propagate.ts'
import type { DiscriminatorTarget } from './emit/discriminator/propagate.ts'
import { assertDocument, parseFromConfig, validateDocument, validateDocumentInWorker } from './load/normalize.ts'
import { getSchemas } from './model/components.ts'
import { toAuthSchemes } from './model/security.ts'
import { resolveBaseUrl, toInputServers } from './model/server.ts'
import { toInputTags } from './model/tag.ts'
import { getExternalDocs, pickExtensions, pickStrings } from './oas.ts'
import { camelCasePathParams, getOperations, parseOperation } from './operation.ts'
import type { ParseFn } from './emit/parseSchema.ts'
import { createSchemaParser } from './schemaParser.ts'
import { collectInlineEnums, refPromotedEnums } from './promoteEnums.ts'
import { createRefs, type Refs } from './refs.ts'
import { groupUnsupportedFormats, scanSchema } from './schemaDiagnostics.ts'
import { locate } from './sourceLocator.ts'
import type { AdapterOas, AdapterOasResolvedOptions, Document, SchemaObject } from './types.ts'

/**
 * The `name` of `@kubb/adapter-oas`, used to identify this adapter in a Kubb config.
 */
export const adapterOasName = 'oas' satisfies AdapterOas['name']

type InputCacheEntry = { promise: Promise<ast.InputNode>; sources: Array<string>; document: Document | null }

type AdapterSettings = Pick<AdapterOasResolvedOptions, 'validate' | 'contentType' | 'server' | 'discriminator' | 'enums' | 'pathParamsCasing'>

type ParserOptions = Omit<AdapterOasResolvedOptions, keyof AdapterSettings>

type ParseInputContext = {
  document: Document
  refs: Refs
  schemas: Record<string, SchemaObject>
  pointers: Map<string, string>
  parseSchema: ParseFn
}

type ParsedSchemas = {
  parsedByName: Map<string, ast.SchemaNode>
  refAliasMap: Map<string, ast.RefSchemaNode>
  discriminatorChildMap: Map<string, DiscriminatorTarget> | null
}

type PromotedEnums = ReturnType<typeof collectInlineEnums>

type AuthSchemes = ReturnType<typeof toAuthSchemes>

type ParseOptions = NonNullable<Parameters<KubbAdapter<AdapterOas>['parse']>[1]>

type ValidateOptions = Parameters<KubbAdapter<AdapterOas>['validate']>[1]

class Adapter {
  readonly locate = locate
  readonly #settings: AdapterSettings
  readonly #parserOptions: ParserOptions
  #document: Document | null = null
  #sources: Array<string> = []
  readonly #pendingValidations: Array<Promise<void>> = []

  // One cache per source: reusing one adapter instance across a `defineConfig` array must parse
  // each config's spec instead of replaying the first one, and a repeat `.parse()` call for the
  // same source must not redo the work. The `$ref` memo lives inside the `Refs` instance created
  // fresh for each document, scoped to this one pass.
  readonly #inputCache = new WeakMap<AdapterSource, InputCacheEntry>()

  constructor({ validate, contentType, server, discriminator, enums, pathParamsCasing, ...parserOptions }: AdapterOasResolvedOptions) {
    this.#settings = { validate, contentType, server, discriminator, enums, pathParamsCasing }
    this.#parserOptions = parserOptions
  }

  get document(): Document | null {
    return this.#document
  }

  get sources(): Array<string> {
    return this.#sources
  }

  // Arrow properties, so an adapter that a user spreads or destructures keeps its methods.
  validate = async (input: string, options?: ValidateOptions): Promise<void> => {
    const document = await parseFromConfig({ type: 'path', path: input }, [], { fileRefs: options?.fileRefs })
    assertDocument(document)
    await validateDocument(document, options)
  }

  settle = async (): Promise<void> => {
    await Promise.all(this.#pendingValidations.splice(0))
  }

  parse = async (source: AdapterSource, { signal, fileRefs }: ParseOptions = {}): Promise<ast.InputNode> => {
    signal?.throwIfAborted()
    const cached = this.#inputCache.get(source)
    if (cached) {
      this.#sources = cached.sources
      this.#document = cached.document
      return cached.promise
    }

    const read: Array<string> = []
    this.#sources = read
    const entry = { sources: read, document: null as Document | null }
    const promise = (async () => {
      const document = await parseFromConfig(source, read, { fileRefs, signal })
      signal?.throwIfAborted()
      assertDocument(document)
      if (this.#settings.validate) this.#pendingValidations.push(validateDocumentInWorker(document))
      entry.document = document
      this.#document = document

      const refs = createRefs(document)
      const { schemas, renames, pointers } = getSchemas(document, { contentType: this.#settings.contentType }, refs)
      const parseSchema = createSchemaParser({ document, refs, renames, options: this.#parserOptions }).parse

      return groupUnsupportedFormats(() => this.#parseInput({ document, refs, schemas, pointers, parseSchema }))
    })()
    this.#inputCache.set(source, Object.assign(entry, { promise }))
    return promise.catch((error: unknown) => {
      // A canceled parse must not poison the cache: the next call with the same source needs a fresh attempt.
      if (signal?.aborted) this.#inputCache.delete(source)
      throw error
    })
  }

  /**
   * Parses every schema and operation once, resolving ref aliases and discriminator children from that same pass.
   */
  #parseInput({ document, refs, schemas, pointers, parseSchema }: ParseInputContext): ast.InputNode {
    const { contentType, server, enums, pathParamsCasing } = this.#settings
    const parserOptions = this.#parserOptions
    const parsed = this.#parseSchemas({ schemas, pointers, parseSchema })

    const operationNodes = getOperations(document, refs).map((operation) => {
      const node = parseOperation({ operation, document, refs, contentType, options: parserOptions, parseSchema })
      return pathParamsCasing === 'camelcase' ? camelCasePathParams(node) : node
    })

    const promotedEnums = enums === 'root' ? collectInlineEnums([...parsed.parsedByName.values(), ...operationNodes], new Set(Object.keys(schemas))) : null

    const schemaNodes = resolveSchemaNodes({ names: Object.keys(schemas), parsed, promotedEnums })

    const operations = promotedEnums ? operationNodes.map((node) => refPromotedEnums(node, promotedEnums!)) : operationNodes

    const authSchemes = toAuthSchemes(document.components?.securitySchemes, refs)

    return ast.factory.createInput({
      schemas: schemaNodes,
      operations,
      meta: toInputMeta({ document, server, authSchemes }),
    })
  }

  #parseSchemas({ schemas, pointers, parseSchema }: Omit<ParseInputContext, 'document' | 'refs'>): ParsedSchemas {
    const { discriminator } = this.#settings
    const parsedByName = new Map<string, ast.SchemaNode>()
    const refAliasMap = new Map<string, ast.RefSchemaNode>()
    const discriminatorParentNodes: Array<ast.SchemaNode> = []

    for (const [name, schema] of Object.entries(schemas)) {
      const node = { ...parseSchema({ schema, name }), pointer: pointers.get(name) }
      parsedByName.set(name, node)
      scanSchema(node)
      if (node.type === 'ref' && node.name) {
        refAliasMap.set(name, node)
      }
      if (discriminator === 'propagate' && isDiscriminatorParent(schema)) {
        discriminatorParentNodes.push(node)
      }
    }

    const discriminatorChildMap: Map<string, DiscriminatorTarget> | null =
      discriminatorParentNodes.length > 0 ? buildDiscriminatorChildMap(discriminatorParentNodes) : null

    return { parsedByName, refAliasMap, discriminatorChildMap }
  }
}

function isDiscriminatorParent(schema: SchemaObject): boolean {
  return Boolean((schema.oneOf ?? schema.anyOf) && schema.discriminator?.propertyName)
}

function resolveSchemaNodes({
  names,
  parsed: { parsedByName, refAliasMap, discriminatorChildMap },
  promotedEnums,
}: {
  names: Array<string>
  parsed: ParsedSchemas
  promotedEnums: PromotedEnums | null
}): Array<ast.SchemaNode> {
  // A collapsed single-member `allOf` is named after the wrapper, so the target comes from `ref`.
  const aliasTargetOf = (name: string) => {
    const node = refAliasMap.get(name)
    return node?.ref ? ast.ref.getName(node.ref) : node?.name
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

  const schemaNodes: Array<ast.SchemaNode> = promotedEnums ? [...promotedEnums.values()] : []
  for (const name of names) {
    const aliasTarget = refAliasMap.get(name)?.name
    const aliased = aliasTarget ? parsedByName.get(aliasTarget) : undefined
    const parsed = parsedByName.get(name)!
    const child = discriminatorChildMap?.get(name)
    const base = child ? patchDiscriminatorNode(parsed, child) : parsed
    const resolved = aliased ? { ...aliased, name, pointer: parsed.pointer } : base
    const node = isAliasCycle(name) ? createCycleNode(name, parsed.pointer) : resolved

    schemaNodes.push(promotedEnums ? refPromotedEnums(node, promotedEnums) : node)
  }
  return schemaNodes
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

function toInfoMeta(info: Document['info']) {
  return {
    title: info?.title,
    description: info?.description,
    version: info?.version,
    summary: info?.summary,
    termsOfService: info?.termsOfService,
    contact: pickStrings(info?.contact, ['name', 'url', 'email']),
    license: typeof info?.license?.name === 'string' ? { ...pickStrings(info.license, ['identifier', 'url']), name: info.license.name } : undefined,
  }
}

function toInputMeta({ document, server, authSchemes }: { document: Document; server: AdapterSettings['server']; authSchemes: AuthSchemes }) {
  return {
    ...toInfoMeta(document.info),
    externalDocs: getExternalDocs(document.externalDocs),
    baseURL: resolveBaseUrl({ document, server }),
    ...(server?.index !== undefined && { serverIndex: server.index }),
    servers: toInputServers(document.servers ?? []),
    ...(document.tags?.length && { tags: toInputTags(document.tags) }),
    ...(authSchemes.length && { auth: authSchemes }),
    extensions: pickExtensions(document),
  }
}

/**
 * Default Kubb adapter for OpenAPI 2.0, 3.0, 3.1, and 3.2 specifications. Reads the
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
    pathParamsCasing,
    dateType = DEFAULT_PARSER_OPTIONS.dateType,
    integerType = DEFAULT_PARSER_OPTIONS.integerType,
    unknownType = DEFAULT_PARSER_OPTIONS.unknownType,
    enumSuffix = DEFAULT_PARSER_OPTIONS.enumSuffix,
    emptySchemaType = unknownType || DEFAULT_PARSER_OPTIONS.emptySchemaType,
  }) => ({ validate, contentType, server, discriminator, enums, pathParamsCasing, dateType, integerType, unknownType, emptySchemaType, enumSuffix }),
  build: (options) => new Adapter(options),
})
