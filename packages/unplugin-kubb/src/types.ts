import type { Config } from '@kubb/core'

export type Options = {
  /**
   * Kubb config without the Hooks.
   */
  config?: Omit<Config, 'hooks'>
}
