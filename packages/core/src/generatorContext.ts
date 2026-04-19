import { AsyncLocalStorage } from 'node:async_hooks'
import type { GeneratorContext } from './types.ts'

/**
 * Stores the active GeneratorContext for the current async execution tree.
 * Populated by runPluginAstHooks() before each generator method call.
 */
export const generatorContextStorage = new AsyncLocalStorage<GeneratorContext>()

/**
 * Returns the GeneratorContext for the currently-executing generator method,
 * or throws when called outside the generator execution tree.
 */
export function getGeneratorContext(): GeneratorContext {
  const ctx = generatorContextStorage.getStore()
  if (!ctx) {
    throw new Error(
      '[kubb] Virtual module accessor called outside a generator context. ' +
        'Use kubb:files and kubb:driver only inside a schema(), operation(), or operations() method.',
    )
  }
  return ctx
}
