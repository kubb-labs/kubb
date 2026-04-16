import path from 'node:path'
import { camelCase, pascalCase } from '@internals/utils'
import type { FileNode, InputNode, Node, OperationNode, SchemaNode } from '@kubb/ast'
import { createFile, isOperationNode, isSchemaNode } from '@kubb/ast'
import { getMode } from './PluginDriver.ts'
import type {
  Config,
  PluginFactoryOptions,
  ResolveBannerContext,
  ResolveNameParams,
  ResolveOptionsContext,
  Resolver,
  ResolverContext,
  ResolverFileParams,
  ResolverPathParams,
} from './types.ts'

/**
 * Builder type for the plugin-specific resolver fields.
 *
 * `default`, `resolveOptions`, `resolvePath`, `resolveFile`, `resolveBanner`, and `resolveFooter`
 * are optional — built-in fallbacks are injected when omitted.
 */
type ResolverBuilder<T extends PluginFactoryOptions> = () => Omit<
  T['resolver'],
  'default' | 'resolveOptions' | 'resolvePath' | 'resolveFile' | 'resolveBanner' | 'resolveFooter' | 'name' | 'pluginName'
> &
  Partial<Pick<T['resolver'], 'default' | 'resolveOptions' | 'resolvePath' | 'resolveFile' | 'resolveBanner' | 'resolveFooter'>> & {
    name: string
    pluginName: T['name']
  } & ThisType<T['resolver']>

/**
 * Checks if an operation matches a pattern for a given filter type (`tag`, `operationId`, `path`, `method`).
 */
function matchesOperationPattern(node: OperationNode, type: string, pattern: string | RegExp): boolean {
  switch (type) {
    case 'tag':
      return node.tags.some((tag) => !!tag.match(pattern))
    case 'operationId':
      return !!node.operationId.match(pattern)
    case 'path':
      return !!node.path.match(pattern)
    case 'method':
      return !!(node.method.toLowerCase() as string).match(pattern)
    case 'contentType':
      return !!node.requestBody?.contentType?.match(pattern)
    default:
      return false
  }
}

/**
 * Checks if a schema matches a pattern for a given filter type (`schemaName`).
 *
 * Returns `null` when the filter type doesn't apply to schemas.
 */
function matchesSchemaPattern(node: SchemaNode, type: string, pattern: string | RegExp): boolean | null {
  switch (type) {
    case 'schemaName':
      return node.name ? !!node.name.match(pattern) : false
    default:
      return null
  }
}

/**
 * Default name resolver used by `defineResolver`.
 *
 * - `camelCase` for `function` and `file` types.
 * - `PascalCase` for `type`.
 * - `camelCase` for everything else.
 */
function defaultResolver(name: ResolveNameParams['name'], type: ResolveNameParams['type']): string {
  let resolvedName = camelCase(name)

  if (type === 'file' || type === 'function') {
    resolvedName = camelCase(name, {
      isFile: type === 'file',
    })
  }

  if (type === 'type') {
    resolvedName = pascalCase(name)
  }

  return resolvedName
}

/**
 * Default option resolver — applies include/exclude filters and merges matching override options.
 *
 * Returns `null` when the node is filtered out by an `exclude` rule or not matched by any `include` rule.
 *
 * @example Include/exclude filtering
 * ```ts
 * const options = defaultResolveOptions(operationNode, {
 *   options: { output: 'types' },
 *   exclude: [{ type: 'tag', pattern: 'internal' }],
 * })
 * // → null when node has tag 'internal'
 * ```
 *
 * @example Override merging
 * ```ts
 * const options = defaultResolveOptions(operationNode, {
 *   options: { enumType: 'asConst' },
 *   override: [{ type: 'operationId', pattern: 'listPets', options: { enumType: 'enum' } }],
 * })
 * // → { enumType: 'enum' } when operationId matches
 * ```
 */
export function defaultResolveOptions<TOptions>(
  node: Node,
  { options, exclude = [], include, override = [] }: ResolveOptionsContext<TOptions>,
): TOptions | null {
  if (isOperationNode(node)) {
    const isExcluded = exclude.some(({ type, pattern }) => matchesOperationPattern(node, type, pattern))
    if (isExcluded) {
      return null
    }

    if (include && !include.some(({ type, pattern }) => matchesOperationPattern(node, type, pattern))) {
      return null
    }

    const overrideOptions = override.find(({ type, pattern }) => matchesOperationPattern(node, type, pattern))?.options

    return { ...options, ...overrideOptions }
  }

  if (isSchemaNode(node)) {
    if (exclude.some(({ type, pattern }) => matchesSchemaPattern(node, type, pattern) === true)) {
      return null
    }

    if (include) {
      const results = include.map(({ type, pattern }) => matchesSchemaPattern(node, type, pattern))
      const applicable = results.filter((r) => r !== null)
      if (applicable.length > 0 && !applicable.includes(true)) {
        return null
      }
    }

    const overrideOptions = override.find(({ type, pattern }) => matchesSchemaPattern(node, type, pattern) === true)?.options

    return { ...options, ...overrideOptions }
  }

  return options
}

