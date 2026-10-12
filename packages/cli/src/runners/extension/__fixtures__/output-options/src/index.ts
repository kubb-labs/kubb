import { definePlugin } from '@kubb/core'
import type { OutputOptions, PluginFactoryOptions } from '@kubb/core'

export type Options = OutputOptions & {
  /**
   * Casing of names.
   *
   * @default 'camel'
   */
  casing?: 'camel' | 'snake'
}

export const pluginOutputOptions = definePlugin<PluginFactoryOptions<'plugin-output-options', Options>>({
  meta: { name: 'plugin-output-options' },
})
