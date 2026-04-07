import { inject, KubbContext } from '@kubb/renderer-jsx'
import type { PluginDriver } from '../PluginDriver.ts'

/**
 * @deprecated use `driver` from the generator component props instead
 */
export function useDriver(): PluginDriver {
  return inject(KubbContext)!.driver as PluginDriver
}
