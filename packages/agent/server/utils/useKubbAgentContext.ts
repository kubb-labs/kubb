import { AsyncLocalStorage } from 'node:async_hooks'
import type { Config, KubbEvents } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'

export type KubbAgentContext = {
  config: Config
  events: AsyncEventEmitter<KubbEvents>
  onGenerate: () => Promise<void>
}

export const contextStorage = new AsyncLocalStorage<KubbAgentContext>()

export function useKubbAgentContext(): KubbAgentContext {
  const context = contextStorage.getStore()
  if (!context) {
    throw new Error('Kubb agent context not initialized. Make sure KUBB_CONFIG environment variable is set.')
  }
  return context
}
