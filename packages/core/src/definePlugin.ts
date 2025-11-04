import type { PluginFactoryOptions, UserPluginWithLifeCycle } from './types.ts'

type PluginBuilder<T extends PluginFactoryOptions = PluginFactoryOptions> = (options: T['options']) => UserPluginWithLifeCycle<T>

/**
 * Wraps a plugin builder to make the options parameter optional.
 */
export function definePlugin<T extends PluginFactoryOptions = PluginFactoryOptions>(
  build: PluginBuilder<T>,
): (options?: T['options']) => UserPluginWithLifeCycle<T> {
  return (options) => build(options ?? ({} as T['options']))
}
