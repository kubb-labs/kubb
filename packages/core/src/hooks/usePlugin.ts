import { inject, KubbContext } from '@kubb/renderer-jsx'
import type { Plugin, PluginFactoryOptions } from '../types.ts'

/**
 * @deprecated use `plugin` from the generator component props instead
 */
export function usePlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(): Plugin<TOptions> {
  return inject(KubbContext)!.plugin as Plugin<TOptions>
}
