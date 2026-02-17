import { AsyncLocalStorage } from 'node:async_hooks'
import type { Config, KubbEvents } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'

export type KubbAgentContext = {
  config: Config
  events: AsyncEventEmitter<KubbEvents>
  onGenerate: () => Promise<void>
}

export const contextStorage = new AsyncLocalStorage<KubbAgentContext>()

// Global storage for context that persists across requests
let globalContext: KubbAgentContext | null = null

export function setGlobalContext(context: KubbAgentContext) {
  globalContext = context
}

export function useKubbAgentContext(): KubbAgentContext {
  // First try AsyncLocalStorage (for request-scoped access)
  const localContext = contextStorage.getStore()
  if (localContext) {
    return localContext
  }

  // Fall back to global context
  if (globalContext) {
    return globalContext
  }

  throw new Error('Kubb agent context not initialized. Make sure KUBB_CONFIG environment variable is set.')
}
