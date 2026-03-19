import type { PluginFactoryOptions, UserPluginWithLifeCycle } from './types.ts'

type PluginBuilder<T extends PluginFactoryOptions = PluginFactoryOptions> = (options: T['options']) => UserPluginWithLifeCycle<T>

export function createPlugin<T extends PluginFactoryOptions = PluginFactoryOptions>(
  build: PluginBuilder<T>,
): (options?: T['options']) => UserPluginWithLifeCycle<T> {
  return (options) => build(options ?? ({} as T['options']))
}
