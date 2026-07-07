import type { PluginFactoryOptions } from './definePlugin.ts'
import { Resolver, type ResolverBuildOptions } from './Resolver.ts'

/**
 * The plugin-specific resolver fields handed to `createResolver`. `name` and `file` fall
 * back to the built-ins when omitted. Every method reaches sibling helpers through `this`,
 * which `ThisType` types as the full resolver.
 */
type ResolverOptions<T extends PluginFactoryOptions> = Omit<T['resolver'], keyof Resolver> & {
  pluginName: T['name']
  name?: T['resolver']['name']
  file?: T['resolver']['file']
} & ThisType<T['resolver']>

/**
 * Defines a plugin resolver, the object that decides what every generated symbol and file
 * path is called. Override the top-level `name` and `file` to set the plugin's conventions,
 * and add your own naming helpers, top-level (`typeName`, …) or grouped in namespaces
 * (`query`, `schema`, …). Every method reaches sibling helpers and the built-in machinery
 * through `this.name`, `this.file`, and `this.default`.
 *
 * @example Custom identifier and file casing
 * ```ts
 * export const resolverTs = createResolver<PluginTs>({
 *   pluginName: 'plugin-ts',
 *   name(name) {
 *     return ensureValidVarName(pascalCase(name))
 *   },
 *   file(params, context) {
 *     return this.default.file({ ...params, resolveName: (name) => toFilePath(name, pascalCase) }, context)
 *   },
 * })
 * ```
 */
export function createResolver<T extends PluginFactoryOptions>(options: ResolverOptions<T>): T['resolver'] {
  return new Resolver(options as unknown as ResolverBuildOptions) as T['resolver']
}
