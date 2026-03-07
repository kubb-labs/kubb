import { nodeAdapter } from './adapters/node.ts'
import type { CLIAdapter, CommandDefinition, RunOptions } from './types.ts'

/**
 * Create a CLI runner bound to a specific adapter.
 * Defaults to the built-in `nodeAdapter` (Node.js `node:util parseArgs`).
 */
export function createCLI(options?: { adapter?: CLIAdapter }): {
  run(commands: CommandDefinition[], argv: string[], opts: RunOptions): Promise<void>
} {
  const adapter = options?.adapter ?? nodeAdapter

  return {
    run(commands, argv, opts) {
      return adapter.run(commands, argv, opts)
    },
  }
}