/**
 * Default path resolver used by `defineResolver`.
 *
 * - Returns the output directory in `single` mode.
 * - Resolves into a tag- or path-based subdirectory when `group` and a `tag`/`path` value are provided.
 * - Falls back to a flat `output/baseName` path otherwise.
 *
 * A custom `group.name` function overrides the default subdirectory naming.
 * For `tag` groups the default is `${camelCase(tag)}Controller`.
 * For `path` groups the default is the first path segment after `/`.
 *
 * @example Flat output
 * ```ts
 * defaultResolvePath({ baseName: 'petTypes.ts' }, { root: '/src', output: { path: 'types' } })
 * // → '/src/types/petTypes.ts'
 * ```
 *
 * @example Tag-based grouping
 * ```ts
 * defaultResolvePath(
 *   { baseName: 'petTypes.ts', tag: 'pets' },
 *   { root: '/src', output: { path: 'types' }, group: { type: 'tag' } },
 * )
 * // → '/src/types/petsController/petTypes.ts'
 * ```
 *
 * @example Path-based grouping
 * ```ts
 * defaultResolvePath(
 *   { baseName: 'petTypes.ts', path: '/pets/list' },
 *   { root: '/src', output: { path: 'types' }, group: { type: 'path' } },
 * )
 * // → '/src/types/pets/petTypes.ts'
 * ```
 *
 * @example Single-file mode
 * ```ts
 * defaultResolvePath(
 *   { baseName: 'petTypes.ts', pathMode: 'single' },
 *   { root: '/src', output: { path: 'types' } },
 * )
 * // → '/src/types'
 * ```
 */
export function defaultResolvePath({ baseName, pathMode, tag, path: groupPath }: ResolverPathParams, { root, output, group }: ResolverContext): string {
  const mode = pathMode ?? getMode(path.resolve(root, output.path))

  if (mode === 'single') {
    return path.resolve(root, output.path)
  }

  if (group && (groupPath || tag)) {
    return path.resolve(root, output.path, group.name({ group: group.type === 'path' ? groupPath! : tag! }), baseName)
  }

  return path.resolve(root, output.path, baseName)
}

/**
 * Default file resolver used by `defineResolver`.
 *
 * Resolves a `FileNode` by combining name resolution (`resolver.default`) with
 * path resolution (`resolver.resolvePath`). The resolved file always has empty
 * `sources`, `imports`, and `exports` arrays — consumers populate those separately.
 *
 * In `single` mode the name is omitted and the file sits directly in the output directory.
 *
 * @example Resolve a schema file
 * ```ts
 * const file = defaultResolveFile.call(resolver,
 *   { name: 'pet', extname: '.ts' },
 *   { root: '/src', output: { path: 'types' } },
 * )
 * // → { baseName: 'pet.ts', path: '/src/types/pet.ts', sources: [], ... }
 * ```
 *
 * @example Resolve an operation file with tag grouping
 * ```ts
 * const file = defaultResolveFile.call(resolver,
 *   { name: 'listPets', extname: '.ts', tag: 'pets' },
 *   { root: '/src', output: { path: 'types' }, group: { type: 'tag' } },
 * )
 * // → { baseName: 'listPets.ts', path: '/src/types/petsController/listPets.ts', ... }
 * ```
 */
export function defaultResolveFile(this: Resolver, { name, extname, tag, path: groupPath }: ResolverFileParams, context: ResolverContext): FileNode {
  const pathMode = getMode(path.resolve(context.root, context.output.path))
  const resolvedName = pathMode === 'single' ? '' : this.default(name, 'file')
  const baseName = `${resolvedName}${extname}` as FileNode['baseName']
  const filePath = this.resolvePath({ baseName, pathMode, tag, path: groupPath }, context)

  return createFile({
    path: filePath,
    baseName: path.basename(filePath) as `${string}.${string}`,
    meta: {
      pluginName: this.pluginName,
    },
    sources: [],
    imports: [],
    exports: [],
  })
}

/**
 * Generates the default "Generated by Kubb" banner from config and optional node metadata.
 */
export function buildDefaultBanner({
  title,
  description,
  version,
  config,
}: {
  title?: string
  description?: string
  version?: string
  config: Config
}): string {
  try {
    let source = ''
    if (Array.isArray(config.input)) {
      const first = config.input[0]
      if (first && 'path' in first) {
        source = path.basename(first.path)
      }
    } else if ('path' in config.input) {
      source = path.basename(config.input.path)
    } else if ('data' in config.input) {
      source = 'text content'
    }

    let banner = '/**\n* Generated by Kubb (https://kubb.dev/).\n* Do not edit manually.\n'

    if (config.output.defaultBanner === 'simple') {
      banner += '*/\n'
      return banner
    }

    if (source) {
      banner += `* Source: ${source}\n`
    }

    if (title) {
      banner += `* Title: ${title}\n`
    }

    if (description) {
      const formattedDescription = description.replace(/\n/gm, '\n* ')
      banner += `* Description: ${formattedDescription}\n`
    }

    if (version) {
      banner += `* OpenAPI spec version: ${version}\n`
    }

    banner += '*/\n'
    return banner
  } catch (_error) {
    return '/**\n* Generated by Kubb (https://kubb.dev/).\n* Do not edit manually.\n*/'
  }
}

