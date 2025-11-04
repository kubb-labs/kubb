import type { PluginFactoryOptions, UserPluginWithLifeCycle } from './types.ts'

type PluginFactory<T extends PluginFactoryOptions = PluginFactoryOptions> = (options: T['options']) => UserPluginWithLifeCycle<T>

type OptionalPluginFactory<T extends PluginFactoryOptions = PluginFactoryOptions> = (options?: T['options']) => UserPluginWithLifeCycle<T>

export function createPlugin<T extends PluginFactoryOptions = PluginFactoryOptions>(factory: PluginFactory<T>): OptionalPluginFactory<T> {
  return (options = {}) => {
    return factory(options)
  }
}
