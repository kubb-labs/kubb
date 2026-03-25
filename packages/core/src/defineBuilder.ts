import type { PluginFactoryOptions } from './types.ts'

/**
 * Builder type for the plugin-specific builder fields.
 * `name` is required; all other methods are defined by the concrete plugin builder type.
 */
type BuilderBuilder<T extends PluginFactoryOptions> = () => T['builder'] & ThisType<T['builder']>

/**
 * Defines a builder for a plugin — a named collection of schema-building helpers that
 * can be exported alongside the plugin and imported by other plugins or generators.
 *
 * @example
 * export const builder = defineBuilder<PluginTs>(() => ({
 *   name: 'default',
 *   buildParamsSchema({ params, node, resolver }) {
 *     return createSchema({ type: 'object', properties: [] })
 *   },
 *   buildDataSchemaNode({ node, resolver }) {
 *     return createSchema({ type: 'object', properties: [] })
 *   },
 * }))
 */
export function defineBuilder<T extends PluginFactoryOptions>(build: BuilderBuilder<T>): T['builder'] {
  return build() as T['builder']
}
