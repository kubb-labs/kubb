import type { UserConfig } from '@kubb/core'

export type Options = {
  config?: Omit<UserConfig, 'hooks'>
}