/**
 * Default banner resolver — returns the banner string for a generated file.
 *
 * A user-supplied `output.banner` overrides the default Kubb "Generated by Kubb" notice.
 * When no `output.banner` is set, the Kubb notice is used (including `title` and `version`
 * from the OAS spec when a `node` is provided).
 *
 * - When `output.banner` is a function and `node` is provided, returns `output.banner(node)`.
 * - When `output.banner` is a function and `node` is absent, falls back to the Kubb notice.
 * - When `output.banner` is a string, returns it directly.
 * - When `config.output.defaultBanner` is `false`, returns `undefined`.
 * - Otherwise returns the Kubb "Generated by Kubb" notice.
 *
 * @example String banner overrides default
 * ```ts
 * defaultResolveBanner(undefined, { output: { banner: '// my banner' }, config })
 * // → '// my banner'
 * ```
 *
 * @example Function banner with node
 * ```ts
 * defaultResolveBanner(inputNode, { output: { banner: (node) => `// v${node.version}` }, config })
 * // → '// v3.0.0'
 * ```
 *
 * @example No user banner — Kubb notice with OAS metadata
 * ```ts
 * defaultResolveBanner(inputNode, { config })
 * // → '/** Generated by Kubb ... Title: Pet Store ... *\/'
 * ```
 *
 * @example Disabled default banner
 * ```ts
 * defaultResolveBanner(undefined, { config: { output: { defaultBanner: false }, ...config } })
 * // → undefined
 * ```
 */
export function defaultResolveBanner(node: InputNode | undefined, { output, config }: ResolveBannerContext): string | undefined {
  if (typeof output?.banner === 'function') {
    return output.banner(node)
  }

  if (typeof output?.banner === 'string') {
    return output.banner
  }

  if (config.output.defaultBanner === false) {
    return undefined
  }

  return buildDefaultBanner({ title: node?.meta?.title, version: node?.meta?.version, config })
}

/**
 * Default footer resolver — returns the footer string for a generated file.
 *
 * - When `output.footer` is a function and `node` is provided, calls it with the node.
 * - When `output.footer` is a function and `node` is absent, returns `undefined`.
 * - When `output.footer` is a string, returns it directly.
 * - Otherwise returns `undefined`.
 *
 * @example String footer
 * ```ts
 * defaultResolveFooter(undefined, { output: { footer: '// end of file' }, config })
 * // → '// end of file'
 * ```
 *
 * @example Function footer with node
 * ```ts
 * defaultResolveFooter(inputNode, { output: { footer: (node) => `// ${node.title}` }, config })
 * // → '// Pet Store'
 * ```
 */
export function defaultResolveFooter(node: InputNode | undefined, { output }: ResolveBannerContext): string | undefined {
  if (typeof output?.footer === 'function') {
    return node ? output.footer(node) : undefined
  }
  if (typeof output?.footer === 'string') {
    return output.footer
  }
  return undefined
}

/**
 * Defines a resolver for a plugin, injecting built-in defaults for name casing,
 * include/exclude/override filtering, path resolution, and file construction.
 *
 * All four defaults can be overridden by providing them in the builder function:
 * - `default` — name casing strategy (camelCase / PascalCase)
 * - `resolveOptions` — include/exclude/override filtering
 * - `resolvePath` — output path computation
 * - `resolveFile` — full `FileNode` construction
 *
 * Methods in the builder have access to `this` (the full resolver object), so they
 * can call other resolver methods without circular imports.
 *
 * @example Basic resolver with naming helpers
 * ```ts
 * export const resolver = defineResolver<PluginTs>(() => ({
 *   name: 'default',
 *   resolveName(node) {
 *     return this.default(node.name, 'function')
 *   },
 *   resolveTypedName(node) {
 *     return this.default(node.name, 'type')
 *   },
 * }))
 * ```
 *
 * @example Override resolvePath for a custom output structure
 * ```ts
 * export const resolver = defineResolver<PluginTs>(() => ({
 *   name: 'custom',
 *   resolvePath({ baseName }, { root, output }) {
 *     return path.resolve(root, output.path, 'generated', baseName)
 *   },
 * }))
 * ```
 *
 * @example Use this.default inside a helper
 * ```ts
 * export const resolver = defineResolver<PluginTs>(() => ({
 *   name: 'default',
 *   resolveParamName(node, param) {
 *     return this.default(`${node.operationId} ${param.in} ${param.name}`, 'type')
 *   },
 * }))
 * ```
 */
export function defineResolver<T extends PluginFactoryOptions>(build: ResolverBuilder<T>): T['resolver'] {
  return {
    default: defaultResolver,
    resolveOptions: defaultResolveOptions,
    resolvePath: defaultResolvePath,
    resolveFile: defaultResolveFile,
    resolveBanner: defaultResolveBanner,
    resolveFooter: defaultResolveFooter,
    ...build(),
  } as T['resolver']
}
