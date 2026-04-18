import type { HookStylePlugin, PluginFactoryOptions } from './types.ts'

/**
 * @deprecated Use `definePlugin` instead.
 */
export function createPlugin<T extends PluginFactoryOptions = PluginFactoryOptions>(
  build: (options: T['options']) => HookStylePlugin<T>,
): (options?: T['options']) => HookStylePlugin<T> {
  return (options) => build(options ?? ({} as T['options']))
}
