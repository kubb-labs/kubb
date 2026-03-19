import type { PluginFactoryOptions, UserPluginWithLifeCycle } from './types.ts'

/**
 * Builder type for a {@link UserPluginWithLifeCycle} — takes options and returns the plugin instance.
 */
type PluginBuilder<T extends PluginFactoryOptions = PluginFactoryOptions> = (options: T['options']) => UserPluginWithLifeCycle<T>

/**
 * Creates a plugin factory. Call the returned function with optional options to get the plugin instance.
 *
 * @example
 * export const myPlugin = createPlugin<MyPlugin>((options) => {
 *   return {
 *     name: 'my-plugin',
 *     options,
 *     resolvePath(baseName) { ... },
 *     resolveName(name, type) { ... },
 *   }
 * })
 *
 * // instantiate
 * const plugin = myPlugin({ output: { path: 'src/gen' } })
 */
export function createPlugin<T extends PluginFactoryOptions = PluginFactoryOptions>(
  build: PluginBuilder<T>,
): (options?: T['options']) => UserPluginWithLifeCycle<T> {
  return (options) => build(options ?? ({} as T['options']))
}
