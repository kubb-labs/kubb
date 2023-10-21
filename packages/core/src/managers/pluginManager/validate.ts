import type { KubbPlugin,PluginFactoryOptions } from '../../types.ts'


export class ValidationPluginError extends Error {}

// export function getDependedPlugins<T1 extends PluginFactoryOptions>(plugins:Array<KubbPlugin>, dependedPluginNames: string | string[]): [KubbPlugin<T1>]
// export function getDependedPlugins<T1 extends PluginFactoryOptions, T2 extends PluginFactoryOptions>(plugins:Array<KubbPlugin>, dependedPluginNames: string | string[]): [KubbPlugin<T1>, KubbPlugin<T2>]
export function getDependedPlugins<T1 extends PluginFactoryOptions, T2 extends PluginFactoryOptions=never,T3 extends PluginFactoryOptions=never, TOutput=  T3 extends never? T2 extends never ?  [KubbPlugin<T1>] : [KubbPlugin<T1>, KubbPlugin<T2>]: [KubbPlugin<T1>, KubbPlugin<T2>, KubbPlugin<T3>]>(plugins:Array<KubbPlugin>, dependedPluginNames: string | string[]): TOutput{
  let pluginNames: string[] = []
  if (typeof dependedPluginNames === 'string') {
    pluginNames = [dependedPluginNames]
  } else {
    pluginNames = dependedPluginNames
  }

  return pluginNames.map((pluginName) => {
    const plugin = plugins.find((plugin) => plugin.name === pluginName)
    if (!plugin) {
      throw new ValidationPluginError(`This plugin depends on the ${pluginName} plugin.`)
    }
    return plugin
  })  as TOutput
}
