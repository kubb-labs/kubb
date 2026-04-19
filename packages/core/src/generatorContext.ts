import { AsyncLocalStorage } from 'node:async_hooks'
import type { OperationNode, SchemaNode } from '@kubb/ast'
import type { GeneratorContext } from './types.ts'

export type ContextStore = {
  ctx: GeneratorContext
  /** The schema or operation node currently being processed, or null for the operations-batch call. */
  currentNode: SchemaNode | OperationNode | null
}

/**
 * Stores the active generator context for the current async execution tree.
 * Populated by runPluginAstHooks() before each generator method call.
 */
export const generatorContextStorage = new AsyncLocalStorage<ContextStore>()

function getStore(): ContextStore {
  const store = generatorContextStorage.getStore()
  if (!store) {
    throw new Error(
      '[kubb] Virtual module accessor called outside a generator context. ' +
        'Use kubb:spec and kubb:outputs only inside a schema(), operation(), or operations() method.',
    )
  }
  return store
}

export { getStore as getContextStore }
