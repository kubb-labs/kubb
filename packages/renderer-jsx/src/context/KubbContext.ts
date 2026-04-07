import { createContext } from '@internals/utils'

export type KubbContextValue = {
  driver: unknown
  plugin: unknown
  mode: 'single' | 'split'
}

/**
 * Context key for kubb render-time data (driver, plugin, mode).
 * Use `provide`/`unprovide` from `@internals/utils` around render calls,
 * and `inject` inside generator components.
 */
export const KubbContext = createContext<KubbContextValue | null>(null)
