import type { UserConfig } from '@kubb/core'

export type Options = {
  /**
   * Kubb config without the Hooks.
   */
  config?: Omit<UserConfig, 'hooks'>
}
