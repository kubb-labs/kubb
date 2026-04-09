import { inject } from '@internals/utils'
import type { Plugin, PluginFactoryOptions } from '@kubb/core'
import { KubbContext } from '../context/KubbContext.ts'

/**
 * @deprecated use `plugin` from the generator component props instead
 */
export function usePlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(): Plugin<TOptions> {
  return inject(KubbContext)!.plugin as Plugin<TOptions>
}
