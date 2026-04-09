import { inject } from '@internals/utils'
import type { PluginDriver } from '@kubb/core'
import { KubbContext } from '../context/KubbContext.ts'

/**
 * @deprecated use `driver` from the generator component props instead
 */
export function useDriver(): PluginDriver {
  return inject(KubbContext)!.driver as PluginDriver
}
